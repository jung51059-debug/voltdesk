import { KEC_EARTH_CONDUCTOR } from "@/lib/calculations/kec-review";
import { FieldBag, metric, ok, review, roundTo, warning, type CalcInput } from "@/lib/calculations/parse";
import type { CalculationOutcome } from "@/lib/types";

export function calculateLux(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const length = fields.num("length", "길이 m");
  const width = fields.num("width", "폭 m");
  const E = fields.num("lux", "목표 조도 lx");
  const lumens = fields.num("lumens", "등기구 광속 lm");
  const uf = fields.optional("uf", 0.6, "이용률");
  const mf = fields.optional("mf", 0.8, "유지율");
  fields.requirePositive("length", "길이", length);
  fields.requirePositive("width", "폭", width);
  fields.requirePositive("lux", "조도", E);
  fields.requirePositive("lumens", "광속", lumens);
  fields.requireUnitInterval("uf", "이용률", uf);
  fields.requireUnitInterval("mf", "유지율", mf);
  if (fields.failed()) return fields.fail();

  const area = length * width;
  const total = (E * area) / (uf * mf);
  const n = Math.ceil(total / lumens - 1e-9);
  const eEst = n > 0 ? (n * lumens * uf * mf) / area : 0;

  return ok({
    metrics: [
      metric("n", "필요 등기구 수", n, "개", 0, { primary: true }),
      metric("area", "면적", area, "m²", precision),
      metric("phi", "필요 총 광속", total, "lm", 0),
      metric("e", "설치 후 예상 평균조도", eEst, "lx", precision),
    ],
    inputSummary: [
      { label: "공간", value: `${length} × ${width} m` },
      { label: "UF / MF", value: `${uf} / ${mf}` },
    ],
    interpretation: `루멘법으로 필요 광속 ${roundTo(total, 0)} lm, 등기구 ${n}개, 예상 평균 ${roundTo(eEst, precision)} lx입니다.`,
    warnings: [
      warning("info", "루멘법", "균제도, 글레어, 벽면 반사 상세는 포함하지 않습니다."),
      warning("warning", "UF·MF", "이용률·유지율은 등기구·실 반사율·오염에 따라 달라집니다. 제조사 표를 쓰세요."),
    ],
    formulaUsed: "N = (E × A) / (Φ × UF × MF)",
    steps: [
      `A = ${length} × ${width} = ${roundTo(area, precision)} m²`,
      `ΣΦ = E A / (UF MF) = ${E} × ${roundTo(area, precision)} / (${uf} × ${mf}) = ${roundTo(total, 0)} lm`,
      `N = ceil(${roundTo(total, 0)} / ${lumens}) = ${n}`,
      `E_est = N Φ UF MF / A = ${roundTo(eEst, precision)} lx`,
    ],
    reviewStatus: review("check", "평균조도 1차 산정입니다. 배치·균제도 확인이 필요합니다."),
  });
}

export function calculateLightingPowerDensity(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const p = fields.num("watts", "조명 전력 W");
  const area = fields.num("area", "면적 m²");
  const pOld = fields.optional("oldWatts", 0, "기존 전력");
  const hours = fields.optional("hours", 3000, "연간 시간");
  const price = fields.optional("price", 0, "원/kWh");
  fields.requirePositive("watts", "전력", p);
  fields.requirePositive("area", "면적", area);
  if (fields.failed()) return fields.fail();
  const lpd = p / area;
  const saveW = pOld > 0 ? pOld - p : 0;
  const saveKwh = (saveW / 1000) * hours;

  const metrics = [
    metric("lpd", "조명 전력밀도", lpd, "W/m²", precision, { primary: true }),
    metric("p", "설치 전력", p, "W", 0),
  ];
  if (pOld > 0) {
    metrics.push(metric("save", "전력 절감", saveW, "W", 0));
    metrics.push(metric("kwh", "연간 추정 절감", saveKwh, "kWh", 0));
    if (price > 0) metrics.push(metric("won", "연간 요금 참고", saveKwh * price, "원", 0));
  }

  return ok({
    metrics,
    inputSummary: [{ label: "면적", value: `${area} m²` }],
    interpretation: `전력밀도 ${roundTo(lpd, precision)} W/m²입니다. 건축 에너지 기준의 적합 판정이 아닙니다.`,
    warnings: [warning("info", "요금", "평균 단가 × kWh 참고입니다. 한전 요금제가 아닙니다.")],
    formulaUsed: "LPD = P / A,  ΔE = ΔP × h / 1000",
    steps: [
      `LPD = ${p} / ${area} = ${roundTo(lpd, precision)} W/m²`,
      pOld > 0 ? `절감 전력 = ${pOld} − ${p} = ${saveW} W` : "기존 전력 미입력",
    ],
    reviewStatus: review("in-range", "밀도 산정입니다. 법규 적합 여부는 해당 고시를 확인하세요."),
  });
}

export function calculateSolarPv(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const mode = input.mode ?? "grid";
  const eDay = fields.num("dailyKwh", "일일 사용 kWh");
  const psh = fields.num("psh", "Peak Sun Hours");
  const pPanel = fields.num("panelW", "패널 W");
  const eta = fields.optional("efficiency", 0.8, "시스템 효율");
  const battHours = fields.optional("autonomyH", 24, "배터리 시간");
  const dod = fields.optional("dod", 0.5, "DOD");
  const vdc = fields.optional("vdc", 48, "DC 전압");
  fields.requirePositive("dailyKwh", "일일 사용", eDay);
  fields.requirePositive("psh", "PSH", psh);
  fields.requirePositive("panelW", "패널", pPanel);
  fields.requireUnitInterval("efficiency", "효율", eta);
  if (fields.failed()) return fields.fail();

  const kWp = eDay / (psh * eta);
  const n = Math.ceil((kWp * 1000) / pPanel - 1e-9);
  const eEst = (n * pPanel * psh * eta) / 1000;
  const inv = kWp * 1.1;
  const metrics = [
    metric("kwp", "필요 PV 용량", kWp, "kWp", precision, { primary: true }),
    metric("n", "예상 패널 수", n, "장", 0),
    metric("gen", "예상 일일 발전", eEst, "kWh", precision),
    metric("inv", "인버터 용량 참고", inv, "kW", precision),
  ];

  if (mode !== "grid") {
    const eBatt = (eDay * (battHours / 24)) / dod;
    const ah = (eBatt * 1000) / vdc;
    metrics.push(metric("ebatt", "배터리 에너지 참고", eBatt, "kWh", precision));
    metrics.push(metric("ah", "배터리 용량 참고", ah, "Ah", 0));
  }

  return ok({
    metrics,
    inputSummary: [
      { label: "구성", value: mode === "grid" ? "계통연계" : mode === "hybrid" ? "하이브리드" : "독립형" },
      { label: "PSH", value: String(psh) },
    ],
    interpretation: `${mode === "grid" ? "계통연계" : mode === "hybrid" ? "하이브리드" : "독립형"} 단순 에너지 수지입니다. 필요 ${roundTo(kWp, precision)} kWp, 패널 약 ${n}장.`,
    warnings: [
      warning("warning", "기상·배치", "음영, 방위, 온도, 인버터 클립은 미포함입니다."),
      mode === "grid"
        ? warning("info", "계통연계", "한전 연계·역송 규정은 별도입니다.")
        : warning("info", "축전", "배터리 사이징은 방전율·온도·수명을 제조사 표로 확인하세요."),
    ],
    formulaUsed: "P_kWp = E_day / (PSH × η),  N = P_kWp / P_panel",
    steps: [
      `P_kWp = ${eDay} / (${psh} × ${eta}) = ${roundTo(kWp, precision)} kWp`,
      `N = ceil(${roundTo(kWp * 1000, 0)} / ${pPanel}) = ${n}`,
      `E ≈ N × ${pPanel} × PSH × η / 1000 = ${roundTo(eEst, precision)} kWh`,
    ],
    reviewStatus: review("check", "에너지 수지 1차 산정입니다. 상세 설계가 아닙니다."),
  });
}

/** 단일 수직 접지봉 근사 R = ρ/(2πL) ln(4L/d). Dwight/일반적인 공학 근사. */
export function calculateGroundingRod(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const rho = fields.num("rho", "토양저항률 Ω·m");
  const L = fields.num("length", "봉 길이 m");
  const d = fields.num("diameter", "봉 직경 m");
  const n = Math.max(1, Math.round(fields.optional("rods", 1, "봉 수")));
  const kSpace = fields.optional("spaceFactor", 1, "병렬 감소계수");
  fields.requirePositive("rho", "ρ", rho);
  fields.requirePositive("length", "길이", L);
  fields.requirePositive("diameter", "직경", d);
  fields.requirePositive("spaceFactor", "병렬 계수", kSpace);
  if (d >= L) fields.errors.diameter = "직경이 길이보다 작아야 합니다.";
  if (fields.failed()) return fields.fail();

  const R1 = (rho / (2 * Math.PI * L)) * Math.log((4 * L) / d);
  const Rn = (R1 / n) * kSpace;

  return ok({
    metrics: [
      metric("r", n > 1 ? "병렬 합성 저항 추정" : "단일 봉 저항 추정", Rn, "Ω", precision, { primary: true }),
      metric("r1", "1본 저항", R1, "Ω", precision),
    ],
    inputSummary: [
      { label: "ρ", value: `${rho} Ω·m` },
      { label: "봉", value: `${n}본, L=${L} m` },
    ],
    interpretation: `간이 수직봉 근사로 ${roundTo(Rn, precision)} Ω입니다. IEEE 80 그리드 설계나 KEC 접지극 시공이 아닙니다.`,
    warnings: [
      warning("error", "간이 검토", "층상 토양, 수분, 결빙, 연결 도체 저항을 무시합니다. 실측이 우선입니다."),
      warning("info", "IEC/국내", "국내 접지 시공·측정 기준과 IEC/IEEE 80 그리드 계산은 목적과 모델이 다릅니다. 이 도구는 둘 다의 인증 구현이 아닙니다."),
    ],
    formulaUsed: "R = ρ/(2πL) × ln(4L/d),  n본: R_n ≈ (R1/n)×k_space",
    steps: [
      `R1 = ${rho} / (2π × ${L}) × ln(4×${L}/${d}) = ${roundTo(R1, precision)} Ω`,
      n > 1 ? `Rn ≈ ${roundTo(R1, precision)} / ${n} × ${kSpace} = ${roundTo(Rn, precision)} Ω` : "단일 봉",
    ],
    reviewStatus: review("caution", "간이 추정입니다. 접지저항 실측과 시방서를 따르세요."),
    assumptionsUsed: ["균질 토양, 봉 표면 완전 접촉, 주파수 무시"],
  });
}

/** Wenner: ρ = 2 π a R */
export function calculateSoilResistivity(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const a = fields.num("spacing", "전극 간격 m");
  const R = fields.num("resistance", "측정 저항 Ω");
  fields.requirePositive("spacing", "간격", a);
  fields.requirePositive("resistance", "저항", R);
  if (fields.failed()) return fields.fail();
  const rho = 2 * Math.PI * a * R;
  return ok({
    metrics: [metric("rho", "겉보기 토양저항률", rho, "Ω·m", precision, { primary: true })],
    inputSummary: [
      { label: "a", value: `${a} m` },
      { label: "R", value: `${R} Ω` },
    ],
    interpretation: `Wenner 4극법 겉보기 저항률 ρ = 2πaR = ${roundTo(rho, precision)} Ω·m.`,
    warnings: [warning("info", "겉보기 값", "심도·층상에 따라 해석이 달라집니다.")],
    formulaUsed: "ρ = 2 π a R",
    steps: [`ρ = 2π × ${a} × ${R} = ${roundTo(rho, precision)} Ω·m`],
    reviewStatus: review("in-range", "측정값 환산입니다. 접지 설계 모델은 별도입니다."),
  });
}

/** 단열식 S = (I / k) √t . k는 사용자가 표준 표에서 입력 */
export function calculateEarthConductor(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const I = fields.num("faultA", "지락·단락전류 A");
  const t = fields.num("time", "차단시간 s");
  fields.requirePositive("faultA", "전류", I);
  fields.requirePositive("time", "시간", t);
  if (fields.failed()) return fields.fail();

  const timeOk = t <= KEC_EARTH_CONDUCTOR.adiabaticTimeLimitS + 1e-9;
  const outOfRange = KEC_EARTH_CONDUCTOR.adiabaticOutOfRangeLines.join(" ");

  if (!timeOk) {
    return ok({
      metrics: [{ id: "scope", label: "단열식 계산", value: "적용범위 밖", primary: true }],
      inputSummary: [
        { label: "I", value: `${I} A` },
        { label: "t", value: `${t} s` },
        { label: "t ≤ 5 s", value: "이 계산식의 적용범위 밖" },
      ],
      interpretation: outOfRange,
      warnings: [
        warning("error", "k·표 미내장", "KEC 142.3.2는 표 142.3-1 또는 계산식으로 선정합니다. Ampory는 단열식만 제공하며 k 수치표는 내장하지 않습니다."),
        warning("warning", "차단시간 적용범위", outOfRange),
      ],
      formulaUsed: "S = (I / k) × √t  (t ≤ 5 s)",
      steps: [
        `t = ${t} s > 5 s — Ampory가 제공하는 단열식 계산방법의 적용범위 밖입니다.`,
        "단면적 결과는 표시하지 않습니다. 표 142.3-1 등 다른 선정방법을 별도로 검토하세요.",
      ],
      reviewStatus: review("caution", "현재 Ampory 단열식 계산방법의 적용범위 밖입니다. 표 142.3-1 등 다른 선정방법을 검토하세요."),
    });
  }

  const k = fields.num("kFactor", "재질 계수 k");
  fields.requirePositive("kFactor", "k", k);
  if (fields.failed()) return fields.fail();
  const s = (I / k) * Math.sqrt(t);

  const warnings = [
    warning(
      "error",
      "k·표 미내장",
      "KEC 142.3.2는 표 142.3-1 또는 계산식으로 선정합니다. Ampory는 단열식만 제공하며 k 수치표는 내장하지 않습니다.",
    ),
    warning(
      "info",
      "차단시간 적용범위",
      "단열식은 차단시간 5초 이하에 적용하는 계산 경로입니다. 표 142.3-1 선정과 병행 확인하세요.",
    ),
  ];

  return ok({
    metrics: [metric("s", "최소 단면적(단열 공식)", s, "mm²", precision, { primary: true })],
    inputSummary: [
      { label: "I", value: `${I} A` },
      { label: "t", value: `${t} s` },
      { label: "k", value: String(k) },
      { label: "t ≤ 5 s", value: "적용범위 내" },
    ],
    interpretation: `S = (I/k)√t = ${roundTo(s, precision)} mm². KEC 142.3.2 보호도체 최소 단면적의 계산식 경로입니다. 차단시간 5초 이하 적용범위. k와 표 142.3-1은 사용자가 원문에서 확인해야 합니다.`,
    warnings,
    formulaUsed: "S = (I / k) × √t  (t ≤ 5 s)",
    steps: [`S = (${I} / ${k}) × √${t} = ${roundTo(s, precision)} mm²`],
    reviewStatus: review("check", "단열 공식 결과입니다. 기계적 강도·시공 최소 굵기를 추가 확인하세요."),
  });
}

export function calculateSpdHelper(input: CalcInput, precision: number): CalculationOutcome {
  const loc = input.location ?? "origin";
  const un = Number(input.un || "380");
  const uc = Number(input.uc || "0");
  const inKa = Number(input.inKa || "0");
  const locLabel =
    loc === "origin" ? "인입·SPD 1차" : loc === "sub" ? "분전반" : "기기 근접";

  const notes = [
    loc === "origin"
      ? "인입측은 낙뢰·개폐 서지 에너지가 큽니다. 전원 계통 형태(TN/TT)와 제조사 적용을 확인하세요."
      : loc === "sub"
        ? "분전반은 인입 SPD와 에너지 협조(분리거리 또는 디커플링)가 필요합니다."
        : "기기 근접 SPD는 잔류 전압과 장비 내전압을 맞춰야 합니다.",
  ];

  const warnings = [
    warning("error", "간이 검토", "IEC 62305 위험평가 전체가 아니며 SPD를 자동 선정하지 않습니다."),
    warning("info", "Uc", "Uc는 계통 최대 연속 전압보다 커야 합니다. 중성선·접지 방식을 확인하세요."),
  ];

  let status = review("check", "위치별 주의사항입니다. 제품 선정은 제조사 적용지침을 따르세요.");
  if (uc > 0 && un > 0 && uc < un) {
    status = review("caution", "입력 Uc가 공칭전압보다 낮습니다. 오입력 가능성이 있습니다.");
  }

  return ok({
    metrics: [
      metric("loc", "검토 위치", 0, "", 0, { primary: true, value: locLabel }),
      ...(inKa > 0 ? [metric("in", "입력 In", inKa, "kA", precision)] : []),
    ],
    inputSummary: [
      { label: "Un", value: String(un) },
      { label: "Uc", value: uc > 0 ? String(uc) : "미입력" },
    ],
    interpretation: notes[0],
    warnings,
    formulaUsed: "선정 공식 없음 — 위치·계통·제조사 데이터 확인 체크",
    steps: ["위치 선택 → 계통 접지방식 확인 → Uc/Up/In(Iimp) 명판 비교 → 1·2·3차 협조"],
    reviewStatus: status,
  });
}
