import { SQRT_3, toVolts } from "@/lib/math/units";
import { FieldBag, metric, ok, review, roundTo, warning, type CalcInput } from "@/lib/calculations/parse";
import type { CalculationOutcome } from "@/lib/types";

/** IEC 60909-0에 공개된 첨두계수 근사: κ = 1.02 + 0.98 e^(−3R/X) */
export function peakFactorKappa(rOverX: number): number {
  if (!(rOverX >= 0) || !Number.isFinite(rOverX)) return NaN;
  return 1.02 + 0.98 * Math.exp(-3 * rOverX);
}

function seriesZ(
  r: number,
  x: number,
): { r: number; x: number; z: number; xr: number } {
  const z = Math.hypot(r, x);
  const xr = r === 0 ? Infinity : x / r;
  return { r, x, z, xr };
}

/**
 * 3상 대칭 단락 근사.
 * 불평형(1선지락 등)은 영상분 모델이 없으므로 제공하지 않습니다.
 */
export function calculateShortCircuit(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const Un = toVolts(fields.num("voltage", "공칭 선간전압"), input.voltageUnit ?? "V");
  const c = fields.optional("cFactor", 1.05, "전압계수 c");
  fields.requirePositive("voltage", "전압", Un);
  fields.requirePositive("cFactor", "c", c);
  if (c < 0.9 || c > 1.15) {
    fields.errors.cFactor = "전압계수 c는 보통 0.95~1.10 범위입니다. 적용 표준 표를 확인 후 입력하세요.";
  }

  let r = 0;
  let x = 0;

  const includeTr = input.includeTr !== "no";
  if (includeTr) {
    const sTr = fields.num("trKva", "변압기 kVA");
    const zPct = fields.num("trZpct", "변압기 %Z");
    const xrTr = fields.optional("trXr", 8, "변압기 X/R");
    fields.requirePositive("trKva", "변압기 용량", sTr);
    fields.requirePositive("trZpct", "%Z", zPct);
    fields.requirePositive("trXr", "X/R", xrTr);
    if (!fields.errors.trKva && !fields.errors.trZpct) {
      const zOhm = (zPct / 100) * (Un * Un) / (sTr * 1000);
      const xTr = zOhm / Math.sqrt(1 + 1 / (xrTr * xrTr));
      const rTr = xTr / xrTr;
      r += rTr;
      x += xTr;
    }
  }

  if (input.includeSource === "yes") {
    const mode = input.sourceMode ?? "sk";
    if (mode === "sk") {
      const skMva = fields.num("sourceMva", "계통 단락용량 MVA");
      const xrS = fields.optional("sourceXr", 10, "계통 X/R");
      fields.requirePositive("sourceMva", "단락용량", skMva);
      fields.requirePositive("sourceXr", "X/R", xrS);
      if (!fields.errors.sourceMva) {
        const zS = (Un * Un) / (skMva * 1e6);
        const xS = zS / Math.sqrt(1 + 1 / (xrS * xrS));
        const rS = xS / xrS;
        r += rS;
        x += xS;
      }
    } else {
      const rs = fields.num("sourceR", "계통 R Ω");
      const xs = fields.num("sourceX", "계통 X Ω");
      fields.requireNonNegative("sourceR", "R", rs);
      fields.requirePositive("sourceX", "X", xs);
      r += rs;
      x += xs;
    }
  }

  if (input.includeCable === "yes") {
    const len = fields.num("cableM", "케이블 길이 m");
    const rkm = fields.num("cableR", "R Ω/km");
    const xkm = fields.num("cableX", "X Ω/km");
    fields.requirePositive("cableM", "길이", len);
    fields.requireNonNegative("cableR", "R", rkm);
    fields.requireNonNegative("cableX", "X", xkm);
    r += (rkm * len) / 1000;
    x += (xkm * len) / 1000;
  }

  if (input.includeGen === "yes") {
    const sGen = fields.num("genKva", "발전기 kVA");
    const xd = fields.num("genXd", "x″d pu");
    const xrG = fields.optional("genXr", 12, "발전기 X/R");
    fields.requirePositive("genKva", "발전기", sGen);
    fields.requirePositive("genXd", "x″d", xd);
    fields.requirePositive("genXr", "X/R", xrG);
    // 발전기는 네트워크와 직렬로 넣지 않고 아래 전류원 기여로만 더합니다.
  }

  if (fields.failed()) return fields.fail();
  if (x === 0 && r === 0 && input.includeGen !== "yes" && input.includeMotor !== "yes") {
    return fields.fail("변압기, 계통, 케이블 중 하나 이상의 임피던스를 입력하세요.");
  }

  const net = seriesZ(r, x);
  const IkNet = net.z > 0 ? (c * Un) / (SQRT_3 * net.z) : 0;

  let IkMotor = 0;
  if (input.includeMotor === "yes") {
    const sM = fields.num("motorKva", "모터 합성 kVA");
    const xdM = fields.optional("motorXd", 0.2, "모터 x″ pu");
    fields.requirePositive("motorKva", "모터 kVA", sM);
    fields.requirePositive("motorXd", "x″", xdM);
    if (fields.failed()) return fields.fail();
    IkMotor = (c * (sM * 1000)) / (SQRT_3 * Un * xdM);
  }

  let IkGen = 0;
  if (input.includeGen === "yes") {
    const sGen = Number(input.genKva);
    const xd = Number(input.genXd);
    IkGen = (c * (sGen * 1000)) / (SQRT_3 * Un * xd);
  }

  const Ik = IkNet + IkMotor + IkGen;
  const rx = net.x === 0 ? 0 : net.r / net.x;
  const kappa = peakFactorKappa(rx);
  const ip = kappa * Math.SQRT2 * Ik;
  const skMva = (SQRT_3 * Un * Ik) / 1e6;
  const xr = net.r === 0 ? Infinity : net.x / net.r;

  return ok({
    metrics: [
      metric("ik", "초기 대칭 단락전류 Ik″", Ik, "A", 0, { primary: true }),
      metric("ip", "예상 첨두전류 ip", ip, "A", 0),
      metric("sk", "단락용량", skMva, "MVA", precision),
      metric("z", "등가 임피던스 |Z|", net.z, "Ω", 4),
      metric("xr", "X/R", Number.isFinite(xr) ? xr : 0, "—", 2),
      metric("k", "첨두계수 κ", kappa, "—", 3),
    ],
    inputSummary: [
      { label: "Un", value: `${roundTo(Un, 1)} V` },
      { label: "c", value: String(c) },
      { label: "모터 기여", value: input.includeMotor === "yes" ? `${roundTo(IkMotor, 0)} A` : "없음" },
      { label: "발전기 기여", value: input.includeGen === "yes" ? `${roundTo(IkGen, 0)} A` : "없음" },
    ],
    interpretation: `3상 대칭 사고의 초기 대칭 전류는 약 ${roundTo(Ik, 0)} A, 첨두 ${roundTo(ip, 0)} A, ${roundTo(skMva, precision)} MVA입니다. 1선 지락·2선 단락은 계산하지 않습니다.`,
    warnings: [
      warning(
        "error",
        "불평형 사고 없음",
        "영상분·역상분 네트워크가 없어 지락사고 전류를 제공하지 않습니다. 추정값을 정확한 지락전류처럼 쓰지 마세요.",
      ),
      warning(
        "info",
        "IEC 60909 일부",
        "Ik″ = c Un / (√3 Zk), ip = κ √2 Ik″, κ = 1.02 + 0.98 e^(−3R/X) 를 사용합니다. 전압계수 c와 임피던스 보정계수(K) 전체 절차는 구현하지 않았습니다.",
      ),
      warning("warning", "기여분 합성", "모터·발전기 기여는 단순 전류 합산입니다. 운전 대수·기동 여부·감쇠는 사용자가 반영해야 합니다."),
    ],
    formulaUsed: "Ik″ = c Un / (√3 Zk),  ip = κ √2 Ik″,  κ = 1.02 + 0.98 exp(−3R/X)",
    steps: [
      `Zk = R + jX = ${roundTo(net.r, 5)} + j${roundTo(net.x, 5)} Ω, |Z| = ${roundTo(net.z, 5)} Ω`,
      net.z > 0
        ? `Ik_net″ = ${c} × ${roundTo(Un, 2)} / (√3 × ${roundTo(net.z, 5)}) = ${roundTo(IkNet, 0)} A`
        : "네트워크 임피던스 없음",
      IkMotor > 0 ? `Ik_motor″ ≈ c × S / (√3 Un x″) = ${roundTo(IkMotor, 0)} A` : "모터 기여 없음",
      IkGen > 0 ? `Ik_gen″ ≈ c × S / (√3 Un x″d) = ${roundTo(IkGen, 0)} A` : "발전기 기여 없음",
      `Ik″ = ${roundTo(Ik, 0)} A`,
      `R/X = ${roundTo(rx, 4)}, κ = 1.02 + 0.98 e^(−3R/X) = ${roundTo(kappa, 3)}`,
      `ip = κ × √2 × Ik″ = ${roundTo(ip, 0)} A`,
      `Sk = √3 Un Ik / 10^6 = ${roundTo(skMva, precision)} MVA`,
    ],
    reviewStatus: review("check", "초기 대칭 단락의 간이 IEC 60909 형태입니다. 보호협조·차단용량 확정용이 아닙니다."),
    assumptionsUsed: [
      "3상 대칭, 기본파, 임피던스 보정계수 K 미적용",
      "불평형 사고 제외",
    ],
  });
}
