import { SQRT_3, toVolts } from "@/lib/math/units";
import { FieldBag, metric, ok, review, roundTo, warning, type CalcInput } from "@/lib/calculations/parse";
import type { CalculationOutcome } from "@/lib/types";

function tanPhi(pf: number): number {
  const phi = Math.acos(Math.min(1, Math.max(-1, pf)));
  return Math.tan(phi);
}

/** Qc = P (tanφ1 − tanφ2) */
export function calculatePowerFactorCorrection(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const P = fields.num("powerKw", "유효전력 kW");
  const pf1 = fields.num("pfNow", "현재 역률");
  const pf2 = fields.num("pfTarget", "목표 역률");
  const V = input.voltage ? toVolts(fields.num("voltage", "전압"), input.voltageUnit ?? "V") : 0;
  const phase = input.phase ?? "3";
  fields.requirePositive("powerKw", "유효전력", P);
  fields.requireUnitInterval("pfNow", "현재 역률", pf1);
  fields.requireUnitInterval("pfTarget", "목표 역률", pf2);
  if (V) fields.requirePositive("voltage", "전압", V);
  if (fields.failed()) return fields.fail();
  if (pf2 < pf1) {
    return fields.fail("목표 역률이 현재보다 낮습니다. 개선이 아니라 악화입니다.");
  }

  const t1 = tanPhi(pf1);
  const t2 = tanPhi(pf2);
  const Qc = P * (t1 - t2);
  const Q1 = P * t1;
  const Q2 = P * t2;
  const S1 = P / pf1;
  const S2 = P / pf2;
  const I1 = V > 0 ? (phase === "1" ? (S1 * 1000) / V : (S1 * 1000) / (SQRT_3 * V)) : 0;
  const I2 = V > 0 ? (phase === "1" ? (S2 * 1000) / V : (S2 * 1000) / (SQRT_3 * V)) : 0;

  const metrics = [
    metric("qc", "필요 보상용량", Qc, "kvar", precision, { primary: true }),
    metric("q1", "보상 전 무효전력", Q1, "kvar", precision),
    metric("q2", "보상 후 무효전력", Q2, "kvar", precision),
    metric("s1", "보상 전 피상전력", S1, "kVA", precision),
    metric("s2", "보상 후 피상전력", S2, "kVA", precision),
  ];
  if (V > 0) {
    metrics.push(
      metric("di", "예상 전류 감소", I1 - I2, "A", precision),
      metric("i1", "보상 전 전류", I1, "A", precision),
      metric("i2", "보상 후 전류", I2, "A", precision),
    );
  }

  return ok({
    metrics,
    inputSummary: [
      { label: "P", value: `${roundTo(P, precision)} kW` },
      { label: "PF1", value: String(roundTo(pf1, 3)) },
      { label: "PF2", value: String(roundTo(pf2, 3)) },
    ],
    interpretation: `${roundTo(P, precision)} kW를 역률 ${roundTo(pf1, 3)}에서 ${roundTo(pf2, 3)}로 맞추려면 약 ${roundTo(Qc, precision)} kvar가 필요합니다. APFC 뱅크 단수·과보상은 별도입니다.`,
    warnings: [
      warning(
        "warning",
        "고조파 부하",
        "VFD·UPS·정류 부하가 많으면 콘덴서만 넣지 말고 디튠드 리액터(detuned reactor) 또는 필터를 검토하세요.",
      ),
      warning("info", "과보상", "경부하에서 진상 운전이 되면 전압 상승과 페널티가 날 수 있습니다."),
    ],
    formulaUsed: "Qc = P × (tan φ1 − tan φ2),  φ = arccos(PF)",
    steps: [
      `φ1 = arccos(${roundTo(pf1, 4)}), tanφ1 = ${roundTo(t1, 4)}`,
      `φ2 = arccos(${roundTo(pf2, 4)}), tanφ2 = ${roundTo(t2, 4)}`,
      `Qc = ${roundTo(P, precision)} × (${roundTo(t1, 4)} − ${roundTo(t2, 4)}) = ${roundTo(Qc, precision)} kvar`,
      `Q1 = ${roundTo(Q1, precision)} kvar, Q2 = ${roundTo(Q2, precision)} kvar`,
      `S1 = P/PF1 = ${roundTo(S1, precision)} kVA, S2 = ${roundTo(S2, precision)} kVA`,
    ],
    reviewStatus: review("check", "필요 kvar는 계산값입니다. 뱅크 구성·고조파·수전 계약은 추가 확인이 필요합니다."),
    assumptionsUsed: ["기본파 변위 역률, 일정 유효전력, 평형 3상(해당 시)을 가정합니다."],
  });
}

export function calculatePowerTriangle(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const mode = input.mode ?? "pq";
  let P = 0;
  let Q = 0;
  let S = 0;
  if (mode === "pq") {
    P = fields.num("kw", "유효전력 kW");
    Q = fields.num("kvar", "무효전력 kvar");
    fields.requireNonNegative("kw", "유효전력", P);
    // Q can be signed; magnitude used for S
  } else if (mode === "ps") {
    P = fields.num("kw", "유효전력 kW");
    S = fields.num("kva", "피상전력 kVA");
    fields.requirePositive("kw", "유효전력", P);
    fields.requirePositive("kva", "피상전력", S);
    if (!fields.errors.kw && !fields.errors.kva && P > S) {
      fields.errors.kw = "유효전력은 피상전력보다 클 수 없습니다.";
    }
  } else {
    P = fields.num("kw", "유효전력 kW");
    const pf = fields.num("pf", "역률");
    fields.requirePositive("kw", "유효전력", P);
    fields.requireUnitInterval("pf", "역률", pf);
    S = P / pf;
    Q = Math.sqrt(Math.max(S * S - P * P, 0));
  }
  if (fields.failed()) return fields.fail();

  if (mode === "pq") {
    S = Math.hypot(P, Q);
  } else if (mode === "ps") {
    Q = Math.sqrt(Math.max(S * S - P * P, 0));
  }
  const pf = S === 0 ? 0 : P / S;

  return ok({
    metrics: [
      metric("s", "피상전력", S, "kVA", precision, { primary: true }),
      metric("p", "유효전력", P, "kW", precision),
      metric("q", "무효전력", Math.abs(Q), "kvar", precision),
      metric("pf", "역률", pf, "—", Math.max(precision, 3)),
    ],
    inputSummary: [{ label: "입력", value: mode }],
    interpretation: `전력 삼각형에서 S = ${roundTo(S, precision)} kVA, PF = ${roundTo(pf, 3)}입니다.`,
    warnings: [warning("info", "기본파", "고조파가 있으면 진성 역률과 다를 수 있습니다.")],
    formulaUsed: "S² = P² + Q²,  PF = P / S",
    steps: [
      mode === "pq"
        ? `S = √(P² + Q²) = √(${roundTo(P, 4)}² + ${roundTo(Q, 4)}²) = ${roundTo(S, precision)}`
        : `Q = √(S² − P²) = ${roundTo(Math.abs(Q), precision)}`,
      `PF = ${roundTo(P, precision)} / ${roundTo(S, precision)} = ${roundTo(pf, 3)}`,
    ],
    reviewStatus: review("in-range", "전력 관계식 계산입니다. 요금·페널티 판정이 아닙니다."),
  });
}

export function calculateThd(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const kind = input.kind ?? "voltage";
  const fund = fields.num("fundamental", "기본파 실효값");
  const harmonicsRaw = fields.raw("harmonics");
  fields.requirePositive("fundamental", "기본파", fund);
  if (fields.failed()) return fields.fail();

  const parts = harmonicsRaw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s.replace(/,/g, "")));
  if (parts.length === 0 || parts.some((n) => !Number.isFinite(n) || n < 0)) {
    return fields.fail("고조파 성분을 0 이상 숫자로, 쉼표 또는 공백으로 구분해 입력하세요. 예: 4.2, 2.1, 1.0");
  }

  const rss = Math.sqrt(parts.reduce((acc, h) => acc + h * h, 0));
  const thd = (rss / fund) * 100;

  return ok({
    metrics: [
      metric("thd", kind === "current" ? "전류 THD" : "전압 THD", thd, "%", precision, { primary: true }),
      metric("rss", "고조파 RSS", rss, kind === "current" ? "A" : "V", precision),
      metric("fund", "기본파", fund, kind === "current" ? "A" : "V", precision),
    ],
    inputSummary: [
      { label: "구분", value: kind === "current" ? "전류" : "전압" },
      { label: "차수 개수", value: String(parts.length) },
    ],
    interpretation: `THD = √(ΣHn²) / H1 × 100 = ${roundTo(thd, precision)}%입니다. 전압 THD와 전류 THD는 기준과 영향이 다릅니다.`,
    warnings: [
      warning("info", "정의", "IEC 61000 계열에서 THD 정의·측정 창·차수 범위가 문서마다 다를 수 있습니다. 본 도구는 사용자가 넣은 성분만 RSS로 나눕니다."),
      warning("warning", "한도", "허용 THD 한도는 계통·계약·장비 내량에 따라 다릅니다. 여기서 적합/부적합을 판정하지 않습니다."),
    ],
    formulaUsed: "THD = √(H2² + H3² + … + Hn²) / H1 × 100",
    steps: [
      `ΣHn² = ${parts.map((h) => roundTo(h, 4)).join("² + ")}²`,
      `√(ΣHn²) = ${roundTo(rss, precision)}`,
      `THD = ${roundTo(rss, precision)} / ${roundTo(fund, precision)} × 100 = ${roundTo(thd, precision)}%`,
    ],
    reviewStatus: review("check", "측정 방법과 적용 한도를 별도로 확인하세요."),
  });
}

export function calculateHarmonicFilterReview(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const Qc = fields.num("qc", "콘덴서 용량 kvar");
  const V = toVolts(fields.num("voltage", "선간전압"), input.voltageUnit ?? "V");
  const p = fields.optional("reactorPct", 7, "리액터 퍼센트 %");
  fields.requirePositive("qc", "콘덴서 용량", Qc);
  fields.requirePositive("voltage", "전압", V);
  fields.requirePositive("reactorPct", "리액터 퍼센트", p);
  if (fields.failed()) return fields.fail();

  // fr / f1 = 1/√p  for p in pu. If p=0.07, n = 1/sqrt(0.07) ≈ 3.78 → around 5th detuned
  const n = 1 / Math.sqrt(p / 100);
  const Ic = (Qc * 1000) / (SQRT_3 * V);

  return ok({
    metrics: [
      metric("n", "대략 동조 차수", n, "차", precision, { primary: true }),
      metric("ic", "커패시터 전류(기본파 근사)", Ic, "A", precision),
      metric("p", "리액터 퍼센트", p, "%", precision),
    ],
    inputSummary: [{ label: "Qc", value: `${Qc} kvar` }],
    interpretation: `리액터 ${roundTo(p, 2)}%이면 직렬 공진 차수는 약 ${roundTo(n, 2)}차입니다. 5고조파 디튠에 7%가 자주 쓰이지만 현장 고조파 스펙트럼 없이 필터를 확정하지 마세요.`,
    warnings: [
      warning("error", "설계 확정 아님", "필터 설계는 고조파 측정, 계통 임피던스, 제조사 데이터를 필요로 합니다."),
      warning("warning", "디튠드 리액터", "고조파 부하가 있으면 일반 역률 콘덴서만 넣지 말고 디튠/필터를 검토하세요."),
    ],
    formulaUsed: "n ≈ 1 / √(p),  p = XL / XC  (퍼센트를 소수로 환산)",
    steps: [
      `p = ${roundTo(p, 2)}% = ${roundTo(p / 100, 4)} pu`,
      `n ≈ 1 / √p = ${roundTo(n, precision)}`,
      `Ic ≈ Qc × 1000 / (√3 V) = ${roundTo(Ic, precision)} A`,
    ],
    reviewStatus: review("caution", "간이 공진 차수 추정입니다. 필터 선정 도구가 아닙니다."),
    assumptionsUsed: ["이상적인 직렬 L-C, 기본파 전압, 부하 고조파 전류원 모델은 포함하지 않음"],
  });
}
