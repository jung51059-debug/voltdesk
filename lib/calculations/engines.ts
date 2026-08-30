import type { CalculationOutcome, CalculationResult } from "@/lib/types";
import { fail, metric, warning } from "@/lib/calculations/helpers";
import { SQRT_3, WATTS_PER_HP, conductorOhmPerKm, conductorResistanceOhm, resistivityOf, toMeters, toOhmPerKm, toVolts, toWattHours, toWatts } from "@/lib/math/units";
import { parseNumber } from "@/lib/math/validate";
import { roundTo } from "@/lib/math/round";
import { review } from "@/lib/calculations/parse";
import { followUp } from "@/lib/calculations/handoff";
import { calculateMotorAcceleration, calculateMotorCurrent, calculateMotorStartingReview, calculateMotorStartVoltageDrop } from "@/lib/calculations/motor";
import { calculateHarmonicFilterReview, calculatePowerFactorCorrection, calculatePowerTriangle, calculateThd } from "@/lib/calculations/power-quality";
import { calculateBusbar, calculateCableAmpacityReview, calculateCableParallel, calculateCableSizing } from "@/lib/calculations/cable-tools";
import { calculateTransformerCurrents, calculateTransformerLoss, calculateTransformerParallel, calculateTransformerSizing } from "@/lib/calculations/transformer-tools";
import { calculateShortCircuit } from "@/lib/calculations/short-circuit";
import { calculateBreakerExtended, calculateCtRatio, calculatePtRatio, calculateRelayIec, calculateSoftStarter, calculateVfdSizing } from "@/lib/calculations/protection";
import { calculateEarthConductor, calculateGroundingRod, calculateLightingPowerDensity, calculateLux, calculateSoilResistivity, calculateSolarPv, calculateSpdHelper } from "@/lib/calculations/site-tools";
import { calculateBatteryAh, calculateEnergyIntensity, calculateEquipmentUtilization, calculateEstimatedEnergyCost, calculateGeneratorFuel, calculateGeneratorSizing, calculateGenStartVoltageDrop, calculatePmInterval, calculateYoyEnergy } from "@/lib/calculations/facility-extra";
import {
  calculateDutyCycle,
  calculateFieldCompare,
  calculateGeneratorLoadTest,
  calculatePhaseUnbalance,
  calculateRetrofitCompare,
  calculateSensorCalibration,
} from "@/lib/calculations/field-verify";

export type { CalcInput } from "@/lib/calculations/parse";
import type { CalcInput } from "@/lib/calculations/parse";
import {
  KEC_VOLTAGE_DROP_MIXED,
  kecVoltageDropCanCompare,
  kecVoltageDropJudgmentLabel,
  kecVoltageDropLimitPct,
  type KecVoltageDropLoad,
  type KecVoltageDropSupply,
} from "@/lib/calculations/kec-review";
import {
  conductorROhmKmFromSize,
  resistiveVoltageDropVolts,
  voltageDropFormula,
  voltageDropPercent,
  voltageKindHint,
  type VoltageDropPhase,
} from "@/lib/calculations/voltage-drop-core";

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
    steps: [
      `P = ${roundTo(P, 1)} W`,
      `I = ${roundTo(P, 1)} / (${roundTo(V, 2)} × ${roundTo(pf, 3)} × ${roundTo(eta, 3)}) = ${roundTo(I, precision)} A`,
    ],
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
    steps: [
      `P = ${roundTo(P, 1)} W`,
      `I = ${roundTo(P, 1)} / (√3 × ${roundTo(V, 2)} × ${roundTo(pf, 3)} × ${roundTo(eta, 3)}) = ${roundTo(I, precision)} A`,
    ],
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
  let measKw: number | null = null;
  let ir = 0;
  let isA = 0;
  let it = 0;
  let hasPhases = false;
  let usedAmps = 0;
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
    } else if (loadMode === "measured") {
      const phase = input.phase ?? "3";
      const volts = num(input, "voltage", "선간전압");
      if (volts <= 0) fieldErrors.voltage = "선간전압은 0보다 커야 합니다.";
      const irRaw = (input.ir ?? "").trim();
      const isRaw = (input.is ?? "").trim();
      const itRaw = (input.it ?? "").trim();
      hasPhases = irRaw !== "" || isRaw !== "" || itRaw !== "";
      if (hasPhases) {
        if (!irRaw || !isRaw || !itRaw) {
          fieldErrors.ir = "R/S/T 전류를 모두 넣거나 모두 비우세요.";
        } else {
          ir = optionalNum(input, "ir", 0);
          isA = optionalNum(input, "is", 0);
          it = optionalNum(input, "it", 0);
          if (ir < 0 || isA < 0 || it < 0) fieldErrors.ir = "상전류는 0 이상이어야 합니다.";
          usedAmps = (ir + isA + it) / 3;
        }
      } else {
        usedAmps = num(input, "current", "선전류");
        if (usedAmps < 0) fieldErrors.current = "선전류는 0 이상이어야 합니다.";
      }
      loadKva = phase === "1" ? (volts * usedAmps) / 1000 : (SQRT_3 * volts * usedAmps) / 1000;
      const pfRaw = input.pf;
      if (pfRaw && pfRaw.trim() !== "") {
        const pf = optionalNum(input, "pf", 0);
        if (pf <= 0 || pf > 1) fieldErrors.pf = "역률은 0 초과 1 이하여야 합니다.";
        else measKw = loadKva * pf;
      }
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
  const warnings = [
    warning("info", "추가 확인", "설비 정격·냉각조건·주위온도·부하 특성 및 운영기준을 확인하세요. 고조파·고도 derating은 포함하지 않습니다."),
  ];
  if (loadMode === "measured" && (input.phase ?? "3") === "3") {
    warnings.push(
      warning(
        "info",
        "균형계통 근사",
        "총 부하는 평균전류를 이용한 균형계통 근사값입니다. √3 V Imax를 실제 총 kVA로 표시하지 않습니다.",
      ),
    );
    warnings.push(
      warning(
        "info",
        "불평형 총전력",
        "정확한 불평형 총전력 계산에는 상별 전압/전류 phasor 또는 상별 전력계측값이 필요합니다.",
      ),
    );
  }
  if (hasPhases) {
    const iMax = Math.max(ir, isA, it);
    const iAvg = (ir + isA + it) / 3;
    if (iMax > iAvg) {
      warnings.push(
        warning("info", "상전류", "한 상 전류가 평균보다 큽니다. 전체 추정 부하율이 낮아도 해당 상 전류를 별도로 확인하세요."),
      );
    }
  }

  let designKva = 0;
  try {
    designKva = optionalNum(input, "designKva", 0);
    if (designKva < 0) fieldErrors.designKva = "부하표 예상 kVA는 0 이상이어야 합니다.";
  } catch (error) {
    fieldErrors.designKva = error instanceof Error ? error.message : "부하표 예상 kVA를 확인하세요.";
  }
  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  let ratedCurrent = 0;
  try {
    ratedCurrent = optionalNum(input, "ratedCurrent", 0);
    if (ratedCurrent < 0) fieldErrors.ratedCurrent = "명판 정격전류는 0 이상이어야 합니다.";
  } catch (error) {
    fieldErrors.ratedCurrent = error instanceof Error ? error.message : "명판 정격전류를 확인하세요.";
  }
  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const loadLabel = hasPhases ? "평균전류 기반 추정 부하" : loadMode === "measured" ? "선전류 기반 추정 부하" : "측정 kVA";
  const metrics = [
    metric("ratio", "변압기 부하율", ratio, "%", precision, { primary: true }),
    metric("load", loadLabel, loadKva, "kVA", precision),
    metric("spare", "잔여 kVA", spare, "kVA", precision),
    metric("use", "정격 대비 사용률", ratio, "%", precision),
    metric("rated", "정격", rated, "kVA", precision),
  ];
  if (measKw != null) metrics.splice(2, 0, metric("kw", "추정 kW", measKw, "kW", precision));
  if (hasPhases) {
    const iAvg = (ir + isA + it) / 3;
    const iMax = Math.max(ir, isA, it);
    const iMin = Math.min(ir, isA, it);
    const iDev = iAvg > 0 ? (Math.max(Math.abs(ir - iAvg), Math.abs(isA - iAvg), Math.abs(it - iAvg)) / iAvg) * 100 : 0;
    const maxPhase = ir >= isA && ir >= it ? "R" : isA >= it ? "S" : "T";
    metrics.push(metric("iavg", "평균 상전류", iAvg, "A", precision));
    metrics.push(metric("imax", "최대 상전류", iMax, "A", precision));
    metrics.push(metric("imin", "최소 상전류", iMin, "A", precision));
    metrics.push({ id: "imaxPhase", label: "최대 상", value: `${maxPhase}상` });
    metrics.push(metric("idev", "상전류 편차율", iDev, "%", precision));
    if (ratedCurrent > 0) {
      metrics.push(metric("irated", "명판 정격전류", ratedCurrent, "A", precision));
      metrics.push(metric("imaxpct", "최대상 정격 대비", (iMax / ratedCurrent) * 100, "%", precision));
    }
  } else if (loadMode === "measured" && usedAmps > 0) {
    metrics.push(metric("iused", "사용 선전류", usedAmps, "A", precision));
    if (ratedCurrent > 0) {
      metrics.push(metric("irated", "명판 정격전류", ratedCurrent, "A", precision));
      metrics.push(metric("imaxpct", "선전류 정격 대비", (usedAmps / ratedCurrent) * 100, "%", precision));
    }
  }
  if (designKva > 0) {
    metrics.push(metric("design", "부하표 예상 kVA", designKva, "kVA", precision));
    metrics.push(metric("gap", "실측 − 예상", loadKva - designKva, "kVA", precision));
  }

  return result({
    metrics,
    inputSummary: [
      { label: "모드", value: loadMode === "measured" ? "현장 측정" : "설계 계산" },
      { label: "정격", value: `${roundTo(rated, precision)} kVA` },
      { label: "부하", value: `${roundTo(loadKva, precision)} kVA` },
    ],
    interpretation: hasPhases
      ? `평균전류 기반 추정 부하 ${roundTo(loadKva, precision)} kVA, 부하율 ${roundTo(ratio, precision)}%. 총 부하는 평균전류를 이용한 균형계통 근사값입니다. 불평형 부하의 정확한 총 전력은 상별 전력 측정값을 사용하세요.`
      : `현재 부하율 ${roundTo(ratio, precision)}%입니다. 설비 정격·냉각조건·주위온도·부하 특성 및 운영기준을 추가 확인하세요.`,
    warnings,
    formulaUsed:
      loadMode === "measured"
        ? hasPhases
          ? "S_est = √3 V_ll Iavg / 1000 (평균전류 기반 균형계통 근사),  부하율 = S_est / S_rated × 100"
          : "S = √3 V_ll I / 1000 (3상, 선간·선전류, 균형 가정),  부하율 = S / S_rated × 100"
        : "부하율(%) = (S_load / S_rated) × 100",
    steps:
      loadMode === "measured"
        ? [
            hasPhases ? `Iavg = (${ir}+${isA}+${it}) / 3 = ${roundTo(usedAmps, precision)} A` : `선전류 = ${roundTo(usedAmps, precision)} A`,
            `S = ${roundTo(loadKva, precision)} kVA`,
            `부하율 = ${roundTo(loadKva, precision)} / ${roundTo(rated, precision)} × 100 = ${roundTo(ratio, precision)} %`,
            measKw != null ? `P ≈ S × PF = ${roundTo(measKw, precision)} kW` : "역률 미입력 — kW 생략",
          ]
        : [`부하율 = ${roundTo(loadKva, precision)} / ${roundTo(rated, precision)} × 100 = ${roundTo(ratio, precision)} %`],
    reviewStatus: review("check", "부하율 산정입니다. 변압기 상태 합격 판정이 아닙니다."),
    followUps: [
      followUp("설계값과 실측 비교", "/tools/facility/field-compare", {
        designValue: roundTo(rated, 4),
        measuredValue: roundTo(loadKva, 4),
        unit: "kVA",
      }),
      followUp("변압기 용량 산정", "/tools/electrical/transformer-sizing", { demandKw: roundTo(measKw ?? loadKva * 0.9, 4) }),
      followUp("3상 불평형 실측", "/tools/facility/phase-unbalance", {}),
    ],
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
      rOhmKm = conductorROhmKmFromSize(material, area);
    } else {
      rOhmKm = toOhmPerKm(num(input, "resistance", "도체 저항"), input.resistanceUnit ?? "ohm/km");
      if (rOhmKm <= 0) fieldErrors.resistance = "저항은 0보다 커야 합니다.";
    }
  } catch (error) {
    fieldErrors.resistance = error instanceof Error ? error.message : "저항 입력을 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const lengthKm = L / 1000;
  const vdPhase = (phase === "1" ? "1" : "3") as VoltageDropPhase;
  const dV = resistiveVoltageDropVolts(vdPhase, I, L, rOhmKm);
  const pct = voltageDropPercent(dV, V);
  const vend = V - dV;
  let allow = 0;
  try {
    allow = optionalNum(input, "allowPct", 0);
    if (allow < 0) allow = 0;
  } catch {
    allow = 0;
  }
  const kecReview = input.kecReview === "on";
  const kecScope = input.kecScope ?? "utility";
  const supply = (input.kecSupply ?? "") as KecVoltageDropSupply | "";
  const load = (input.kecLoad ?? "") as KecVoltageDropLoad | "";
  const supplyOk = supply === "lv" || supply === "hv-plus";
  const loadOk = load === "lighting" || load === "other";
  const pathSame = (input.kecPathSame ?? "yes") !== "no";
  let pathM = L;
  if (kecReview && !pathSame) {
    try {
      pathM = optionalNum(input, "kecPathLength", 0);
      if (pathM <= 0) fieldErrors.kecPathLength = "인입구→기기 경로 길이는 0보다 커야 합니다.";
    } catch (error) {
      fieldErrors.kecPathLength = error instanceof Error ? error.message : "KEC 경로 길이를 확인하세요.";
    }
  }
  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);

  const pathMatchesSegment = kecVoltageDropCanCompare(L, pathM);
  let kecMode: "off" | "out-of-scope" | "mixed" | "review" = "off";
  let kecLimit = 0;
  let kecBase = 0;
  let kecExtra = 0;
  if (kecReview && kecScope === "island") {
    kecMode = "out-of-scope";
  } else if (kecReview && kecScope === "utility" && load === "mixed") {
    kecMode = "mixed";
  } else if (kecReview && kecScope === "utility" && supplyOk && loadOk) {
    kecMode = "review";
    const limit = kecVoltageDropLimitPct({ supply, load, lengthM: pathM });
    kecBase = limit.basePct;
    kecExtra = limit.extraPct;
    kecLimit = limit.limitPct;
  } else if (kecReview) {
    kecMode = "off";
  }

  const warnings = [
    warning("info", "저항 근사", "리액턴스와 온도 보정은 포함하지 않았습니다. 정확한 설계는 케이블 임피던스표를 사용하세요."),
  ];
  const kindHint = voltageKindHint(vdPhase, V);
  if (kindHint) warnings.push(warning("info", "기준전압", kindHint));
  if (!kecReview) {
    warnings.push(
      warning(
        "info",
        "KEC 검토 꺼짐",
        "표 232.3-1과 비교하지 않습니다. 3%·5%를 자동 한도로 쓰지 않습니다. 수전 수용가 검토가 필요하면 KEC 232.3.9 검토를 켜세요.",
      ),
    );
  } else if (kecMode === "out-of-scope") {
    warnings.push(
      warning(
        "warning",
        "적용 대상 아님",
        "KEC 232.3.9는 전력공급자로부터 수전하는 수용가설비 기준입니다. 독립 자가발전기에는 해당하지 않습니다.",
      ),
    );
  } else if (kecMode === "mixed") {
    warnings.push(warning("warning", "혼합부하 · 별도 검토", KEC_VOLTAGE_DROP_MIXED));
  } else if (kecMode === "review") {
    warnings.push(
      warning(
        "info",
        "표 232.3-1 선택 검토",
        pathMatchesSegment
          ? "단일 구간이 인입구→기기 경로와 같을 때만 구간 전압강하율과 허용 참고값을 비교합니다. 모터 기동 등 별도 경우는 표보다 큰 값이 허용될 수 있습니다. 규정 합격·인증이 아닙니다."
          : "현재 결과는 선택한 케이블 구간의 전압강하입니다. KEC 기준 검토는 인입구부터 해당 기기까지 전체 공급경로의 전압강하를 합산하여 확인하세요.",
      ),
    );
    if (supply === "hv-plus") {
      warnings.push(
        warning(
          "info",
          "고압 이상 수전 주의",
          "가능한 한 최종회로 내 전압강하는 저압 수전 유형의 값을 넘지 않도록 하는 것이 바람직합니다.",
        ),
      );
    }
  } else {
    warnings.push(warning("warning", "검토 입력 부족", "수전방식과 부하종류를 넣어야 표 232.3-1과 비교합니다."));
  }

  const metrics = [
    metric("dv", "전압강하", dV, "V", precision, { primary: true }),
    metric("pct", "전압강하율", pct, "%", precision),
    { id: "kecJudge", label: "KEC 232.3.9 검토", value: kecVoltageDropJudgmentLabel(kecMode) },
    metric("vend", "말단 예상전압", vend, "V", precision),
    metric("r", "사용 저항", rOhmKm, "Ω/km", 4),
  ];
  if (kecMode === "review") {
    metrics.push(metric("kecLimit", "전체 경로 허용 참고값", kecLimit, "%", 2));
    if (pathMatchesSegment) {
      metrics.push({
        id: "kecCompare",
        label: "계산값 대비 표",
        value: pct <= kecLimit + 1e-9 ? "기준 이하 (참고)" : "기준 초과 (참고)",
      });
    }
  }

  const kecNote =
    kecMode === "off"
      ? "KEC 기준 자동 판정은 미적용입니다. KEC 232.3.9 관련 기준은 수전방식·부하종류·배선조건에 따라 확인이 필요합니다."
      : kecMode === "out-of-scope"
        ? "독립 자가발전기에는 KEC 232.3.9가 적용되지 않습니다."
        : kecMode === "mixed"
          ? KEC_VOLTAGE_DROP_MIXED
        : pathMatchesSegment
          ? `전체 경로 허용 참고값 ${roundTo(kecLimit, 2)}% (기본 ${roundTo(kecBase, 2)}% + 거리 가산 ${roundTo(kecExtra, 3)}%). 적합 판정이 아닙니다. ΔV%는 전압강하율 기준전압으로 만들었습니다. 저압은 계량기 2차측, 고압 이상은 변압기 2차측, 3상4선 220/380 V는 상전압 %는 220 V·선간 %는 380 V입니다.`
          : `현재 결과는 선택한 케이블 구간의 전압강하입니다. KEC 기준 검토는 인입구부터 해당 기기까지 전체 공급경로의 전압강하를 합산하여 확인하세요. 전체 경로 허용 참고값: ${roundTo(kecLimit, 2)}%.`;

  return result({
    metrics,
    inputSummary: [
      { label: "방식", value: phase === "1" ? "단상" : "3상" },
      { label: "전류", value: `${roundTo(I, precision)} A` },
      { label: "계산 구간", value: `${roundTo(L, precision)} m` },
      { label: "KEC 경로", value: kecReview ? `${roundTo(pathM, precision)} m` : "미적용" },
      { label: "전압강하율 기준전압", value: `${roundTo(V, precision)} V` },
      { label: "KEC 검토", value: kecReview ? "켬" : "끔" },
    ],
    interpretation: `${phase === "1" ? "단상" : "3상"} 저항 근사 전압강하는 ${roundTo(dV, precision)} V (${roundTo(pct, precision)}%)입니다. ${kecNote}`,
    warnings,
    followUps: [
      followUp("전체 공급경로의 전압강하를 검토하시나요?", "/tools/electrical/path-voltage-drop", {
        phase,
        current: input.current,
        voltage: input.voltage,
        length: input.length,
        rMode: input.rMode,
        resistance: input.resistance,
        material: input.material,
        area: input.area,
        kecReview: input.kecReview,
        kecScope: input.kecScope,
        kecSupply: input.kecSupply,
        kecLoad: input.kecLoad,
      }),
    ],
    formulaUsed: voltageDropFormula(vdPhase),
    steps: [
      `L = ${roundTo(lengthKm, 5)} km, r = ${roundTo(rOhmKm, 4)} Ω/km`,
      phase === "1"
        ? `ΔV = 2 × ${roundTo(I, precision)} × ${roundTo(lengthKm, 5)} × ${roundTo(rOhmKm, 4)} = ${roundTo(dV, precision)} V`
        : `ΔV = √3 × ${roundTo(I, precision)} × ${roundTo(lengthKm, 5)} × ${roundTo(rOhmKm, 4)} = ${roundTo(dV, precision)} V`,
      `% = ${roundTo(dV, precision)} / ${roundTo(V, 2)} × 100 = ${roundTo(pct, precision)}%`,
      `V_end = ${roundTo(V, 2)} − ${roundTo(dV, precision)} = ${roundTo(vend, precision)} V`,
      kecMode === "review"
        ? pathMatchesSegment
          ? `경로=구간 ${roundTo(pathM, 1)} m, 전체 경로 허용 참고 = ${roundTo(kecBase, 2)} + ${roundTo(kecExtra, 3)} = ${roundTo(kecLimit, 2)}%`
          : `구간 ${roundTo(L, 1)} m ≠ 경로 ${roundTo(pathM, 1)} m — 허용 참고 ${roundTo(kecLimit, 2)}%만 표시, 비교 안 함`
        : kecMode === "mixed"
          ? "혼합부하 — 표 숫자 자동 선택 없음"
          : "KEC 표 비교 생략",
    ],
    reviewStatus:
      kecMode === "review"
        ? pathMatchesSegment
          ? pct <= kecLimit + 1e-9
            ? review("in-range", `전체 경로 허용 참고 ${roundTo(kecLimit, 2)}% 이하입니다. 적합 판정이 아닙니다.`)
            : review("caution", `전체 경로 허용 참고 ${roundTo(kecLimit, 2)}%를 넘습니다. 부적합 판정이 아닙니다.`)
          : review("check", "구간 전압강하와 전체 경로 허용 참고값은 비교하지 않습니다. 경로 합산 후 확인하세요.")
        : kecMode === "mixed"
          ? review("check", KEC_VOLTAGE_DROP_MIXED)
        : kecMode === "out-of-scope"
          ? review("check", "KEC 232.3.9 적용 대상이 아닙니다.")
        : allow > 0
          ? pct <= allow
            ? review("in-range", `사용자 허용 ${allow}% 이하입니다. 규정 합격 판정이 아닙니다.`)
            : review("caution", `사용자 허용 ${allow}%를 초과합니다.`)
          : review("check", "허용 전압강하율은 프로젝트 기준을 확인하세요."),
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
  return calculateBreakerExtended(input, precision);
}

export function calculateUpsBackup(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  const mode = input.mode ?? "battery";
  let energyWh = 0;
  let P = 0;
  let eta = 0.92;
  let dod = 0.8;
  let aging = 1;

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
    aging = optionalNum(input, "aging", 1);
    if (aging <= 0 || aging > 1) fieldErrors.aging = "노화 보정은 0 초과 1 이하여야 합니다.";
  } catch (error) {
    fieldErrors.aging = error instanceof Error ? error.message : "노화 보정을 확인하세요.";
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

  const usable = energyWh * eta * dod * aging;
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
    formulaUsed: "t = (V × C × η × DOD × k_aging) / P",
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
  const eta = optionalNum(input, "efficiency", 0.92);
  const dcV = optionalNum(input, "dcV", 0);
  const hours = optionalNum(input, "hours", 0);
  const cellV = optionalNum(input, "cellV", 0);
  const moduleAh = optionalNum(input, "moduleAh", 0);
  const dod = optionalNum(input, "dod", 0.8);
  const aging = optionalNum(input, "aging", 0.8);
  const batteryDetail = (input.mode ?? "basic") === "detailed";

  const metrics = [
    metric("kva", "필요 UPS 용량", upsKva, "kVA", precision, { primary: true }),
    metric("kw", "설계 유효전력", designKw, "kW", precision),
    metric("loadkva", "부하 kVA", loadKva, "kVA", precision),
    metric("ratio", "여유 반영 부하율 참고", (kw / designKw) * 100, "%", precision),
  ];

  const steps = [
    `P_design = ${roundTo(kw, precision)} × (1+${growth}) = ${roundTo(designKw, precision)} kW`,
    `S_load = P_design / PF_load = ${roundTo(loadKva, precision)} kVA`,
    `S_ups = max(S_load, P_design / PF_ups) = ${roundTo(upsKva, precision)} kVA`,
  ];

  if (batteryDetail && dcV > 0 && hours > 0 && eta > 0 && eta <= 1) {
    const pW = designKw * 1000;
    const eWh = (pW * hours) / (eta * dod * aging);
    const ah = eWh / dcV;
    metrics.push(metric("dc", "DC 전압", dcV, "V", precision));
    metrics.push(metric("ah", "필요 Ah (에너지 수지)", ah, "Ah", precision));
    metrics.push(metric("e", "필요 배터리 에너지", eWh / 1000, "kWh", precision));
    metrics.push(
      metric("tgoal", "목표 백업시간 (에너지 수지)", hours, "h", precision, {
        hint: "입력한 목표시간입니다. 제조사 방전곡선으로 구한 Backup Time이 아닙니다.",
      }),
    );
    steps.push(`E = P t / (η DOD k_age) = ${roundTo(eWh / 1000, precision)} kWh`);
    steps.push(`Ah = E / V_dc = ${roundTo(ah, precision)} Ah — 제조사 방전곡선이 아님`);
    if (cellV > 0) {
      const ns = Math.ceil(dcV / cellV - 1e-9);
      metrics.push(metric("series", "직렬 개수 참고", ns, "셀", 0));
      if (moduleAh > 0) {
        const np = Math.ceil(ah / moduleAh - 1e-9);
        metrics.push(metric("parallel", "병렬 String 참고", np, "회", 0));
        metrics.push(metric("battn", "총 배터리 수 참고", ns * np, "개", 0));
      }
    }
  }

  return result({
    metrics,
    inputSummary: [
      { label: "현재 부하", value: `${roundTo(kw, precision)} kW` },
      { label: "성장·여유", value: `${roundTo(growth * 100, 0)}%` },
      { label: "부하 역률", value: String(roundTo(pf, 3)) },
    ],
    interpretation: `여유를 반영한 필요 용량은 약 ${roundTo(upsKva, precision)} kVA입니다. 배터리 Ah는 에너지 수지이며 정밀 Backup Time이 아닙니다.`,
    warnings: [
      warning("info", "모듈 대수", "모듈형 UPS는 프레임 용량과 모듈 정격을 각각 확인하세요."),
      warning("info", "배터리", "상세 조건의 Ah는 일정 전력 가정입니다. 제조사 런타임 표를 정밀 계산으로 쓰세요."),
    ],
    formulaUsed: "S = max(P_design / PF_load, P_design / PF_ups),  C = P t / (V η DOD k_age)",
    steps,
    reviewStatus: review("check", "UPS kVA는 부하·여유 산정입니다. 배터리 런타임은 명판 곡선이 우선입니다."),
    nextChecks: ["고조파·투입 돌입", "N+1 모듈", "제조사 방전곡선"],
    followUps: [
      followUp("배터리 Ah 상세", "/tools/facility/battery-capacity", {
        loadW: roundTo(designKw * 1000, 4),
        dcV: dcV > 0 ? dcV : 384,
        hours: hours > 0 ? hours : 0.25,
      }),
      followUp("백업시간 에너지 수지", "/tools/facility/ups-backup-time", {
        load: roundTo(designKw, 4),
        loadUnit: "kW",
      }),
    ],
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
    followUps: [
      followUp("발전기 로드테스트", "/tools/facility/generator-load-test", { ratedKw: roundTo(ratedKw, 4), loadKw: roundTo(loadKw, 4) }),
    ],
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
  "breaker-current": calculateBreakerExtended,
  "ups-backup-time": calculateUpsBackup,
  "ups-capacity": calculateUpsCapacity,
  "generator-load": calculateGeneratorLoad,
  "monthly-energy": calculateMonthlyEnergy,
  "motor-current": calculateMotorCurrent,
  "motor-starting": calculateMotorStartingReview,
  "motor-start-vd": calculateMotorStartVoltageDrop,
  "motor-acceleration": calculateMotorAcceleration,
  "power-factor-correction": calculatePowerFactorCorrection,
  "power-triangle": calculatePowerTriangle,
  "thd": calculateThd,
  "harmonic-filter": calculateHarmonicFilterReview,
  "cable-sizing": calculateCableSizing,
  "cable-parallel": calculateCableParallel,
  "cable-ampacity": calculateCableAmpacityReview,
  "busbar": calculateBusbar,
  "transformer-sizing": calculateTransformerSizing,
  "transformer-current": calculateTransformerCurrents,
  "transformer-parallel": calculateTransformerParallel,
  "transformer-loss": calculateTransformerLoss,
  "short-circuit": calculateShortCircuit,
  "ct-ratio": calculateCtRatio,
  "pt-ratio": calculatePtRatio,
  "vfd-sizing": calculateVfdSizing,
  "soft-starter": calculateSoftStarter,
  "protection-relay": calculateRelayIec,
  "lux": calculateLux,
  "lighting-density": calculateLightingPowerDensity,
  "solar-pv": calculateSolarPv,
  "grounding-rod": calculateGroundingRod,
  "soil-resistivity": calculateSoilResistivity,
  "earth-conductor": calculateEarthConductor,
  "spd-helper": calculateSpdHelper,
  "generator-sizing": calculateGeneratorSizing,
  "generator-fuel": calculateGeneratorFuel,
  "generator-start-vd": calculateGenStartVoltageDrop,
  "battery-capacity": calculateBatteryAh,
  "equipment-load": calculateEquipmentUtilization,
  "energy-intensity": calculateEnergyIntensity,
  "energy-cost": calculateEstimatedEnergyCost,
  "pm-interval": calculatePmInterval,
  "yoy-energy": calculateYoyEnergy,
  "field-compare": calculateFieldCompare,
  "phase-unbalance": calculatePhaseUnbalance,
  "generator-load-test": calculateGeneratorLoadTest,
  "duty-cycle": calculateDutyCycle,
  "sensor-calibration": calculateSensorCalibration,
  "retrofit-compare": calculateRetrofitCompare,
};
