import type { CalculationOutcome, CalculationResult } from "@/lib/types";
import { fail, metric, warning } from "@/lib/calculations/helpers";
import { SQRT_3, WATTS_PER_HP, conductorOhmPerKm, conductorResistanceOhm, resistivityOf, toMeters, toOhmPerKm, toVolts, toWattHours, toWatts } from "@/lib/math/units";
import { parseNumber } from "@/lib/math/validate";
import { roundTo } from "@/lib/math/round";

export type CalcInput = Record<string, string>;

function num(input: CalcInput, id: string, label: string): number {
  return parseNumber(input[id], label);
}

function optionalNum(input: CalcInput, id: string, fallback: number): number {
  const raw = input[id];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  return parseNumber(raw, id);
}

export function calculateSinglePhaseCurrent(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  let P = 0;
  let V = 0;
  let pf = 0;
  let eta = 1;

  try {
    P = toWatts(num(input, "power", "유효전력"), input.powerUnit ?? "kW");
  } catch (error) {
    fieldErrors.power = error instanceof Error ? error.message : "유효전력을 확인하세요.";
  }
  try {
    V = toVolts(num(input, "voltage", "전압"), input.voltageUnit ?? "V");
  } catch (error) {
    fieldErrors.voltage = error instanceof Error ? error.message : "전압을 확인하세요.";
  }
  try {
    pf = optionalNum(input, "pf", 1);
    if (pf <= 0 || pf > 1) {
      fieldErrors.pf = "역률은 0 초과 1 이하여야 합니다.";
    }
  } catch (error) {
    fieldErrors.pf = error instanceof Error ? error.message : "역률을 확인하세요.";
  }
  try {
    eta = optionalNum(input, "efficiency", 1);
    if (eta <= 0 || eta > 1) {
      fieldErrors.efficiency = "효율은 0 초과 1 이하여야 합니다.";
    }
  } catch (error) {
    fieldErrors.efficiency = error instanceof Error ? error.message : "효율을 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fail(fieldErrors);
  }

  const denom = V * pf * eta;
  if (denom === 0) {
    return fail({}, "전압·역률·효율의 곱이 0이 되어 전류를 계산할 수 없습니다.");
  }

  const I = P / denom;
  const kW = P / 1000;
  const kVA = kW / pf;

  const warnings = [];
  if (I > 400) {
    warnings.push(
      warning("warning", "큰 전류", "400 A를 넘는 단상 전류입니다. 3상 공급 또는 단면적·병렬 회로를 검토하세요."),
    );
  }
  if (pf < 0.7) {
    warnings.push(warning("info", "낮은 역률", "역률이 낮아 동일 전력 대비 전류가 큽니다."));
  }

  return result({
    metrics: [
      metric("current", "부하전류", I, "A", precision, { primary: true }),
      metric("kva", "피상전력", kVA, "kVA", precision),
      metric("kw", "유효전력", kW, "kW", precision),
    ],
    inputSummary: [
      { label: "유효전력", value: `${roundTo(kW, precision)} kW` },
      { label: "전압", value: `${roundTo(V, precision)} V` },
      { label: "역률", value: String(roundTo(pf, 3)) },
      { label: "효율", value: String(roundTo(eta, 3)) },
    ],
    interpretation: `단상 ${roundTo(V, 0)} V에서 ${roundTo(kW, precision)} kW 부하의 정상 전류는 ${roundTo(I, precision)} A입니다. 차단기·케이블 선정 시 기동전류, 온도, 규정을 추가로 적용하세요.`,
    warnings,
    formulaUsed: "I = P / (V × PF × η)",
  });
}

export function calculateThreePhaseCurrent(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  let P = 0;
  let V = 0;
  let pf = 0;
  let eta = 1;

  try {
    P = toWatts(num(input, "power", "유효전력"), input.powerUnit ?? "kW");
  } catch (error) {
    fieldErrors.power = error instanceof Error ? error.message : "유효전력을 확인하세요.";
  }
  try {
    V = toVolts(num(input, "voltage", "선간전압"), input.voltageUnit ?? "V");
  } catch (error) {
    fieldErrors.voltage = error instanceof Error ? error.message : "전압을 확인하세요.";
  }
  try {
    pf = optionalNum(input, "pf", 1);
    if (pf <= 0 || pf > 1) fieldErrors.pf = "역률은 0 초과 1 이하여야 합니다.";
  } catch (error) {
    fieldErrors.pf = error instanceof Error ? error.message : "역률을 확인하세요.";
  }
  try {
    eta = optionalNum(input, "efficiency", 1);
    if (eta <= 0 || eta > 1) fieldErrors.efficiency = "효율은 0 초과 1 이하여야 합니다.";
  } catch (error) {
    fieldErrors.efficiency = error instanceof Error ? error.message : "효율을 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const denom = SQRT_3 * V * pf * eta;
  if (denom === 0) {
    return fail({}, "선간전압·역률·효율의 곱이 0이 되어 전류를 계산할 수 없습니다.");
  }

  const I = P / denom;
  const kW = P / 1000;
  const kVA = kW / pf;

  const warnings = [];
  if (V < 100) {
    warnings.push(
      warning("warning", "전압 확인", "선간전압이 매우 낮습니다. 상전압을 넣지 않았는지 확인하세요."),
    );
  }
  if (pf < 0.7) {
    warnings.push(warning("info", "낮은 역률", "역률이 낮아 선전류와 필요 kVA가 증가합니다."));
  }

  return result({
    metrics: [
      metric("current", "선전류", I, "A", precision, { primary: true }),
      metric("kva", "피상전력", kVA, "kVA", precision),
      metric("kw", "유효전력", kW, "kW", precision),
    ],
    inputSummary: [
      { label: "유효전력", value: `${roundTo(kW, precision)} kW` },
      { label: "선간전압", value: `${roundTo(V, precision)} V` },
      { label: "역률", value: String(roundTo(pf, 3)) },
      { label: "효율", value: String(roundTo(eta, 3)) },
    ],
    interpretation: `3상 평형 ${roundTo(V, 0)} V 선간전압에서 ${roundTo(kW, precision)} kW의 선전류는 ${roundTo(I, precision)} A입니다.`,
    warnings,
    formulaUsed: "I = P / (√3 × V × PF × η)",
  });
}

export function calculateKwKvaHp(input: CalcInput, precision: number): CalculationOutcome {
  const mode = input.mode ?? "from-kw";
  const fieldErrors: Record<string, string> = {};
  let pf = 1;
  try {
    pf = optionalNum(input, "pf", 1);
    if (pf <= 0 || pf > 1) fieldErrors.pf = "역률은 0 초과 1 이하여야 합니다.";
  } catch (error) {
    fieldErrors.pf = error instanceof Error ? error.message : "역률을 확인하세요.";
  }

  let watts = 0;
  try {
    if (mode === "from-kw") {
      watts = toWatts(num(input, "power", "유효전력"), input.powerUnit ?? "kW");
    } else if (mode === "from-kva") {
      const kva = num(input, "kva", "피상전력");
      if (kva <= 0) fieldErrors.kva = "피상전력은 0보다 커야 합니다.";
      watts = kva * 1000 * pf;
    } else {
      const hp = num(input, "hp", "마력");
      if (hp <= 0) fieldErrors.hp = "마력은 0보다 커야 합니다.";
      watts = hp * WATTS_PER_HP;
    }
  } catch (error) {
    const key = mode === "from-kva" ? "kva" : mode === "from-hp" ? "hp" : "power";
    fieldErrors[key] = error instanceof Error ? error.message : "입력값을 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const kW = watts / 1000;
  const kVA = kW / pf;
  const hp = watts / WATTS_PER_HP;

  return result({
    metrics: [
      metric("kw", "유효전력", kW, "kW", precision, { primary: true }),
      metric("kva", "피상전력", kVA, "kVA", precision),
      metric("hp", "기계적 마력", hp, "HP", precision),
      metric("w", "유효전력", watts, "W", 0),
    ],
    inputSummary: [
      { label: "입력 모드", value: mode },
      { label: "역률", value: String(roundTo(pf, 3)) },
    ],
    interpretation: `${roundTo(kW, precision)} kW는 역률 ${roundTo(pf, 3)}에서 ${roundTo(kVA, precision)} kVA, 기계적 마력 ${roundTo(hp, precision)} HP에 해당합니다. 모터 명판 HP는 출력이며 입력 kW는 효율만큼 더 큽니다.`,
    warnings: [
      warning("info", "마력 정의", "1 HP = 746 W (mechanical). 메트릭 마력 735.5 W는 사용하지 않았습니다."),
    ],
    formulaUsed: "kW = kVA × PF,  HP = kW / 0.746",
  });
}

export function calculatePowerFactor(input: CalcInput, precision: number): CalculationOutcome {
  const mode = input.mode ?? "from-power";
  const fieldErrors: Record<string, string> = {};
  let P = 0;
  let S = 0;

  try {
    if (mode === "from-power") {
      P = num(input, "kw", "유효전력 kW");
      S = num(input, "kva", "피상전력 kVA");
      if (P <= 0) fieldErrors.kw = "유효전력은 0보다 커야 합니다.";
      if (S <= 0) fieldErrors.kva = "피상전력은 0보다 커야 합니다.";
      if (P > S + 1e-9) fieldErrors.kw = "유효전력은 피상전력보다 클 수 없습니다.";
    } else {
      const V = toVolts(num(input, "voltage", "전압"), input.voltageUnit ?? "V");
      const I = num(input, "current", "전류 A");
      P = num(input, "kw", "유효전력 kW");
      const phase = input.phase ?? "3";
      if (I <= 0) fieldErrors.current = "전류는 0보다 커야 합니다.";
      if (P <= 0) fieldErrors.kw = "유효전력은 0보다 커야 합니다.";
      S = phase === "1" ? (V * I) / 1000 : (SQRT_3 * V * I) / 1000;
      if (P > S + 1e-6) {
        fieldErrors.kw = "측정 전압·전류로 구한 피상전력보다 유효전력이 큽니다. 입력을 확인하세요.";
      }
    }
  } catch (error) {
    fieldErrors._form = error instanceof Error ? error.message : "입력값을 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);
  if (S === 0) return fail({}, "피상전력이 0이라 역률을 나눌 수 없습니다.");

  const pf = P / S;
  const Q = Math.sqrt(Math.max(S * S - P * P, 0));
  const warnings = [];
  if (pf < 0.9) {
    warnings.push(
      warning("warning", "역률 주의", "0.9 미만입니다. 수전 계약과 변압기 여유, 보상 설비를 검토하세요."),
    );
  }
  if (pf < 0.7) {
    warnings.push(warning("warning", "매우 낮은 역률", "전류와 손실이 크게 증가하는 구간입니다."));
  }

  return result({
    metrics: [
      metric("pf", "역률", pf, "—", Math.max(precision, 3), { primary: true }),
      metric("q", "무효전력", Q, "kvar", precision),
      metric("p", "유효전력", P, "kW", precision),
      metric("s", "피상전력", S, "kVA", precision),
    ],
    inputSummary: [
      { label: "모드", value: mode === "from-power" ? "kW·kVA" : "전압·전류" },
    ],
    interpretation: `역률 ${roundTo(pf, 3)} (지상 크기로 표시). 무효전력 크기는 ${roundTo(Q, precision)} kvar입니다. 진상/지상은 이 계산만으로 구분하지 않습니다.`,
    warnings,
    formulaUsed: "PF = P / S,  Q = √(S² − P²)",
  });
}

export function calculateTransformerLoad(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  let rated = 0;
  let loadKva = 0;
  try {
    rated = num(input, "ratedKva", "정격 용량 kVA");
    if (rated <= 0) fieldErrors.ratedKva = "정격 용량은 0보다 커야 합니다.";
  } catch (error) {
    fieldErrors.ratedKva = error instanceof Error ? error.message : "정격을 확인하세요.";
  }

  const loadMode = input.loadMode ?? "kw";
  try {
    if (loadMode === "kva") {
      loadKva = num(input, "loadKva", "부하 kVA");
      if (loadKva < 0) fieldErrors.loadKva = "부하 kVA는 0 이상이어야 합니다.";
    } else {
      const kw = num(input, "loadKw", "부하 kW");
      const pf = optionalNum(input, "pf", 0.9);
      if (kw < 0) fieldErrors.loadKw = "부하 kW는 0 이상이어야 합니다.";
      if (pf <= 0 || pf > 1) fieldErrors.pf = "역률은 0 초과 1 이하여야 합니다.";
      else loadKva = kw / pf;
    }
  } catch (error) {
    fieldErrors.loadKw = error instanceof Error ? error.message : "부하를 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const ratio = (loadKva / rated) * 100;
  const spare = rated - loadKva;
  const warnings = [];
  if (ratio > 100) {
    warnings.push(
      warning("error", "과부하", "정격을 초과했습니다. 지속 과부하는 절연 수명을 단축합니다. 제조사 과부하 내량을 확인하세요."),
    );
  } else if (ratio >= 80) {
    warnings.push(warning("warning", "높은 부하율", "상시 80% 이상이면 온도와 증설 여유를 검토하세요."));
  } else if (ratio < 20) {
    warnings.push(warning("info", "낮은 부하율", "경부하는 무효 대기 손실 비중이 커질 수 있습니다."));
  }

  let band = "통상 운전";
  if (ratio > 100) band = "과부하";
  else if (ratio >= 80) band = "높은 부하";
  else if (ratio < 30) band = "경부하";

  return result({
    metrics: [
      metric("ratio", "부하율", ratio, "%", precision, { primary: true }),
      metric("load", "부하 용량", loadKva, "kVA", precision),
      metric("spare", "여유 용량", spare, "kVA", precision),
      metric("rated", "정격", rated, "kVA", precision),
    ],
    inputSummary: [
      { label: "정격", value: `${roundTo(rated, precision)} kVA` },
      { label: "부하", value: `${roundTo(loadKva, precision)} kVA` },
    ],
    interpretation: `변압기 부하율은 ${roundTo(ratio, precision)}% (${band})입니다. 고조파·온도·고도 derating은 포함되지 않았습니다.`,
    warnings,
    formulaUsed: "부하율(%) = (S_load / S_rated) × 100",
  });
}

export function calculateVoltageDrop(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  const phase = input.phase ?? "3";
  let I = 0;
  let L = 0;
  let V = 0;
  let rOhmKm = 0;

  try {
    I = num(input, "current", "전류 A");
    if (I <= 0) fieldErrors.current = "전류는 0보다 커야 합니다.";
  } catch (error) {
    fieldErrors.current = error instanceof Error ? error.message : "전류를 확인하세요.";
  }
  try {
    L = toMeters(num(input, "length", "길이"), input.lengthUnit ?? "m");
    if (L <= 0) fieldErrors.length = "길이는 0보다 커야 합니다.";
  } catch (error) {
    fieldErrors.length = error instanceof Error ? error.message : "길이를 확인하세요.";
  }
  try {
    V = toVolts(num(input, "voltage", "전압"), input.voltageUnit ?? "V");
    if (V <= 0) fieldErrors.voltage = "전압은 0보다 커야 합니다.";
  } catch (error) {
    fieldErrors.voltage = error instanceof Error ? error.message : "전압을 확인하세요.";
  }

  const rMode = input.rMode ?? "ohm";
  try {
    if (rMode === "size") {
      const area = num(input, "area", "단면적 mm²");
      if (area <= 0) fieldErrors.area = "단면적은 0보다 커야 합니다.";
      const material = (input.material ?? "cu") as "cu" | "al";
      rOhmKm = conductorOhmPerKm(resistivityOf(material), area);
    } else {
      rOhmKm = toOhmPerKm(num(input, "resistance", "도체 저항"), input.resistanceUnit ?? "ohm/km");
      if (rOhmKm <= 0) fieldErrors.resistance = "저항은 0보다 커야 합니다.";
    }
  } catch (error) {
    fieldErrors.resistance = error instanceof Error ? error.message : "저항 입력을 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const lengthKm = L / 1000;
  const dV = phase === "1" ? 2 * I * lengthKm * rOhmKm : SQRT_3 * I * lengthKm * rOhmKm;
  const pct = (dV / V) * 100;
  const warnings = [];
  if (pct > 5) {
    warnings.push(
      warning("warning", "전압강하 5% 초과", "많은 저압 간선 지침에서 5%를 넘기면 단면적 또는 경로를 재검토합니다. 프로젝트 기준을 확인하세요."),
    );
  } else if (pct > 3) {
    warnings.push(
      warning("info", "전압강하 3% 초과", "분기회로 지침에서 3%를 쓰는 경우 여유가 부족할 수 있습니다."),
    );
  }
  warnings.push(
    warning("info", "저항 근사", "리액턴스와 온도 보정은 포함하지 않았습니다. 정확한 설계는 케이블 임피던스표를 사용하세요."),
  );

  return result({
    metrics: [
      metric("dv", "전압강하", dV, "V", precision, { primary: true }),
      metric("pct", "전압강하율", pct, "%", precision),
      metric("r", "사용 저항", rOhmKm, "Ω/km", 4),
    ],
    inputSummary: [
      { label: "방식", value: phase === "1" ? "단상" : "3상" },
      { label: "전류", value: `${roundTo(I, precision)} A` },
      { label: "편도 길이", value: `${roundTo(L, precision)} m` },
      { label: "기준 전압", value: `${roundTo(V, precision)} V` },
    ],
    interpretation: `${phase === "1" ? "단상" : "3상"} 저항 근사 전압강하는 ${roundTo(dV, precision)} V (${roundTo(pct, precision)}%)입니다. 허용전류·단락내량과는 별개입니다.`,
    warnings,
    formulaUsed:
      phase === "1"
        ? "ΔV = 2 × I × L × r / 1000"
        : "ΔV = √3 × I × L × r / 1000",
  });
}

export function calculateCableResistance(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  let area = 0;
  let length = 0;
  try {
    area = num(input, "area", "단면적 mm²");
    if (area <= 0) fieldErrors.area = "단면적은 0보다 커야 합니다.";
  } catch (error) {
    fieldErrors.area = error instanceof Error ? error.message : "단면적을 확인하세요.";
  }
  try {
    length = toMeters(num(input, "length", "길이"), input.lengthUnit ?? "m");
    if (length <= 0) fieldErrors.length = "길이는 0보다 커야 합니다.";
  } catch (error) {
    fieldErrors.length = error instanceof Error ? error.message : "길이를 확인하세요.";
  }
  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const material = (input.material ?? "cu") as "cu" | "al";
  const rho = resistivityOf(material);
  const R = conductorResistanceOhm({ resistivity: rho, lengthM: length, areaMm2: area });
  const rKm = conductorOhmPerKm(rho, area);

  return result({
    metrics: [
      metric("R", "도체 저항(편도)", R, "Ω", Math.max(precision, 4), { primary: true }),
      metric("rkm", "km당 저항", rKm, "Ω/km", 4),
      metric("loop", "단상 왕복 저항", 2 * R, "Ω", Math.max(precision, 4)),
    ],
    inputSummary: [
      { label: "재질", value: material === "cu" ? "구리" : "알루미늄" },
      { label: "단면적", value: `${area} mm²` },
      { label: "길이", value: `${roundTo(length, 2)} m` },
      { label: "저항률", value: `${rho} Ω·mm²/m (20°C 근사)` },
    ],
    interpretation: `20°C 저항률 근사값입니다. 운전 온도와 교류 표피효과에 따라 실저항은 더 큽니다. 허용전류 선정이 아닙니다.`,
    warnings: [
      warning("info", "근사 저항률", "구리 0.0175, 알루미늄 0.0282 Ω·mm²/m. IEC 도체 저항표와 다를 수 있습니다."),
    ],
    formulaUsed: "R = ρ × L / A",
  });
}

export function calculateBreakerReference(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  let I = 0;
  let margin = 1.25;
  try {
    I = num(input, "current", "부하전류 A");
    if (I <= 0) fieldErrors.current = "부하전류는 0보다 커야 합니다.";
  } catch (error) {
    fieldErrors.current = error instanceof Error ? error.message : "전류를 확인하세요.";
  }
  try {
    margin = optionalNum(input, "margin", 1.25);
    if (margin < 1 || margin > 3) fieldErrors.margin = "여유율은 1.0~3.0 사이로 입력하세요.";
  } catch (error) {
    fieldErrors.margin = error instanceof Error ? error.message : "여유율을 확인하세요.";
  }
  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const minRating = I * margin;
  const standard = nearestBreaker(minRating);

  return result({
    metrics: [
      metric("min", "참고 최소 정격", minRating, "A", precision, { primary: true }),
      metric("std", "가까운 상용 정격", standard, "A", 0),
      metric("load", "부하전류", I, "A", precision),
    ],
    inputSummary: [
      { label: "부하전류", value: `${roundTo(I, precision)} A` },
      { label: "여유율", value: String(roundTo(margin, 2)) },
    ],
    interpretation: `부하전류에 여유율 ${roundTo(margin, 2)}를 곱한 참고값은 ${roundTo(minRating, precision)} A입니다. 가까운 상용 정격 ${standard} A는 제안이 아니라 스케일 참고입니다.`,
    warnings: [
      warning(
        "error",
        "선정 승인 아님",
        "단락용량, 보호협조, 모터 기동, 케이블 허용전류, 제조사 특성곡선을 확인하기 전까지 차단기를 선정하지 마세요.",
      ),
    ],
    formulaUsed: "I_ref = I_load × 여유율",
  });
}

const BREAKER_STEPS = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000];

function nearestBreaker(minA: number): number {
  const found = BREAKER_STEPS.find((step) => step >= minA - 1e-9);
  return found ?? Math.ceil(minA);
}

export function calculateUpsBackup(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  const mode = input.mode ?? "battery";
  let energyWh = 0;
  let P = 0;
  let eta = 0.92;
  let dod = 0.8;

  try {
    P = toWatts(num(input, "load", "부하전력"), input.loadUnit ?? "kW");
    if (P <= 0) fieldErrors.load = "부하전력은 0보다 커야 합니다.";
  } catch (error) {
    fieldErrors.load = error instanceof Error ? error.message : "부하를 확인하세요.";
  }
  try {
    eta = optionalNum(input, "efficiency", 0.92);
    if (eta <= 0 || eta > 1) fieldErrors.efficiency = "효율은 0 초과 1 이하여야 합니다.";
  } catch (error) {
    fieldErrors.efficiency = error instanceof Error ? error.message : "효율을 확인하세요.";
  }
  try {
    dod = optionalNum(input, "dod", 0.8);
    if (dod <= 0 || dod > 1) fieldErrors.dod = "방전심도는 0 초과 1 이하여야 합니다.";
  } catch (error) {
    fieldErrors.dod = error instanceof Error ? error.message : "DOD를 확인하세요.";
  }

  try {
    if (mode === "energy") {
      energyWh = toWattHours(num(input, "energy", "배터리 에너지"), input.energyUnit ?? "kWh");
    } else {
      const V = num(input, "batteryV", "배터리 전압 V");
      const ah = num(input, "ah", "용량 Ah");
      if (V <= 0) fieldErrors.batteryV = "배터리 전압은 0보다 커야 합니다.";
      if (ah <= 0) fieldErrors.ah = "용량은 0보다 커야 합니다.";
      energyWh = V * ah;
    }
  } catch (error) {
    fieldErrors.ah = error instanceof Error ? error.message : "배터리 입력을 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);
  if (P === 0) return fail({}, "부하가 0이라 시간을 나눌 수 없습니다.");

  const usable = energyWh * eta * dod;
  const hours = usable / P;
  const minutes = hours * 60;
  const warnings = [];
  if (minutes < 5) {
    warnings.push(warning("warning", "매우 짧은 백업", "발전기 기동 또는 부하 축소가 필요할 수 있습니다."));
  }
  if (minutes > 180) {
    warnings.push(warning("info", "긴 추정 시간", "고율 방전과 Peukert 효과로 실제 시간은 더 짧을 수 있습니다."));
  }

  return result({
    metrics: [
      metric("min", "추정 백업시간", minutes, "min", precision, { primary: true }),
      metric("h", "추정 백업시간", hours, "h", Math.max(precision, 3)),
      metric("usable", "가용 에너지", usable / 1000, "kWh", precision),
    ],
    inputSummary: [
      { label: "부하", value: `${roundTo(P / 1000, precision)} kW` },
      { label: "효율", value: String(roundTo(eta, 3)) },
      { label: "DOD", value: String(roundTo(dod, 3)) },
    ],
    interpretation: `일정 전력 가정 시 약 ${roundTo(minutes, precision)}분입니다. 제조사 런타임 곡선, 온도, 노후화를 우선하세요.`,
    warnings: [
      ...warnings,
      warning("info", "Peukert 미반영", "고율 방전 시 유효 Ah가 감소합니다."),
    ],
    formulaUsed: "t = (V × C × η × DOD) / P",
  });
}

export function calculateUpsCapacity(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  let kw = 0;
  let pf = 0.9;
  let growth = 0;
  let outputPf = 0.9;
  try {
    kw = num(input, "loadKw", "부하 kW");
    if (kw <= 0) fieldErrors.loadKw = "부하 kW는 0보다 커야 합니다.";
  } catch (error) {
    fieldErrors.loadKw = error instanceof Error ? error.message : "부하를 확인하세요.";
  }
  try {
    pf = optionalNum(input, "pf", 0.9);
    if (pf <= 0 || pf > 1) fieldErrors.pf = "부하 역률은 0 초과 1 이하여야 합니다.";
  } catch (error) {
    fieldErrors.pf = error instanceof Error ? error.message : "역률을 확인하세요.";
  }
  try {
    growth = optionalNum(input, "growth", 0.2);
    if (growth < 0 || growth > 2) fieldErrors.growth = "여유율은 0~2 (0~200%)로 입력하세요.";
  } catch (error) {
    fieldErrors.growth = error instanceof Error ? error.message : "여유율을 확인하세요.";
  }
  try {
    outputPf = optionalNum(input, "outputPf", 0.9);
    if (outputPf <= 0 || outputPf > 1) fieldErrors.outputPf = "UPS 출력 역률은 0 초과 1 이하여야 합니다.";
  } catch (error) {
    fieldErrors.outputPf = error instanceof Error ? error.message : "UPS 역률을 확인하세요.";
  }
  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const designKw = kw * (1 + growth);
  const loadKva = designKw / pf;
  const upsKva = Math.max(loadKva, designKw / outputPf);

  return result({
    metrics: [
      metric("kva", "필요 UPS 용량", upsKva, "kVA", precision, { primary: true }),
      metric("kw", "설계 유효전력", designKw, "kW", precision),
      metric("loadkva", "부하 kVA", loadKva, "kVA", precision),
    ],
    inputSummary: [
      { label: "현재 부하", value: `${roundTo(kw, precision)} kW` },
      { label: "성장·여유", value: `${roundTo(growth * 100, 0)}%` },
      { label: "부하 역률", value: String(roundTo(pf, 3)) },
    ],
    interpretation: `여유를 반영한 필요 용량은 약 ${roundTo(upsKva, precision)} kVA입니다. 병렬 N+1, 고조파, 투입 돌입은 별도입니다.`,
    warnings: [
      warning("info", "모듈 대수", "모듈형 UPS는 프레임 용량과 모듈 정격을 각각 확인하세요."),
    ],
    formulaUsed: "S = max(P_design / PF_load, P_design / PF_ups)",
  });
}

export function calculateGeneratorLoad(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  let ratedKw = 0;
  let loadKw = 0;
  let pf = 0.8;
  const ratingType = input.ratingType ?? "prime";

  try {
    if (input.ratedMode === "kva") {
      const kva = num(input, "ratedKva", "정격 kVA");
      pf = optionalNum(input, "pf", 0.8);
      if (kva <= 0) fieldErrors.ratedKva = "정격 kVA는 0보다 커야 합니다.";
      if (pf <= 0 || pf > 1) fieldErrors.pf = "역률은 0 초과 1 이하여야 합니다.";
      ratedKw = kva * pf;
    } else {
      ratedKw = num(input, "ratedKw", "정격 kW");
      if (ratedKw <= 0) fieldErrors.ratedKw = "정격 kW는 0보다 커야 합니다.";
      pf = optionalNum(input, "pf", 0.8);
    }
  } catch (error) {
    fieldErrors.ratedKw = error instanceof Error ? error.message : "정격을 확인하세요.";
  }
  try {
    loadKw = num(input, "loadKw", "실부하 kW");
    if (loadKw < 0) fieldErrors.loadKw = "실부하는 0 이상이어야 합니다.";
  } catch (error) {
    fieldErrors.loadKw = error instanceof Error ? error.message : "실부하를 확인하세요.";
  }
  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const ratio = (loadKw / ratedKw) * 100;
  const spare = ratedKw - loadKw;
  const warnings = [];
  if (ratio > 100) {
    warnings.push(warning("error", "과부하", "정격 출력을 초과합니다. 부하 분리 또는 용량 재검토가 필요합니다."));
  } else if (ratio < 30) {
    warnings.push(
      warning("warning", "저부하", "디젤 엔진은 장시간 30% 미만 운전 시 습식 적재(wet stacking) 위험이 있습니다."),
    );
  }
  if (ratingType === "standby" && ratio > 70) {
    warnings.push(
      warning("warning", "스탠바이 정격", "스탠바이 정격은 제한 시간 비상 운전용입니다. 연속 고부하는 프라임 정격을 확인하세요."),
    );
  }

  return result({
    metrics: [
      metric("ratio", "부하율", ratio, "%", precision, { primary: true }),
      metric("spare", "여유 출력", spare, "kW", precision),
      metric("rated", "적용 정격", ratedKw, "kW", precision),
      metric("kva", "정격 kVA(역률 환산)", ratedKw / pf, "kVA", precision),
    ],
    inputSummary: [
      { label: "정격 종류", value: ratingType === "standby" ? "스탠바이" : "프라임/연속" },
      { label: "실부하", value: `${roundTo(loadKw, precision)} kW` },
    ],
    interpretation: `발전기 부하율은 ${roundTo(ratio, precision)}%입니다. 통상 60~80% 근처를 실무에서 자주 목표로 하지만 제조사 권고가 우선입니다.`,
    warnings,
    formulaUsed: "부하율(%) = (P_load / P_rated) × 100",
  });
}

export function calculateMonthlyEnergy(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  let e1 = 0;
  let e2 = 0;
  let d1 = 30;
  let d2 = 30;
  let price = 0;
  let demand1 = 0;
  let demand2 = 0;

  try {
    e1 = num(input, "energy1", "기준 월 kWh");
    if (e1 < 0) fieldErrors.energy1 = "사용량은 0 이상이어야 합니다.";
  } catch (error) {
    fieldErrors.energy1 = error instanceof Error ? error.message : "기준 월 사용량을 확인하세요.";
  }
  try {
    e2 = num(input, "energy2", "비교 월 kWh");
    if (e2 < 0) fieldErrors.energy2 = "사용량은 0 이상이어야 합니다.";
  } catch (error) {
    fieldErrors.energy2 = error instanceof Error ? error.message : "비교 월 사용량을 확인하세요.";
  }
  try {
    d1 = optionalNum(input, "days1", 30);
    d2 = optionalNum(input, "days2", 30);
    if (d1 <= 0 || d1 > 31) fieldErrors.days1 = "일수는 1~31입니다.";
    if (d2 <= 0 || d2 > 31) fieldErrors.days2 = "일수는 1~31입니다.";
  } catch (error) {
    fieldErrors.days1 = error instanceof Error ? error.message : "일수를 확인하세요.";
  }
  try {
    price = optionalNum(input, "price", 0);
    if (price < 0) fieldErrors.price = "단가는 0 이상이어야 합니다.";
  } catch (error) {
    fieldErrors.price = error instanceof Error ? error.message : "단가를 확인하세요.";
  }
  try {
    demand1 = optionalNum(input, "demand1", 0);
    demand2 = optionalNum(input, "demand2", 0);
    if (demand1 < 0) fieldErrors.demand1 = "최대수요는 0 이상이어야 합니다.";
    if (demand2 < 0) fieldErrors.demand2 = "최대수요는 0 이상이어야 합니다.";
  } catch (error) {
    fieldErrors.demand1 = error instanceof Error ? error.message : "최대수요를 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const normalize = input.normalize === "yes";
  const n1 = normalize ? (e1 / d1) * 30 : e1;
  const n2 = normalize ? (e2 / d2) * 30 : e2;
  const delta = n2 - n1;
  const pct = n1 === 0 ? (n2 === 0 ? 0 : Infinity) : (delta / n1) * 100;
  const costDelta = delta * price;
  const demandDelta = demand2 - demand1;

  const warnings = [];
  if (!Number.isFinite(pct)) {
    warnings.push(warning("warning", "기준 사용량 0", "변화율을 정의할 수 없습니다."));
  }
  if (Math.abs(pct) > 30 && Number.isFinite(pct)) {
    warnings.push(warning("info", "큰 변동", "조업일수, 외기온, 설비 증설 여부를 함께 보세요."));
  }
  warnings.push(
    warning("info", "요금 근사", "평균 단가 × 사용량 차이입니다. 기본요금·계절별 요금제를 반영하지 않습니다."),
  );

  const metrics = [
    metric("delta", "사용량 차이", delta, "kWh", precision, { primary: true }),
    metric("pct", "변화율", Number.isFinite(pct) ? pct : 0, "%", precision),
    metric("n1", normalize ? "30일 환산 기준" : "기준 월", n1, "kWh", precision),
    metric("n2", normalize ? "30일 환산 비교" : "비교 월", n2, "kWh", precision),
  ];
  if (price > 0) {
    metrics.push(metric("cost", "추정 요금 차이", costDelta, "원", 0));
  }
  if (demand1 > 0 || demand2 > 0) {
    metrics.push(metric("demand", "최대수요 차이", demandDelta, "kW", precision));
  }

  return result({
    metrics,
    inputSummary: [
      { label: "일수 보정", value: normalize ? "30일 환산" : "원시값" },
      { label: "기준 월", value: `${e1} kWh / ${d1}일` },
      { label: "비교 월", value: `${e2} kWh / ${d2}일` },
    ],
    interpretation: Number.isFinite(pct)
      ? `비교 월 사용량은 기준 대비 ${delta >= 0 ? "증가" : "감소"} ${roundTo(Math.abs(pct), precision)}%입니다.`
      : "기준 사용량이 0이라 변화율을 표시할 수 없습니다.",
    warnings,
    formulaUsed: "ΔE = E₂ − E₁,  변화율 = ΔE / E₁ × 100",
  });
}

function result(value: Omit<CalculationResult, "ok">): CalculationResult {
  return { ok: true, ...value };
}

export const engines: Record<string, (input: CalcInput, precision: number) => CalculationOutcome> = {
  "single-phase-current": calculateSinglePhaseCurrent,
  "three-phase-current": calculateThreePhaseCurrent,
  "kw-kva-hp": calculateKwKvaHp,
  "power-factor": calculatePowerFactor,
  "transformer-load": calculateTransformerLoad,
  "voltage-drop": calculateVoltageDrop,
  "cable-resistance": calculateCableResistance,
  "breaker-current": calculateBreakerReference,
  "ups-backup-time": calculateUpsBackup,
  "ups-capacity": calculateUpsCapacity,
  "generator-load": calculateGeneratorLoad,
  "monthly-energy": calculateMonthlyEnergy,
};
