import { SQRT_3, conductorOhmPerKm, resistivityOf, toMeters, toVolts, toWatts } from "@/lib/math/units";
import { FieldBag, metric, ok, review, roundTo, warning, type CalcInput } from "@/lib/calculations/parse";
import { followUp } from "@/lib/calculations/handoff";
import type { CalculationOutcome } from "@/lib/types";

function designCurrent(phase: string, P: number, V: number, pf: number, eta: number): number {
  return phase === "1" ? P / (V * pf * eta) : P / (SQRT_3 * V * pf * eta);
}

function vdFactor(phase: string): number {
  return phase === "1" ? 2 : SQRT_3;
}

/**
 * LV 케이블 굵기 1차 검토.
 * 허용전류표·보정계수 표는 내장하지 않음. 사용자가 넣은 k만 반영.
 */
export function calculateCableSizing(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const phase = input.phase ?? "3";
  const detailed = (input.mode ?? "basic") === "detailed";
  const P = toWatts(fields.num("power", "부하전력"), input.powerUnit ?? "kW");
  const V = toVolts(fields.num("voltage", "전압"), input.voltageUnit ?? "V");
  const pf = fields.optional("pf", 0.85, "역률");
  const eta = detailed ? fields.optional("efficiency", 1, "효율") : fields.optional("efficiency", 1, "효율");
  const demand = detailed ? fields.optional("demand", 1, "수용률") : 1;
  const length = toMeters(fields.num("length", "케이블 길이"), input.lengthUnit ?? "m");
  const allowPct = fields.num("allowPct", "허용 전압강하율 %");
  const material = (input.material ?? "cu") as "cu" | "al";
  const parallel = Math.max(1, Math.round(fields.optional("parallel", 1, "병렬 수")));
  fields.requirePositive("power", "부하전력", P);
  fields.requirePositive("voltage", "전압", V);
  fields.requireUnitInterval("pf", "역률", pf);
  fields.requireUnitInterval("efficiency", "효율", eta);
  fields.requirePositive("length", "길이", length);
  fields.requirePositive("allowPct", "허용 전압강하율", allowPct);
  if (demand <= 0 || demand > 1) fields.errors.demand = "수용률은 0 초과 1 이하여야 합니다.";
  if (parallel < 1) fields.errors.parallel = "병렬 수는 1 이상이어야 합니다.";
  if (fields.failed()) return fields.fail();

  const IbFull = designCurrent(phase, P, V, pf, eta);
  const Ib = IbFull * demand;
  const kTemp = detailed ? fields.optional("kTemp", 1, "온도 보정") : 1;
  const kGroup = detailed ? fields.optional("kGroup", 1, "집합 보정") : 1;
  const kInstall = detailed ? fields.optional("kInstall", 1, "포설 보정") : 1;
  if (detailed) {
    fields.requirePositive("kTemp", "온도 보정", kTemp);
    fields.requirePositive("kGroup", "집합 보정", kGroup);
    fields.requirePositive("kInstall", "포설 보정", kInstall);
  }
  if (fields.failed()) return fields.fail();

  const kProd = kTemp * kGroup * kInstall;
  const Irun = Ib / parallel;
  const Ireq = kProd > 0 ? Irun / kProd : Irun;
  const dVallow = V * (allowPct / 100);
  const rho = resistivityOf(material);
  const kvd = vdFactor(phase);
  const aMinVd = (kvd * Irun * rho * length) / dVallow;
  const selected = fields.optional("selectedMm2", 0, "선택 단면적");
  const izTable = fields.optional("izTable", 0, "표 허용전류");
  const lengthKm = length / 1000;
  const rOne = selected > 0 ? conductorOhmPerKm(rho, selected) : conductorOhmPerKm(rho, Math.max(aMinVd, 1e-9));
  const dV2 = kvd * Ib * lengthKm * (rOne / parallel);
  const pct = (dV2 / V) * 100;
  const Vend = V - dV2;
  const R = (rho * length) / (Math.max(selected, aMinVd) * parallel);

  const iscKa = detailed ? fields.optional("iscKa", 0, "단락전류 kA") : 0;
  const tsc = detailed ? fields.optional("tsc", 1, "단락 지속 s") : 0;
  const kAdiabatic = detailed ? fields.optional("kAdiabatic", 0, "단열계수 k") : 0;

  const metrics = [
    metric("ib", "설계전류", Ib, "A", precision, { primary: true }),
    metric("irun", "회선당 전류", Irun, "A", precision),
    metric("ireq", "보정 후 요구전류", Ireq, "A", precision, {
      hint: "표의 미보정 Iz가 이 값 이상이어야 Ib ≤ Iz×k 와 같습니다. 표 수치는 내장하지 않습니다.",
    }),
    metric("amin", "전압강하 기준 최소 단면적(1회선)", aMinVd, "mm²", precision),
    metric("dv", "전압강하", dV2, "V", precision),
    metric("pct", "전압강하율", pct, "%", precision),
    metric("vend", "말단 예상전압", Vend, "V", precision),
    metric("r", "등가 도체 저항", R, "Ω", Math.max(precision, 4)),
  ];

  const warnings = [
    warning(
      "error",
      "허용전류표 미내장",
      "KEC 232.5.2 / KS C IEC 60364-5-52 표 수치는 내장하지 않습니다. 공사방법·절연·온도·집합에 맞는 Iz와 k를 표에서 직접 옮기세요.",
    ),
    warning("info", "저항 근사", "20°C 저항률 근사(Cu 0.0175, Al 0.0282 Ω·mm²/m). 리액턴스·운전온도는 미포함."),
  ];

  if (izTable > 0) {
    const izCorr = izTable * kProd;
    metrics.push(metric("izc", "사용자 표 허용전류×보정 Iz'", izCorr, "A", precision));
    if (Irun > izCorr) {
      warnings.push(warning("warning", "허용전류 부족 가능", "보정 후 허용전류가 회선당 전류보다 작습니다."));
    }
  }

  if (iscKa > 0 && tsc > 0 && kAdiabatic > 0) {
    const Isc = iscKa * 1000;
    const sMin = (Isc / kAdiabatic) * Math.sqrt(tsc);
    metrics.push(
      metric("smin", "단락 열적 최소단면적(사용자 k)", sMin, "mm²", precision, {
        hint: "S = (I/k)·√t . k는 적용 표준 표 값입니다. 내장 k가 아닙니다.",
      }),
    );
  } else if (detailed && (iscKa > 0 || input.kAdiabatic)) {
    warnings.push(
      warning("info", "열적 내량 미계산", "단락전류·지속시간·단열계수 k를 모두 넣어야 S=(I/k)√t 를 계산합니다. k를 임의로 채우지 않습니다."),
    );
  }

  let status = review("check", "전압강하 기반 1차 검토입니다. 허용전류·단락내량 확인이 남았습니다.");
  if (selected > 0 && pct <= allowPct) {
    status = review("in-range", `선택 단면적의 전압강하가 사용자 허용 ${roundTo(allowPct, 2)}% 이하입니다. 규정 합격이 아닙니다.`);
  } else if (selected > 0 && pct > allowPct) {
    status = review("caution", "선택 단면적으로는 사용자 허용 전압강하를 넘습니다.");
  }

  const install = input.install ?? "unspecified";
  const insulation = input.insulation ?? "unspecified";
  const soil = input.soil ?? "unspecified";
  const ambient = fields.optional("ambient", 30, "주변온도");
  const burial = fields.optional("burialM", 0, "매설깊이");

  return ok({
    metrics,
    inputSummary: [
      { label: "모드", value: detailed ? "상세 계산" : "기본 계산" },
      { label: "회로", value: phase === "1" ? "단상" : "3상" },
      { label: "재질", value: material === "cu" ? "구리" : "알루미늄" },
      { label: "병렬", value: `${parallel} 회선` },
      { label: "절연(기록)", value: insulation },
      { label: "포설(기록)", value: install },
      { label: "토양(기록)", value: soil },
      { label: "주변온도(기록)", value: `${ambient} °C` },
      { label: "매설깊이(기록)", value: burial > 0 ? `${burial} m` : "미입력" },
    ],
    interpretation: `설계전류 ${roundTo(Ib, precision)} A → 회선당 ${roundTo(Irun, precision)} A. 종합 보정 ${roundTo(kProd, 3)}을 반영한 표 대비 요구전류는 ${roundTo(Ireq, precision)} A입니다. 말단 전압 ${roundTo(Vend, precision)} V.`,
    warnings,
    formulaUsed: "Ib = P/(√3 V PF η)×수용률,  I_req = I_run / (kθ k그룹 k포설),  A_VD = k I ρ L / ΔV,  S = (I/k)√t (k 사용자)",
    steps: [
      phase === "1"
        ? `Ib0 = P / (V PF η) = ${roundTo(IbFull, precision)} A`
        : `Ib0 = P / (√3 V PF η) = ${roundTo(IbFull, precision)} A`,
      `수용률 ${roundTo(demand, 3)} → 설계전류 Ib = ${roundTo(Ib, precision)} A`,
      `병렬 ${parallel} → 회선당 ${roundTo(Irun, precision)} A`,
      `kθ=${roundTo(kTemp, 3)}, k그룹=${roundTo(kGroup, 3)}, k포설=${roundTo(kInstall, 3)} → 종합 ${roundTo(kProd, 3)}`,
      `보정 후 요구전류 = ${roundTo(Irun, precision)} / ${roundTo(kProd, 3)} = ${roundTo(Ireq, precision)} A`,
      `ΔV_allow = ${roundTo(dVallow, precision)} V, A_VD = ${roundTo(aMinVd, precision)} mm²`,
      `ΔV = ${roundTo(dV2, precision)} V (${roundTo(pct, precision)}%), V_end = ${roundTo(Vend, precision)} V`,
    ],
    reviewStatus: status,
    assumptionsUsed: [
      "허용전류·보정계수 표 수치는 적용하지 않았습니다. 사용자가 넣은 k만 곱합니다.",
      "전압강하는 저항 성분만 사용합니다.",
      "절연·포설·토양·매설깊이는 선정 기록이므로 전류를 자동 보정하지 않습니다.",
    ],
    corrections: [
      { id: "kTemp", label: "온도 보정계수", value: `× ${roundTo(kTemp, 3)}`, note: detailed ? "사용자 표 값" : "기본 모드에서는 1" },
      { id: "kGroup", label: "집합 보정계수", value: `× ${roundTo(kGroup, 3)}` },
      { id: "kInstall", label: "포설 보정계수", value: `× ${roundTo(kInstall, 3)}` },
      { id: "kProd", label: "종합 보정계수", value: `× ${roundTo(kProd, 3)}`, note: "Iz' = Iz × 종합, I_req = I_run / 종합" },
    ],
    nextChecks: [
      "적용 배선 규정(KEC 우선) 허용전류표에서 Iz를 읽고 이 도구의 Iz 칸에 넣어 비교하세요.",
      "보호기기 정격·트립 곡선이 케이블을 보호하는지 확인하세요.",
      "단락 열적 내량은 표의 k와 실제 I²t로 별도 확인하세요.",
    ],
    followUps: [
      followUp("이 조건으로 전압강하 계산", "/tools/electrical/voltage-drop", {
        phase,
        current: roundTo(Ib, 4),
        length: roundTo(length, 4),
        voltage: roundTo(V, 4),
      }),
      followUp("허용전류 검토", "/tools/electrical/cable-ampacity", {
        designCurrent: roundTo(Irun, 4),
      }),
    ],
  });
}

export function calculateCableParallel(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const I = fields.num("current", "총 부하전류");
  const n = Math.round(fields.num("parallel", "병렬 수"));
  const area = fields.num("area", "1회선 단면적");
  const length = toMeters(fields.num("length", "길이"), input.lengthUnit ?? "m");
  const material = (input.material ?? "cu") as "cu" | "al";
  fields.requirePositive("current", "전류", I);
  fields.requirePositive("parallel", "병렬 수", n);
  fields.requirePositive("area", "단면적", area);
  fields.requirePositive("length", "길이", length);
  if (n < 2) fields.errors.parallel = "병렬 운전 검토는 2 이상이어야 합니다.";
  if (fields.failed()) return fields.fail();

  const Ieach = I / n;
  const rho = resistivityOf(material);
  const Rone = (rho * length) / area;
  const Req = Rone / n;
  const mismatch = fields.optional("lengthMismatchPct", 0, "길이 편차 %");

  const warnings = [
    warning("warning", "전류 분담", "길이·접속·임피던스가 다르면 전류가 한쪽으로 치우칩니다. 동일 경로·동일 규격이 원칙입니다."),
  ];
  if (mismatch > 5) {
    warnings.push(warning("warning", "길이 불일치", "편차가 큽니다. 단순 I/n 분담을 신뢰하지 마세요."));
  }

  return ok({
    metrics: [
      metric("ieach", "회선당 전류(균등 분담)", Ieach, "A", precision, { primary: true }),
      metric("req", "등가 저항", Req, "Ω", Math.max(precision, 4)),
      metric("rone", "1회선 저항", Rone, "Ω", Math.max(precision, 4)),
    ],
    inputSummary: [
      { label: "병렬", value: `${n}` },
      { label: "재질", value: material === "cu" ? "구리" : "알루미늄" },
    ],
    interpretation: `균등 분담이면 회선당 ${roundTo(Ieach, precision)} A, 등가 저항 ${roundTo(Req, 4)} Ω입니다.`,
    warnings,
    formulaUsed: "I_i = I / n  (균등),  R_eq = R / n",
    steps: [
      `I_i = ${roundTo(I, precision)} / ${n} = ${roundTo(Ieach, precision)} A`,
      `R = ρL/A = ${rho} × ${roundTo(length, 2)} / ${area} = ${roundTo(Rone, 4)} Ω`,
      `R_eq = ${roundTo(Rone, 4)} / ${n} = ${roundTo(Req, 4)} Ω`,
    ],
    reviewStatus: review("check", "균등 분담 가정입니다. 실제 분담은 임피던스 측정이 필요합니다."),
  });
}

export function calculateCableAmpacityReview(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const Ib = fields.num("designCurrent", "설계전류");
  const Iz = fields.num("iz", "표 허용전류 Iz");
  const k1 = fields.optional("kTemp", 1, "온도 보정");
  const k2 = fields.optional("kGroup", 1, "집합 보정");
  const k3 = fields.optional("kOther", 1, "기타 보정");
  fields.requirePositive("designCurrent", "설계전류", Ib);
  fields.requirePositive("iz", "Iz", Iz);
  fields.requirePositive("kTemp", "온도 보정", k1);
  fields.requirePositive("kGroup", "집합 보정", k2);
  fields.requirePositive("kOther", "기타 보정", k3);
  if (fields.failed()) return fields.fail();

  const Izp = Iz * k1 * k2 * k3;
  const ratio = Ib / Izp;
  const status =
    ratio <= 1
      ? review("in-range", "사용자 입력 표·보정 기준으로 Ib ≤ Iz' 입니다. 적용 표준 표의 적합 판정이 아닙니다.")
      : review("caution", "보정 허용전류가 설계전류보다 작습니다.");

  return ok({
    metrics: [
      metric("izp", "보정 허용전류 Iz'", Izp, "A", precision, { primary: true }),
      metric("ib", "설계전류 Ib", Ib, "A", precision),
      metric("ratio", "Ib / Iz'", ratio, "—", Math.max(precision, 3)),
    ],
    inputSummary: [
      { label: "kθ", value: String(k1) },
      { label: "k그룹", value: String(k2) },
      { label: "k기타", value: String(k3) },
    ],
    interpretation: `Iz' = ${roundTo(Iz, precision)} × ${k1} × ${k2} × ${k3} = ${roundTo(Izp, precision)} A. Ib/Iz' = ${roundTo(ratio, 3)}.`,
    warnings: [
      warning(
        "error",
        "표는 사용자가 입력",
        "이 사이트는 KEC/IEC 허용전류 수치를 내장하지 않습니다. Iz와 보정계수는 적용 표준·제조사 표에서 직접 확인하세요.",
      ),
    ],
    formulaUsed: "Iz' = Iz × k1 × k2 × k3,  검토: Ib ≤ Iz'",
    steps: [
      `Iz' = ${roundTo(Iz, precision)} × ${k1} × ${k2} × ${k3} = ${roundTo(Izp, precision)} A`,
      `Ib / Iz' = ${roundTo(Ib, precision)} / ${roundTo(Izp, precision)} = ${roundTo(ratio, 3)}`,
    ],
    reviewStatus: status,
  });
}

export function calculateBusbar(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const I = fields.num("current", "전류");
  const width = fields.num("width", "폭 mm");
  const thickness = fields.num("thickness", "두께 mm");
  const bars = Math.max(1, Math.round(fields.optional("bars", 1, "병렬 수")));
  const jAllow = fields.optional("jAllow", 0, "허용 전류밀도");
  const isc = fields.optional("isc", 0, "단락전류 kA");
  const tsc = fields.optional("tsc", 1, "단락 지속 s");
  fields.requirePositive("current", "전류", I);
  fields.requirePositive("width", "폭", width);
  fields.requirePositive("thickness", "두께", thickness);
  if (fields.failed()) return fields.fail();

  const area = width * thickness * bars;
  const j = I / area;
  const i2t = isc > 0 ? (isc * 1000) ** 2 * tsc : 0;

  const metrics = [
    metric("area", "단면적", area, "mm²", precision, { primary: true }),
    metric("j", "전류밀도", j, "A/mm²", Math.max(precision, 3)),
  ];
  if (jAllow > 0) {
    metrics.push(metric("jallow", "사용자 허용 밀도", jAllow, "A/mm²", precision));
  }
  if (isc > 0) {
    metrics.push(metric("i2t", "I²t (단락내량 검토용)", i2t, "A²s", 0));
  }

  const warnings = [
    warning("info", "경험식과 표준의 구분", "전류밀도 비교는 사용자가 넣은 경험값입니다. IEC/KEC 부스바 허용전류표가 아닙니다."),
    warning("warning", "단락내량", "I²t는 입력값으로 만든 열적 부담입니다. 지지물·전자력·제작사 내량과 비교해야 합니다."),
  ];

  let status = review("check", "단면적·밀도 계산입니다. 허용전류 확정은 표준 표·제작사 데이터가 필요합니다.");
  if (jAllow > 0) {
    status = j <= jAllow ? review("in-range", "사용자 허용 밀도 이하입니다.") : review("caution", "사용자 허용 밀도를 초과합니다.");
  }

  return ok({
    metrics,
    inputSummary: [
      { label: "재질(기록)", value: input.material ?? "cu" },
      { label: "병렬", value: String(bars) },
    ],
    interpretation: `단면적 ${roundTo(area, precision)} mm², 전류밀도 ${roundTo(j, 3)} A/mm²입니다.`,
    warnings,
    formulaUsed: "A = w × t × n,  J = I / A,  I²t = Isc² × t",
    steps: [
      `A = ${width} × ${thickness} × ${bars} = ${roundTo(area, precision)} mm²`,
      `J = ${roundTo(I, precision)} / ${roundTo(area, precision)} = ${roundTo(j, 3)} A/mm²`,
      isc > 0 ? `I²t = (${roundTo(isc, 3)} kA)² × ${tsc} s = ${roundTo(i2t, 0)} A²s` : "단락전류 미입력 — I²t 생략",
    ],
    reviewStatus: status,
    assumptionsUsed: ["표피효과·근접효과·도장·환기는 무시합니다."],
  });
}
