import { SQRT_3 } from "@/lib/math/units";
import { FieldBag, metric, ok, review, roundTo, warning, type CalcInput } from "@/lib/calculations/parse";
import { followUp } from "@/lib/calculations/handoff";
import type { CalculationOutcome } from "@/lib/types";
import { calculateOperatingEnergy } from "@/lib/calculations/field-verify";

export function calculateGeneratorSizing(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const detailed = (input.mode ?? "basic") === "detailed";
  const pStatic = fields.optional("staticKw", 0, "일반부하 kW");
  const pMotor = fields.optional("motorKw", 0, "모터 축출력 kW");
  const pUps = fields.optional("upsKw", 0, "UPS kW");
  const pNonlin = detailed ? fields.optional("nonlinKw", 0, "기타 비선형 kW") : 0;
  const pf = fields.optional("pf", 0.8, "역률");
  const demand = detailed ? fields.optional("demand", 1, "수용률") : 1;
  const diversity = detailed ? fields.optional("diversity", 0.9, "동시사용률") : 1;
  const margin = detailed ? fields.optional("margin", 0.15, "여유율") : 0;
  const startK = detailed ? fields.optional("motorStartK", 3, "모터 기동 환산계수") : fields.optional("motorStartK", 3, "모터 기동 환산계수");
  const largest = detailed ? fields.optional("largestMotorKw", 0, "최대 모터 kW") : 0;
  const rated = fields.optional("ratedKw", 0, "보유 발전기 kW");
  const startMethod = input.startMethod ?? "dol";
  fields.requireUnitInterval("pf", "역률", pf);
  fields.requirePositive("diversity", "동시사용률", diversity);
  if (diversity > 1) fields.errors.diversity = "동시사용률은 1 이하가 일반적입니다.";
  if (demand <= 0 || demand > 1) fields.errors.demand = "수용률은 0 초과 1 이하여야 합니다.";
  fields.requireNonNegative("margin", "여유", margin);
  fields.requireNonNegative("staticKw", "일반부하", pStatic);
  fields.requireNonNegative("motorKw", "모터", pMotor);
  fields.requirePositive("motorStartK", "기동계수", startK);
  if (pStatic + pMotor + pUps + pNonlin <= 0) {
    return fields.fail("일반·모터·UPS·비선형 부하 중 하나 이상을 입력하세요.");
  }
  if (fields.failed()) return fields.fail();

  const connected = pStatic + pMotor + pUps + pNonlin;
  const pRun = connected * demand * diversity;
  const startBase = largest > 0 ? largest : pMotor;
  const pStartExtra = startBase * Math.max(startK - 1, 0) * demand * diversity;
  const pNeed = (pRun + pStartExtra) * (1 + margin);
  const sRun = pRun / pf;
  const sNeed = pNeed / pf;
  const ratio = rated > 0 ? (pRun / rated) * 100 : 0;
  const residual = rated > 0 ? rated - pNeed : 0;

  const methodLabel =
    startMethod === "yd" ? "Y-Δ" : startMethod === "soft" ? "소프트스타터" : startMethod === "vfd" ? "VFD" : "DOL";

  const metrics = [
    metric("prun", "Running Load", pRun, "kW", precision, { primary: true }),
    metric("srun", "Running kVA", sRun, "kVA", precision),
    metric("pstart", "Motor Starting 영향", pStartExtra, "kW", precision, {
      hint: "최대 모터(없으면 모터 합) × (기동배수−1) × 수용률 × 동시사용률. 제조사 기동 kVA가 아닙니다.",
    }),
    metric("pk", "검토 발전기 용량", pNeed, "kW", precision),
    metric("s", "검토 발전기 kVA", sNeed, "kVA", precision),
  ];
  if (rated > 0) {
    metrics.push(metric("ratio", "예상 부하율(운전)", ratio, "%", precision));
    metrics.push(metric("res", "잔여 여유용량(검토용량 대비)", residual, "kW", precision));
  }

  return ok({
    metrics,
    inputSummary: [
      { label: "모드", value: detailed ? "상세 계산" : "기본 계산" },
      { label: "구성", value: `일반 ${pStatic} + 모터 ${pMotor} + UPS ${pUps} + 비선형 ${pNonlin} kW` },
      { label: "기동", value: `${methodLabel}, 배수 ${startK} (사용자)` },
    ],
    interpretation: `운전부하 ${roundTo(pRun, precision)} kW / ${roundTo(sRun, precision)} kVA. 기동을 더한 검토 용량은 ${roundTo(pNeed, precision)} kW / ${roundTo(sNeed, precision)} kVA입니다.`,
    warnings: [
      warning("warning", "기동 kVA", "실제 발전기는 모터 기동 kVA와 전압강하 한도로 커질 수 있습니다. 제조사 기동 곡선을 확인하세요."),
      warning("info", "기동방식", `${methodLabel}은 기록입니다. 배수는 사용자가 넣은 값이며 방식별 표준 배수를 내장하지 않습니다.`),
      warning("info", "UPS", "UPS 입력 고조파·충전 전류는 별도 가산이 필요할 수 있습니다."),
    ],
    formulaUsed: "P_run = ΣP × 수용률 × 동시사용률,  P_need = (P_run + P_start_extra) × (1+여유),  S = P / PF",
    steps: [
      `연결 = ${roundTo(connected, precision)} kW`,
      `P_run = ${roundTo(connected, precision)} × ${demand} × ${diversity} = ${roundTo(pRun, precision)} kW`,
      `S_run = ${roundTo(pRun, precision)} / ${pf} = ${roundTo(sRun, precision)} kVA`,
      `기동 가산 = ${roundTo(startBase, precision)} × (${startK}−1) × ${demand} × ${diversity} = ${roundTo(pStartExtra, precision)} kW`,
      `P_need = (${roundTo(pRun, precision)} + ${roundTo(pStartExtra, precision)}) × ${1 + margin} = ${roundTo(pNeed, precision)} kW`,
    ],
    reviewStatus: review("check", "부하 합산 검토입니다. 발전기 명판·기동 내량을 확인하세요."),
    nextChecks: ["제조사 기동 전압강하 곡선", "UPS 입력 THDi·충전", "스탠바이/프라임 정격 구분"],
    followUps: [
      followUp("기동 전압강하 검토", "/tools/facility/generator-start-vd", {
        motorKva: roundTo(startBase / pf, 4),
      }),
      followUp("이 부하로 전선 굵기 계산", "/tools/electrical/cable-sizing", {
        power: roundTo(pRun, 4),
        pf,
      }),
      followUp("발전기 로드테스트", "/tools/facility/generator-load-test", {
        ratedKw: roundTo(pNeed, 4),
      }),
    ],
  });
}

export function calculateGeneratorFuel(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const mode = input.mode ?? "estimate";
  const loadKw = fields.num("loadKw", "부하 kW");
  const hours = fields.num("hours", "운전시간 h");
  fields.requirePositive("loadKw", "부하", loadKw);
  fields.requirePositive("hours", "시간", hours);
  if (fields.failed()) return fields.fail();

  let lph = 0;
  if (mode === "datasheet") {
    lph = fields.num("lPerHour", "제조사 L/h");
    fields.requirePositive("lPerHour", "연료소비", lph);
    if (fields.failed()) return fields.fail();
  } else {
    const spec = fields.optional("litersPerKwh", 0.28, "추정 L/kWh");
    fields.requirePositive("litersPerKwh", "원단위", spec);
    if (fields.failed()) return fields.fail();
    lph = spec * loadKw;
  }

  const total = lph * hours;
  return ok({
    metrics: [
      metric("total", "추정 연료량", total, "L", precision, { primary: true }),
      metric("lph", "시간당", lph, "L/h", precision),
    ],
    inputSummary: [
      { label: "모드", value: mode === "datasheet" ? "제조사 데이터" : "일반 추정" },
      { label: "부하·시간", value: `${loadKw} kW × ${hours} h` },
    ],
    interpretation:
      mode === "datasheet"
        ? `제조사 L/h를 시간에 곱한 ${roundTo(total, precision)} L입니다.`
        : `사용자 원단위 L/kWh 추정으로 ${roundTo(total, precision)} L입니다. 기종별 차이가 큽니다.`,
    warnings: [
      warning("warning", "기종 편차", "연료소비는 부하율·온도·정비 상태에 따라 크게 달라집니다. 일반 추정과 명판 데이터를 구분하세요."),
    ],
    formulaUsed: mode === "datasheet" ? "V = (L/h) × t" : "V = (L/kWh) × P × t",
    steps: [`L/h = ${roundTo(lph, precision)}`, `총량 = ${roundTo(lph, precision)} × ${hours} = ${roundTo(total, precision)} L`],
    reviewStatus: review("check", "연료 추정입니다. 탱크 용량·누유 여유를 별도로 보세요."),
  });
}

export function calculateBatteryAh(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const p = fields.num("loadW", "부하 W");
  const v = fields.num("dcV", "DC 전압");
  const hours = fields.num("hours", "백업시간 h");
  const etaInv = fields.optional("etaInv", 0.9, "인버터 효율");
  const etaBatt = fields.optional("etaBatt", 0.9, "배터리 효율");
  const aging = fields.optional("aging", 0.8, "노화 보정");
  const dod = fields.optional("dod", 0.8, "DOD");
  fields.requirePositive("loadW", "부하", p);
  fields.requirePositive("dcV", "전압", v);
  fields.requirePositive("hours", "시간", hours);
  fields.requireUnitInterval("etaInv", "인버터 효율", etaInv);
  fields.requireUnitInterval("etaBatt", "배터리 효율", etaBatt);
  fields.requireUnitInterval("aging", "노화", aging);
  fields.requireUnitInterval("dod", "DOD", dod);
  if (fields.failed()) return fields.fail();

  const e = (p * hours) / (etaInv * etaBatt * aging * dod);
  const ah = e / v;
  const seriesHint = fields.optional("cellV", 0, "셀 전압");
  const moduleAh = fields.optional("moduleAh", 0, "모듈 Ah");
  const metrics = [
    metric("ah", "필요 Ah", ah, "Ah", precision, { primary: true }),
    metric("e", "필요 배터리 에너지", e / 1000, "kWh", precision),
    metric("t", "목표 백업(에너지 수지)", hours, "h", precision),
  ];
  if (seriesHint > 0) {
    const ns = Math.ceil(v / seriesHint - 1e-9);
    metrics.push(metric("series", "직렬 개수 참고", ns, "셀", 0));
    if (moduleAh > 0) {
      const np = Math.ceil(ah / moduleAh - 1e-9);
      metrics.push(metric("parallel", "병렬 String 참고", np, "회", 0));
      metrics.push(metric("total", "총 배터리 수 참고", ns * np, "개", 0));
    }
  }

  return ok({
    metrics,
    inputSummary: [
      { label: "부하", value: `${p} W @ ${v} V` },
      { label: "보정", value: `ηinv ${etaInv}, ηb ${etaBatt}, 노화 ${aging}, DOD ${dod}` },
    ],
    interpretation: `필요 에너지 ${roundTo(e / 1000, precision)} kWh, ${roundTo(ah, precision)} Ah (@${v} V). 에너지 수지이며 제조사 방전곡선이 아닙니다.`,
    warnings: [
      warning("info", "Peukert 미반영", "고율 방전 시 필요 Ah가 더 커집니다. 정밀 Backup Time처럼 쓰지 마세요."),
      warning("info", "직·병렬", "직렬 = 공칭전압 / 셀전압, 병렬 = 필요 Ah / 모듈 Ah."),
    ],
    formulaUsed: "E = P t / (η_inv η_batt k_aging DOD),  C = E / V",
    steps: [
      `E = ${p} × ${hours} / (${etaInv} × ${etaBatt} × ${aging} × ${dod}) = ${roundTo(e, 1)} Wh`,
      `C = ${roundTo(e, 1)} / ${v} = ${roundTo(ah, precision)} Ah`,
    ],
    reviewStatus: review("check", "에너지 수지입니다. 제조사 런타임 표가 우선입니다."),
    nextChecks: ["제조사 방전곡선으로 런타임 재확인", "온도·고율 방전 보정"],
    followUps: [
      followUp("UPS 용량과 함께 보기", "/tools/facility/ups-capacity", { loadKw: roundTo(p / 1000, 4) }),
      followUp("백업시간 에너지 수지", "/tools/facility/ups-backup-time", {
        load: roundTo(p / 1000, 4),
        loadUnit: "kW",
        batteryV: v,
        ah: roundTo(ah, 4),
      }),
    ],
  });
}

export function calculateEquipmentUtilization(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const rated = fields.num("ratedKw", "정격 kW");
  const avg = fields.num("avgKw", "평균 kW");
  const hours = fields.optional("runHours", 0, "가동시간");
  const period = fields.optional("periodHours", 730, "기간 시간");
  fields.requirePositive("ratedKw", "정격", rated);
  fields.requireNonNegative("avgKw", "평균", avg);
  if (fields.failed()) return fields.fail();
  const loadRatio = (avg / rated) * 100;
  const util = period > 0 && hours > 0 ? (hours / period) * 100 : 0;
  return ok({
    metrics: [
      metric("lf", "설비 부하율", loadRatio, "%", precision, { primary: true }),
      ...(util ? [metric("uf", "가동률", util, "%", precision)] : []),
    ],
    inputSummary: [{ label: "정격/평균", value: `${rated} / ${avg} kW` }],
    interpretation: `부하율 ${roundTo(loadRatio, precision)}%${util ? `, 가동률 ${roundTo(util, precision)}%` : ""}.`,
    warnings: [warning("info", "정의", "부하율은 평균/정격, 가동률은 운전시간/기간입니다.")],
    formulaUsed: "부하율 = P_avg / P_rated,  가동률 = t_run / t_period",
    steps: [`부하율 = ${avg}/${rated} × 100 = ${roundTo(loadRatio, precision)}%`],
    reviewStatus: review("in-range", "운영 지표입니다. 설비 이상 판정이 아닙니다."),
  });
}

export function calculateEnergyIntensity(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const kwh = fields.num("kwh", "전력량 kWh");
  const denom = fields.num("denominator", "원단위 분모");
  const unit = input.unitLabel || "단위";
  fields.requireNonNegative("kwh", "전력량", kwh);
  fields.requirePositive("denominator", "분모", denom);
  if (fields.failed()) return fields.fail();
  const v = kwh / denom;
  return ok({
    metrics: [metric("ei", "전력 원단위", v, `kWh/${unit}`, precision, { primary: true })],
    inputSummary: [{ label: "분모", value: `${denom} ${unit}` }],
    interpretation: `원단위 ${roundTo(v, precision)} kWh/${unit}.`,
    warnings: [warning("info", "비교", "생산량·면적·인원 정의가 같아야 전년 대비가 의미가 있습니다.")],
    formulaUsed: "원단위 = kWh / 활동량",
    steps: [`${kwh} / ${denom} = ${roundTo(v, precision)}`],
    reviewStatus: review("in-range", "원단위 산정입니다."),
  });
}

export function calculateEstimatedEnergyCost(input: CalcInput, precision: number): CalculationOutcome {
  if ((input.mode ?? "bill") === "operating") {
    return calculateOperatingEnergy(input, precision);
  }
  const fields = new FieldBag(input);
  const kwh = fields.num("kwh", "사용량 kWh");
  const demand = fields.optional("demandKw", 0, "최대수요");
  const energyPrice = fields.optional("energyPrice", 0, "전력량 단가");
  const demandPrice = fields.optional("demandPrice", 0, "기본요금 원/kW");
  fields.requireNonNegative("kwh", "사용량", kwh);
  if (fields.failed()) return fields.fail();
  const energy = kwh * energyPrice;
  const demandC = demand * demandPrice;
  const total = energy + demandC;
  const metrics = [metric("e", "전력량분", energy, "원", 0)];
  if (demandPrice > 0) metrics.push(metric("d", "기본요금분", demandC, "원", 0));
  if (energyPrice > 0 || demandPrice > 0) {
    metrics.unshift(metric("total", "사용량 기반 비용 추정", total, "원", 0, { primary: true }));
  } else {
    metrics.unshift(metric("kwh", "사용량", kwh, "kWh", precision, { primary: true }));
  }
  return ok({
    metrics,
    inputSummary: [{ label: "단가", value: energyPrice > 0 ? `${energyPrice} 원/kWh (사용자)` : "미입력" }],
    interpretation:
      energyPrice > 0
        ? `사용자 단가 × 사용량으로 약 ${roundTo(total, 0)} 원입니다. 한전 청구 예상액이 아닙니다.`
        : "단가가 없어 사용량만 표시합니다. 기본 요금표를 넣지 않습니다.",
    warnings: [
      warning("error", "한전 청구 아님", "기후환경요금, 연료비, 역률, 계절·시간대, 부가세를 포함하지 않습니다."),
    ],
    formulaUsed: "비용 추정 ≈ kWh × 사용자단가 + kW × 사용자 기본단가",
    steps: [
      `사용량분 = ${kwh} × ${energyPrice} = ${roundTo(energy, 0)} 원`,
      `수요분 = ${demand} × ${demandPrice} = ${roundTo(demandC, 0)} 원`,
    ],
    reviewStatus: review("check", "사용량 기반 단순 에너지 비용 추정입니다."),
    followUps: [followUp("개선 전후 비교", "/tools/facility/retrofit-compare", {})],
  });
}

export function calculatePmInterval(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const runHours = fields.num("runHours", "누적 운전 h");
  const interval = fields.num("intervalHours", "주기 h");
  fields.requireNonNegative("runHours", "누적", runHours);
  fields.requirePositive("intervalHours", "주기", interval);
  if (fields.failed()) return fields.fail();
  const due = interval - (runHours % interval);
  const over = runHours > 0 && runHours % interval < 1e-6;
  return ok({
    metrics: [
      metric("due", over ? "주기 도래" : "다음 정비까지", over ? 0 : due, "h", precision, { primary: true }),
      metric("count", "경과 주기 수", Math.floor(runHours / interval), "회", 0),
    ],
    inputSummary: [{ label: "주기", value: `${interval} h` }],
    interpretation: over ? "입력 누적시간이 주기의 배수입니다. 정비 도래로 보세요." : `다음 주기까지 약 ${roundTo(due, precision)} h.`,
    warnings: [warning("info", "계정 없음", "설비별 이력 저장은 향후 계정 기능에서 확장할 수 있습니다.")],
    formulaUsed: "remaining = interval − (t mod interval)",
    steps: [`t mod T = ${roundTo(runHours % interval, precision)}, remaining = ${roundTo(due, precision)} h`],
    reviewStatus: review("in-range", "시간 주기 참고입니다. 법정 검사와 다를 수 있습니다."),
  });
}

export function calculateYoyEnergy(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const now = fields.num("thisKwh", "올해 동월 kWh");
  const prev = fields.num("lastKwh", "전년 동월 kWh");
  const demandNow = fields.optional("thisDemand", 0, "올해 최대수요");
  const demandPrev = fields.optional("lastDemand", 0, "전년 최대수요");
  fields.requireNonNegative("thisKwh", "올해", now);
  fields.requireNonNegative("lastKwh", "전년", prev);
  if (fields.failed()) return fields.fail();
  const d = now - prev;
  const pct = prev === 0 ? (now === 0 ? 0 : Infinity) : (d / prev) * 100;
  return ok({
    metrics: [
      metric("d", "사용량 차이", d, "kWh", precision, { primary: true }),
      metric("pct", "전년 동월 대비", Number.isFinite(pct) ? pct : 0, "%", precision),
      metric("dd", "최대수요 차이", demandNow - demandPrev, "kW", precision),
    ],
    inputSummary: [
      { label: "올해", value: `${now} kWh` },
      { label: "전년", value: `${prev} kWh` },
    ],
    interpretation: Number.isFinite(pct)
      ? `전년 동월 대비 ${d >= 0 ? "증가" : "감소"} ${roundTo(Math.abs(pct), precision)}%입니다.`
      : "전년 사용량이 0이라 비율을 정의할 수 없습니다.",
    warnings: [warning("info", "일수", "월 일수가 다르면 일수 보정 비교 도구를 함께 쓰세요.")],
    formulaUsed: "Δ = E_this − E_last,  % = Δ / E_last × 100",
    steps: [`Δ = ${now} − ${prev} = ${roundTo(d, precision)} kWh`],
    reviewStatus: review("in-range", "운영 비교입니다."),
  });
}

export function calculateGenStartVoltageDrop(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const sGen = fields.num("genKva", "발전기 kVA");
  const xd = fields.optional("xd", 0.2, "x'd 또는 사용자 pu");
  const sMotor = fields.num("motorKva", "기동 피상전력 kVA");
  fields.requirePositive("genKva", "발전기", sGen);
  fields.requirePositive("xd", "리액턴스", xd);
  fields.requirePositive("motorKva", "모터", sMotor);
  if (fields.failed()) return fields.fail();
  // 단순: ΔV/V ≈ (X d × S_motor / S_gen) 근사 (무부하 발전기 + 순수 리액턴스)
  const dv = xd * (sMotor / sGen) * 100;
  return ok({
    metrics: [metric("dv", "기동 시 전압강하 추정", dv, "%", precision, { primary: true })],
    inputSummary: [{ label: "Sgen / Smotor", value: `${sGen} / ${sMotor} kVA` }],
    interpretation: `ΔV/V ≈ x × (S_motor / S_gen) = ${roundTo(dv, precision)}%. 제조사 기동 전압강하 곡선이 우선입니다.`,
    warnings: [
      warning("warning", "단순 리액턴스 모델", "AVR, 서브트랜션트, 케이블을 무시합니다."),
    ],
    formulaUsed: "ΔV/V ≈ X_pu × S_start / S_gen",
    steps: [`${xd} × ${sMotor} / ${sGen} × 100 = ${roundTo(dv, precision)}%`],
    reviewStatus: review("check", "간이 추정입니다. 허용 전압강하와 비교하려면 제조사 데이터를 쓰세요."),
  });
}

export function threePhaseCurrentA(kva: number, volts: number): number {
  if (volts <= 0) return 0;
  return (kva * 1000) / (SQRT_3 * volts);
}
