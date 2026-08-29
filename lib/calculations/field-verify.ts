import { SQRT_3 } from "@/lib/math/units";
import { FieldBag, metric, ok, review, roundTo, warning, type CalcInput } from "@/lib/calculations/parse";
import { followUp } from "@/lib/calculations/handoff";
import type { CalculationOutcome } from "@/lib/types";

function threePhaseKva(volts: number, amps: number, phase: string): number {
  return phase === "1" ? (volts * amps) / 1000 : (SQRT_3 * volts * amps) / 1000;
}

function sampleStdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const varSum = values.reduce((a, b) => a + (b - mean) ** 2, 0);
  return Math.sqrt(varSum / (values.length - 1));
}

/** 설계값과 실측값 비교. 허용편차는 사용자 입력만 사용합니다. */
export function calculateFieldCompare(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const design = fields.num("designValue", "설계값");
  const measured = fields.num("measuredValue", "실측값");
  const mode = input.toleranceMode ?? "percent";
  const unit = input.unit || "";
  const item = (input.itemName ?? "").trim() || "측정 항목";
  if (!Number.isFinite(design)) fields.errors.designValue = "설계값을 확인하세요.";
  if (!Number.isFinite(measured)) fields.errors.measuredValue = "실측값을 확인하세요.";

  let lo = NaN;
  let hi = NaN;
  let tolLabel = "";
  if (mode === "absolute") {
    const absTol = fields.num("toleranceAbs", "절대 허용편차");
    if (!(absTol >= 0)) fields.errors.toleranceAbs = "절대 허용편차는 0 이상이어야 합니다.";
    lo = design - absTol;
    hi = design + absTol;
    tolLabel = `±${roundTo(absTol, precision)} ${unit}`.trim();
  } else {
    const tol = fields.num("tolerancePct", "상대 허용편차 %");
    if (!(tol >= 0)) fields.errors.tolerancePct = "상대 허용편차 %는 0 이상이어야 합니다.";
    lo = design * (1 - tol / 100);
    hi = design * (1 + tol / 100);
    tolLabel = `±${roundTo(tol, precision)} %`;
  }
  if (fields.failed()) return fields.fail();

  const absDev = measured - design;
  const pctOfDesign = design === 0 ? NaN : (measured / design) * 100;
  const devPct = design === 0 ? NaN : (absDev / design) * 100;
  const inside = measured >= lo && measured <= hi;

  return ok({
    metrics: [
      metric("pct", "설계값 대비 실측", Number.isFinite(pctOfDesign) ? pctOfDesign : 0, "%", precision, {
        primary: true,
        hint: design === 0 ? "설계값이 0이면 비율을 정의하지 않습니다." : undefined,
      }),
      metric("dev", "절대 편차", absDev, unit, precision),
      metric("devpct", "편차", Number.isFinite(devPct) ? devPct : 0, "%", precision),
      metric("lo", "허용 범위 하한", lo, unit, precision),
      metric("hi", "허용 범위 상한", hi, unit, precision),
    ],
    inputSummary: [
      { label: "항목", value: item },
      { label: "설계값", value: `${roundTo(design, precision)} ${unit}` },
      { label: "실측값", value: `${roundTo(measured, precision)} ${unit}` },
      { label: "사용자 허용편차", value: `${mode === "absolute" ? "절대" : "상대"} ${tolLabel}` },
    ],
    interpretation: Number.isFinite(pctOfDesign)
      ? `${item} 실측은 설계값의 ${roundTo(pctOfDesign, precision)}%입니다. 편차 ${roundTo(devPct, precision)}%. 사용자가 넣은 ${tolLabel} 범위 ${inside ? "안" : "밖"}입니다.`
      : "설계값이 0이라 비율 편차를 계산하지 않았습니다.",
    warnings: [
      warning("info", "허용기준", "허용편차는 Ampory가 정한 값이 아닙니다. 시방서·제조사 공차를 직접 넣으세요."),
      warning("info", "판정 아님", "범위 안/밖은 사용자 입력 공차와의 산술 비교입니다. 시험 합격이 아닙니다."),
    ],
    formulaUsed:
      mode === "absolute"
        ? "편차 = 실측 − 설계,  하한·상한 = 설계 ± 절대공차"
        : "편차 = 실측 − 설계,  편차% = 편차/설계 × 100,  하한·상한 = 설계 × (1 ± 허용%/100)",
    steps: [
      `절대 편차 = ${roundTo(measured, precision)} − ${roundTo(design, precision)} = ${roundTo(absDev, precision)} ${unit}`,
      Number.isFinite(devPct)
        ? `편차% = ${roundTo(absDev, precision)} / ${roundTo(design, precision)} × 100 = ${roundTo(devPct, precision)} %`
        : "설계값 0 — 편차% 생략",
      `허용 구간 = [${roundTo(lo, precision)}, ${roundTo(hi, precision)}] ${unit}`,
    ],
    reviewStatus: review("check", "사용자 공차와 비교한 산술 결과입니다. 시험 성적서가 아닙니다."),
    assumptionsUsed: ["설계값과 실측값은 같은 단위·같은 운전 조건이라고 가정합니다."],
    nextChecks: ["시방서 허용오차", "계측 불확도", "운전 조건이 설계점과 같은지"],
    followUps: [followUp("3상 불평형 실측", "/tools/facility/phase-unbalance", {})],
  });
}

export type Phasor = { magnitude: number; angleDeg: number };

export type VufResult = {
  positiveSequence: number;
  negativeSequence: number;
  vufPercent: number;
};

type Complex = { re: number; im: number };

function toRect(p: Phasor): Complex {
  const rad = (p.angleDeg * Math.PI) / 180;
  return { re: p.magnitude * Math.cos(rad), im: p.magnitude * Math.sin(rad) };
}

function mul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function add3(a: Complex, b: Complex, c: Complex): Complex {
  return { re: a.re + b.re + c.re, im: a.im + b.im + c.im };
}

function mag(z: Complex): number {
  return Math.hypot(z.re, z.im);
}

const A_OP: Complex = { re: -0.5, im: Math.sqrt(3) / 2 };
const A2_OP: Complex = { re: -0.5, im: -Math.sqrt(3) / 2 };

/** Fortescue 상전압 phasor 대칭분. 위상을 임의로 넣지 않습니다. */
export function calculateVUF(va: Phasor, vb: Phasor, vc: Phasor): VufResult {
  const Va = toRect(va);
  const Vb = toRect(vb);
  const Vc = toRect(vc);
  const v1 = add3(Va, mul(A_OP, Vb), mul(A2_OP, Vc));
  const v2 = add3(Va, mul(A2_OP, Vb), mul(A_OP, Vc));
  const positiveSequence = mag(v1) / 3;
  const negativeSequence = mag(v2) / 3;
  const vufPercent = positiveSequence === 0 ? NaN : (negativeSequence / positiveSequence) * 100;
  return { positiveSequence, negativeSequence, vufPercent };
}

function hasAngle(input: CalcInput, id: string): boolean {
  return (input[id] ?? "").trim() !== "";
}

function calculateFortescueVuf(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const vaM = fields.num("vaMag", "Va 크기");
  const vbM = fields.num("vbMag", "Vb 크기");
  const vcM = fields.num("vcMag", "Vc 크기");
  fields.requirePositive("vaMag", "Va 크기", vaM);
  fields.requirePositive("vbMag", "Vb 크기", vbM);
  fields.requirePositive("vcMag", "Vc 크기", vcM);
  const missingAngle = !hasAngle(input, "vaAng") || !hasAngle(input, "vbAng") || !hasAngle(input, "vcAng");
  if (missingAngle) {
    fields.errors.vaAng = "정확한 대칭분 VUF 계산에는 위상정보가 필요합니다.";
    return fields.fail("RMS 크기만으로는 Fortescue VUF를 계산하지 않습니다. ±120°를 자동으로 넣지 않습니다.");
  }
  const vaA = fields.num("vaAng", "Va 위상");
  const vbA = fields.num("vbAng", "Vb 위상");
  const vcA = fields.num("vcAng", "Vc 위상");
  if (fields.failed()) return fields.fail();

  const out = calculateVUF(
    { magnitude: vaM, angleDeg: vaA },
    { magnitude: vbM, angleDeg: vbA },
    { magnitude: vcM, angleDeg: vcA },
  );
  if (!Number.isFinite(out.vufPercent)) {
    return fields.fail("정상분 |V1|이 0이라 VUF를 정의하지 않습니다.");
  }

  return ok({
    metrics: [
      metric("vuf", "VUF |V2|/|V1|", out.vufPercent, "%", precision, { primary: true }),
      metric("v1", "정상분 |V1|", out.positiveSequence, "V", precision),
      metric("v2", "역상분 |V2|", out.negativeSequence, "V", precision),
    ],
    inputSummary: [
      { label: "Va", value: `${vaM} ∠ ${vaA}°` },
      { label: "Vb", value: `${vbM} ∠ ${vbA}°` },
      { label: "Vc", value: `${vcM} ∠ ${vcA}°` },
    ],
    interpretation: `대칭분 VUF ${roundTo(out.vufPercent, precision)}%입니다. 선간 RMS 평균편차 방식과 같은 값이 아닙니다.`,
    warnings: [
      warning("info", "위상 필수", "정확한 대칭분 VUF 계산에는 위상정보가 필요합니다. 크기만으로 ±120°를 가정하지 않습니다."),
      warning("info", "판정 없음", "한전·IEC 허용치를 내장하지 않습니다."),
    ],
    formulaUsed: "a=e^{j120°},  V1=(Va+a Vb+a² Vc)/3,  V2=(Va+a² Vb+a Vc)/3,  VUF=|V2|/|V1|×100",
    steps: [
      `|V1| = ${roundTo(out.positiveSequence, precision)} V`,
      `|V2| = ${roundTo(out.negativeSequence, precision)} V`,
      `VUF = ${roundTo(out.negativeSequence, precision)} / ${roundTo(out.positiveSequence, precision)} × 100 = ${roundTo(out.vufPercent, precision)} %`,
    ],
    reviewStatus: review("check", "상전압 phasor 대칭분입니다. 합격 판정이 아닙니다."),
    assumptionsUsed: ["입력은 같은 시점의 상전압 phasor입니다. 선간 RMS 3개만으로는 이 식을 쓰지 않습니다."],
    nextChecks: ["측정기가 상전압 위상각을 제공하는지", "적용 한도 문서"],
    followUps: [followUp("평균편차 방식", "/tools/facility/phase-unbalance", { unbalanceMethod: "avg-dev" })],
  });
}

/** 평균편차 방식 전압 불평형. IEC 대칭분 VUF와 분리. 자동 합격 판정 없음. */
export function calculatePhaseUnbalance(input: CalcInput, precision: number): CalculationOutcome {
  const method = input.unbalanceMethod ?? "avg-dev";
  if (method === "vuf") {
    return calculateFortescueVuf(input, precision);
  }

  const fields = new FieldBag(input);
  const vab = fields.num("vr", "Vab");
  const vbc = fields.num("vs", "Vbc");
  const vca = fields.num("vt", "Vca");
  const ir = fields.optional("ir", 0, "R 전류");
  const is_ = fields.optional("is", 0, "S 전류");
  const it = fields.optional("it", 0, "T 전류");
  const tol = fields.optional("tolerancePct", 0, "사용자 허용 %");
  fields.requirePositive("vr", "Vab", vab);
  fields.requirePositive("vs", "Vbc", vbc);
  fields.requirePositive("vt", "Vca", vca);
  if (ir < 0) fields.errors.ir = "전류는 0 이상이어야 합니다.";
  if (is_ < 0) fields.errors.is = "전류는 0 이상이어야 합니다.";
  if (it < 0) fields.errors.it = "전류는 0 이상이어야 합니다.";
  if (tol < 0) fields.errors.tolerancePct = "허용 %는 0 이상이어야 합니다.";
  if (fields.failed()) return fields.fail();

  const vAvg = (vab + vbc + vca) / 3;
  const vMaxDev = Math.max(Math.abs(vab - vAvg), Math.abs(vbc - vAvg), Math.abs(vca - vAvg));
  const vUnb = vAvg === 0 ? 0 : (vMaxDev / vAvg) * 100;
  const hasI = ir > 0 || is_ > 0 || it > 0;
  const iAvg = hasI ? (ir + is_ + it) / 3 : 0;
  const iMax = hasI ? Math.max(ir, is_, it) : 0;
  const iMin = hasI ? Math.min(ir, is_, it) : 0;
  const iMaxDev = hasI ? Math.max(Math.abs(ir - iAvg), Math.abs(is_ - iAvg), Math.abs(it - iAvg)) : 0;
  const iDevPct = hasI && iAvg > 0 ? (iMaxDev / iAvg) * 100 : 0;

  const metrics = [
    metric("vunb", "평균편차 방식 전압 불평형", vUnb, "%", precision, {
      primary: true,
      hint: "max|Vll−Vavg| / Vavg × 100 · 선간전압",
    }),
    metric("vavg", "평균 선간전압", vAvg, "V", precision),
    metric("vdev", "최대 전압 편차", vMaxDev, "V", precision),
    metric("vr", "Vab", vab, "V", precision),
    metric("vs", "Vbc", vbc, "V", precision),
    metric("vt", "Vca", vca, "V", precision),
  ];
  if (hasI) {
    const maxPhase = ir >= is_ && ir >= it ? "R" : is_ >= it ? "S" : "T";
    metrics.push(metric("iunb", "상전류 편차율", iDevPct, "%", precision));
    metrics.push(metric("iavg", "평균 상전류", iAvg, "A", precision));
    metrics.push(metric("imax", "최대 상전류", iMax, "A", precision));
    metrics.push(metric("imin", "최소 상전류", iMin, "A", precision));
    metrics.push({ id: "imaxPhase", label: "최대 상", value: `${maxPhase}상` });
    metrics.push(metric("idev", "최대 전류 편차", iMaxDev, "A", precision));
    metrics.push(metric("ir", "R 전류", ir, "A", precision));
    metrics.push(metric("is", "S 전류", is_, "A", precision));
    metrics.push(metric("it", "T 전류", it, "A", precision));
  }

  const notes =
    tol > 0
      ? `사용자가 넣은 참고 한도 ${roundTo(tol, 2)}%와 평균편차 방식 ${roundTo(vUnb, precision)}%를 비교하세요. 자동 합격이 아닙니다.`
      : "허용 한도는 넣지 않았습니다. 적용 문서를 확인하세요.";

  return ok({
    metrics,
    inputSummary: [
      { label: "선간전압 Vab/Vbc/Vca", value: `${vab} / ${vbc} / ${vca} V` },
      { label: "상전류 R/S/T", value: hasI ? `${ir} / ${is_} / ${it} A` : "미입력" },
      { label: "방식", value: "평균편차 방식 (IEC 대칭분 VUF 아님)" },
    ],
    interpretation: `선간 평균 ${roundTo(vAvg, precision)} V, 평균편차 방식 전압 불평형 ${roundTo(vUnb, precision)}%. ${notes}`,
    warnings: [
      warning(
        "info",
        "계산 정의",
        "선간 RMS 세 값의 산술평균 대비 최대편차 비율입니다. IEC 61000 계열의 역상분 VUF(|V2|/|V1|)와 같은 값이 아닙니다.",
      ),
      warning(
        "info",
        "KEC 부하불평형과 구분",
        "국내 자료의 3상 4선 부하 불평형률과 이 전압 지표를 같은 한도로 취급하지 마세요.",
      ),
      warning("info", "판정 없음", "한전·IEC·KEC 허용치를 내장하지 않습니다. 합격/불합격을 표시하지 않습니다."),
      warning(
        "info",
        "중성선·영상분",
        "이 계산은 상전류 편차율까지만 다룹니다. 3상 4선 중성선·영상분은 포함하지 않으며, 향후 Power Quality의 Neutral / Zero-sequence Analysis에서 다룹니다.",
      ),
    ],
    formulaUsed: "Vavg = (Vab+Vbc+Vca)/3,  평균편차 방식% = max|Vll−Vavg| / Vavg × 100",
    steps: [
      `Vavg = (${roundTo(vab, precision)}+${roundTo(vbc, precision)}+${roundTo(vca, precision)}) / 3 = ${roundTo(vAvg, precision)} V`,
      `최대 전압 편차 = ${roundTo(vMaxDev, precision)} V`,
      `평균편차 방식 = ${roundTo(vMaxDev, precision)} / ${roundTo(vAvg, precision)} × 100 = ${roundTo(vUnb, precision)} %`,
      hasI
        ? `Iavg ${roundTo(iAvg, precision)} A, Imax ${roundTo(iMax, precision)} A, 상전류 편차율 ${roundTo(iDevPct, precision)} %`
        : "전류 미입력 — 상전류 편차율 생략",
    ],
    reviewStatus: review("check", "실측 정리입니다. 기준 적합 여부는 적용 문서로 확인하세요."),
    assumptionsUsed: ["입력은 같은 시점의 선간 RMS 전압입니다. 상-중성선 전압·영상분은 다루지 않습니다."],
    nextChecks: ["선간/상전압 구분", "IEC VUF가 필요한지", "적용 한도 문서"],
    followUps: [
      followUp("변압기 실측 부하율", "/tools/electrical/transformer-load", { loadMode: "measured" }),
      followUp("IEC 대칭분 VUF (위상 필요)", "/tools/facility/phase-unbalance", { unbalanceMethod: "vuf" }),
    ],
  });
}

export function calculateGeneratorLoadTest(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const ratedKw = fields.optional("ratedKw", 0, "정격 kW");
  const ratedKva = fields.num("ratedKva", "정격 kVA");
  const v = fields.num("voltage", "선간전압");
  const i = fields.num("current", "선전류");
  const hours = fields.optional("hours", 0, "운전시간 h");
  const freq = fields.optional("frequency", 0, "주파수 Hz");
  const meterStart = fields.optional("meterStart", 0, "시작 계량 kWh");
  const meterEnd = fields.optional("meterEnd", 0, "종료 계량 kWh");
  const phase = input.phase ?? "3";
  const pfRaw = (input.pf ?? "").trim();
  const hasPf = pfRaw !== "";
  const pf = hasPf ? fields.num("pf", "역률") : NaN;
  fields.requirePositive("ratedKva", "정격 kVA", ratedKva);
  fields.requirePositive("voltage", "선간전압", v);
  fields.requirePositive("current", "선전류", i);
  if (ratedKw < 0) fields.errors.ratedKw = "정격 kW는 0 이상이어야 합니다.";
  if (hasPf) fields.requireUnitInterval("pf", "역률", pf);
  if (hours < 0) fields.errors.hours = "운전시간은 0 이상이어야 합니다.";
  if (fields.failed()) return fields.fail();

  const sMeas = threePhaseKva(v, i, phase);
  const pMeas = hasPf ? sMeas * pf : NaN;
  const kwPct = hasPf && ratedKw > 0 ? (pMeas / ratedKw) * 100 : NaN;
  const kvaPct = (sMeas / ratedKva) * 100;
  const energyMeter = meterEnd > meterStart ? meterEnd - meterStart : 0;
  const energyCalc = hasPf && hours > 0 ? pMeas * hours : 0;
  const energy = energyMeter > 0 ? energyMeter : energyCalc;

  const pointCurrents = [
    { id: "i25", label: "예시 25% 점 전류", frac: 0.25 },
    { id: "i50", label: "예시 50% 점 전류", frac: 0.5 },
    { id: "i75", label: "예시 75% 점 전류", frac: 0.75 },
    { id: "i100", label: "예시 100% 점 전류", frac: 1 },
  ];
  const extraPoints = pointCurrents
    .map((p) => ({ ...p, i: fields.optional(p.id, 0, p.label) }))
    .filter((p) => p.i > 0);

  const metrics = [
    metric("s", "실측 kVA", sMeas, "kVA", precision, { primary: !hasPf }),
    metric("kvapct", "정격 대비 kVA 부하율", kvaPct, "%", precision),
  ];
  if (hasPf) {
    metrics.unshift(metric("p", "실측 kW", pMeas, "kW", precision, { primary: true }));
    metrics.push(metric("pf", "입력 역률", pf, "—", Math.max(precision, 3)));
    if (ratedKw > 0) metrics.push(metric("kwpct", "정격 대비 kW 부하율", kwPct, "%", precision));
  }
  if (freq > 0) metrics.push(metric("hz", "기록 주파수", freq, "Hz", Math.max(precision, 2)));
  if (hours > 0) metrics.push(metric("rt", "기록 운전시간", hours, "h", precision));
  if (energyMeter > 0 || (hasPf && hours > 0)) {
    metrics.push(metric("e", energyMeter > 0 ? "시험 중 사용 Energy (계량)" : "시험 중 사용 Energy (P×t)", energy, "kWh", precision));
  }
  for (const p of extraPoints) {
    const s = threePhaseKva(v, p.i, phase);
    metrics.push(metric(p.id, `예시 ${Math.round(p.frac * 100)}% 점 실측 kVA`, s, "kVA", precision));
    metrics.push(metric(`${p.id}pct`, `예시 ${Math.round(p.frac * 100)}% 점 kVA 부하율`, (s / ratedKva) * 100, "%", precision));
  }

  return ok({
    metrics,
    inputSummary: [
      { label: "정격", value: `${ratedKw > 0 ? `${ratedKw} kW / ` : ""}${ratedKva} kVA` },
      { label: "측정", value: `${v} V (선간), ${i} A (선전류)${hasPf ? `, PF ${pf}` : ", PF 미입력"}` },
      { label: "주파수", value: freq > 0 ? `${freq} Hz` : "미기록" },
    ],
    interpretation: hasPf
      ? `실측 ${roundTo(pMeas, precision)} kW / ${roundTo(sMeas, precision)} kVA, kVA 부하율 ${roundTo(kvaPct, precision)}%.`
      : `실측 ${roundTo(sMeas, precision)} kVA, kVA 부하율 ${roundTo(kvaPct, precision)}%. 역률을 넣지 않아 kW는 계산하지 않았습니다.`,
    warnings: [
      warning("info", "시험 판정 아님", "부하율은 산술 비율입니다. 제조사·프로젝트 로드테스트 합격을 대신하지 않습니다."),
      warning(
        "info",
        "적용 범위",
        "ISO 8528 계열은 발전기 세트 시험 방법을 다룹니다. 한국 소방 비상전원·설계시방·제조사 요구는 별도 범위일 수 있습니다.",
      ),
      warning("info", "예시 시험점", "25/50/75/100% 칸은 선택 예시입니다. 법정 필수 단계가 아닙니다."),
      !hasPf
        ? warning("info", "역률", "PF를 넣지 않으면 kVA까지만 제공합니다. 저항식 로드뱅크는 PF가 1에 가까울 수 있습니다.")
        : warning("info", "역률", "입력 역률을 측정 kVA에 곱해 kW를 추정합니다. 전력계 실측 kW가 있으면 그 값을 우선하세요."),
    ],
    formulaUsed: hasPf
      ? "S = √3 V I / 1000 (3상, 선간·선전류),  P = S × PF,  부하율 = 실측/정격 × 100"
      : "S = √3 V I / 1000 (3상, 선간·선전류). PF 미입력 시 P는 계산하지 않음",
    steps: [
      phase === "1" ? `S = V I / 1000 = ${roundTo(sMeas, precision)} kVA` : `S = √3 V I / 1000 = ${roundTo(sMeas, precision)} kVA`,
      hasPf ? `P = ${roundTo(sMeas, precision)} × ${pf} = ${roundTo(pMeas, precision)} kW` : "PF 미입력 — kW 생략",
      `kVA 부하율 = ${roundTo(sMeas, precision)} / ${ratedKva} × 100 = ${roundTo(kvaPct, precision)} %`,
      energyMeter > 0
        ? `계량 차이 = ${meterEnd} − ${meterStart} = ${roundTo(energy, precision)} kWh`
        : hasPf && hours > 0
          ? `E ≈ ${roundTo(pMeas, precision)} × ${hours} = ${roundTo(energyCalc, precision)} kWh`
          : "운전시간·계량값 없음 또는 PF 없음 — Energy(P×t) 생략",
    ],
    reviewStatus: review("check", "로드테스트 실측 정리입니다. 합격 여부를 판단하지 않습니다."),
    assumptionsUsed: ["3상은 선간전압·선전류·평형 가정을 씁니다. 냉각수온·유압·배기는 계산에 넣지 않습니다."],
    nextChecks: ["명판 프라임/스탠바이", "소방·프로젝트 시험 절차", "전력계 실측 kW"],
    followUps: [
      followUp("발전기 용량 산정으로", "/tools/facility/generator-sizing", ratedKw > 0 ? { ratedKw } : {}),
      followUp("설계값과 실측 비교", "/tools/facility/field-compare", {
        designValue: roundTo(ratedKva, 4),
        measuredValue: roundTo(sMeas, 4),
        unit: "kVA",
      }),
    ],
  });
}

export function calculateDutyCycle(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const period = fields.num("periodHours", "관찰기간 h");
  const onH = fields.num("onHours", "ON 시간 h");
  const offH = fields.optional("offHours", 0, "OFF 시간 h");
  const starts = fields.optional("starts", 0, "기동횟수");
  fields.requirePositive("periodHours", "관찰기간", period);
  fields.requireNonNegative("onHours", "ON", onH);
  if (onH > period) fields.errors.onHours = "ON 시간은 관찰기간을 넘을 수 없습니다.";
  if (offH < 0) fields.errors.offHours = "OFF 시간은 0 이상이어야 합니다.";
  if (starts < 0) fields.errors.starts = "기동횟수는 0 이상이어야 합니다.";
  if (fields.failed()) return fields.fail();

  const off = offH > 0 ? offH : Math.max(period - onH, 0);
  const runtimePct = (onH / period) * 100;
  const cycleBase = onH + off;
  const onOffPct = cycleBase > 0 ? (onH / cycleBase) * 100 : 0;
  const sph = starts / period;
  const avgOn = starts > 0 ? onH / starts : 0;
  const avgOff = starts > 0 ? off / starts : 0;
  const showOnOff = offH > 0 && Math.abs(onH + off - period) > 1e-6;

  return ok({
    metrics: [
      metric("rt", "가동률 (Runtime Ratio)", runtimePct, "%", precision, { primary: true, hint: "ON / 관찰기간" }),
      metric("on", "총 운전시간", onH, "h", precision),
      metric("sph", "Starts per Hour", sph, "회/h", Math.max(precision, 3)),
      ...(starts > 0
        ? [
            metric("avon", "평균 운전시간 / 기동", avgOn, "h", Math.max(precision, 3)),
            metric("avoff", "평균 정지시간", avgOff, "h", Math.max(precision, 3)),
          ]
        : []),
      ...(showOnOff
        ? [metric("onoff", "ON 비율 (ON+OFF 기준)", onOffPct, "%", precision, { hint: "IEC 모터 Duty Type이 아닙니다." })]
        : []),
    ],
    inputSummary: [
      { label: "관찰기간", value: `${period} h` },
      { label: "ON / OFF", value: `${onH} / ${off} h` },
      { label: "기동", value: `${starts} 회` },
    ],
    interpretation: `가동률 ${roundTo(runtimePct, precision)}%, 기동 ${roundTo(sph, 3)} 회/h.`,
    warnings: [
      warning(
        "info",
        "IEC 모터 Duty와 구분",
        "이 지표는 설비 운영시간 분석용입니다. IEC 60034의 S1~S10 Duty Type과 다릅니다.",
      ),
      warning("info", "장비 비종속", "펌프·팬·압축기·AHU·칠러 공통 시간 비율입니다. 기종별 허용 기동횟수는 명판을 보세요."),
      warning("info", "OFF 미입력", "OFF를 비우면 관찰기간 − ON으로 둡니다."),
    ],
    formulaUsed: "Runtime Ratio = t_on / t_period × 100,  SPH = N / t_period,  평균 ON = t_on / N",
    steps: [
      `가동률 = ${onH} / ${period} × 100 = ${roundTo(runtimePct, precision)} %`,
      `Starts/h = ${starts} / ${period} = ${roundTo(sph, 3)}`,
      starts > 0 ? `평균 ON = ${onH} / ${starts} = ${roundTo(avgOn, 3)} h` : "기동횟수 없음 — 평균 Cycle 생략",
    ],
    reviewStatus: review("check", "운전 시간 비율입니다. 설비 이상 판정이 아닙니다."),
    assumptionsUsed: ["관찰 구간의 ON/OFF가 누락 없이 기록되었다고 가정합니다."],
    nextChecks: ["명판 시간당 최대 기동", "최소 정지 시간"],
    followUps: [followUp("설비 부하율·가동률", "/tools/facility/equipment-load", {})],
  });
}

export function calculateSensorCalibration(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const spanMin = fields.num("spanMin", "Range Min");
  const spanMax = fields.num("spanMax", "Range Max");
  fields.requireNonNegative("spanMax", "Range Max", spanMax);
  if (!(spanMax > spanMin)) fields.errors.spanMax = "Range Max는 Min보다 커야 합니다.";
  if (fields.failed()) return fields.fail();
  const span = spanMax - spanMin;

  const pts: { i: number; indicated: number; reference: number }[] = [];
  for (let n = 1; n <= 5; n++) {
    const indicated = fields.optional(`ind${n}`, NaN, `표시값 ${n}`);
    const reference = fields.optional(`ref${n}`, NaN, `기준값 ${n}`);
    if (Number.isFinite(indicated) && Number.isFinite(reference)) {
      pts.push({ i: n, indicated, reference });
    }
  }
  if (pts.length === 0) return fields.fail("표시값과 Reference를 한 점 이상 입력하세요.");

  const analyzed = pts.map((p) => {
    const signed = p.indicated - p.reference;
    const abs = Math.abs(signed);
    const ofReading = p.reference === 0 ? NaN : (signed / p.reference) * 100;
    const ofSpan = (signed / span) * 100;
    const correction = p.reference - p.indicated;
    return { ...p, signed, abs, ofReading, ofSpan, correction };
  });
  const worst = analyzed.reduce((a, b) => (b.abs > a.abs ? b : a));

  const metrics = [
    metric("worst", "최대 절대오차 Point", worst.i, "점", 0, { primary: true, hint: `${worst.abs} (표시−기준)` }),
    metric("wabs", "해당 절대오차", worst.abs, "", precision),
    metric("wsigned", "해당 Error (표시−기준)", worst.signed, "", precision),
    metric("wcorr", "해당 계산상 보정값(Correction)", worst.correction, "", precision),
    metric("wspan", "해당 % of Span", worst.ofSpan, "%", precision),
  ];
  analyzed.forEach((p) => {
    metrics.push(metric(`e${p.i}`, `P${p.i} Error (표시−기준)`, p.signed, "", precision));
    metrics.push(metric(`a${p.i}`, `P${p.i} Absolute Error`, p.abs, "", precision));
    if (Number.isFinite(p.ofReading)) metrics.push(metric(`r${p.i}`, `P${p.i} % of Reading`, p.ofReading, "%", precision));
    else metrics.push(metric(`r${p.i}`, `P${p.i} % of Reading`, 0, "%", precision, { hint: "Reference = 0 — 계산 불가" }));
    metrics.push(metric(`s${p.i}`, `P${p.i} % of Span`, p.ofSpan, "%", precision));
    metrics.push(metric(`c${p.i}`, `P${p.i} 계산상 보정값(Correction)`, p.correction, "", precision));
  });

  return ok({
    metrics,
    inputSummary: [
      { label: "Span", value: `${spanMin} ~ ${spanMax}` },
      { label: "점 수", value: `${pts.length}` },
    ],
    interpretation: `최대 절대오차는 ${worst.i}번 점(${roundTo(worst.abs, precision)})입니다. 공인교정을 대체하지 않습니다.`,
    warnings: [
      warning(
        "error",
        "공인교정 아님",
        "표시값과 기준값의 차이를 정리하는 보조 기능입니다. 국가교정기관 성적이나 교정 주기를 대체하지 않습니다.",
      ),
    ],
    formulaUsed: "Error = 표시 − 기준,  Correction = 기준 − 표시,  %Reading = Error/기준 × 100 (기준=0이면 불가),  %Span = Error/(URV−LRV) × 100",
    steps: analyzed.map(
      (p) =>
        `P${p.i}: 표시 ${roundTo(p.indicated, precision)}, 기준 ${roundTo(p.reference, precision)}, Error ${roundTo(p.signed, precision)}, Correction ${roundTo(p.correction, precision)}, Span% ${roundTo(p.ofSpan, precision)}`,
    ),
    reviewStatus: review("check", "센서 비교 참고입니다. 교정 합격 판정이 아닙니다."),
    assumptionsUsed: ["Reference가 해당 범위에서 더 높은 신뢰도를 갖는다고 가정합니다."],
    nextChecks: ["교정 주기", "환경 조건", "불확도 합성"],
    followUps: [followUp("설계값 vs 실측 비교", "/tools/facility/field-compare", {})],
  });
}

export type TrendPoint = { tMs?: number; value: number; label?: string };

export function parseTrendText(text: string): { points: TrendPoint[]; errors: { line: number; message: string }[] } {
  const errors: { line: number; message: string }[] = [];
  const points: TrendPoint[] = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith("#")) continue;
    const cols = raw.split(/[,;\t]/).map((c) => c.trim()).filter(Boolean);
    if (cols.length === 0) continue;
    if (i === 0 && /value|값|reading/i.test(cols.join(" "))) continue;
    if (cols.length === 1) {
      const n = Number(cols[0]);
      if (!Number.isFinite(n)) {
        errors.push({ line: i + 1, message: "숫자가 아닙니다" });
        continue;
      }
      points.push({ value: n });
      continue;
    }
    const n = Number(cols[cols.length - 1]);
    if (!Number.isFinite(n)) {
      errors.push({ line: i + 1, message: "마지막 열이 숫자가 아닙니다" });
      continue;
    }
    const tRaw = cols[0];
    const tNum = Number(tRaw);
    const tMs = Number.isFinite(tNum) ? tNum : Date.parse(tRaw);
    points.push({ value: n, tMs: Number.isFinite(tMs) ? tMs : undefined, label: tRaw });
  }
  return { points, errors };
}

export function analyzeTrend(points: TrendPoint[]) {
  const values = points.map((p) => p.value);
  const count = values.length;
  const avg = count ? values.reduce((a, b) => a + b, 0) / count : 0;
  const min = count ? Math.min(...values) : 0;
  const max = count ? Math.max(...values) : 0;
  const range = max - min;
  const stdev = sampleStdev(values);
  const first = values[0] ?? 0;
  const last = values[count - 1] ?? 0;
  const pctChange = first === 0 ? NaN : ((last - first) / Math.abs(first)) * 100;
  const times = points.map((p) => p.tMs).filter((t): t is number => typeof t === "number" && Number.isFinite(t));
  const durationMs = times.length >= 2 ? Math.max(...times) - Math.min(...times) : 0;
  const durationH = durationMs / 3_600_000;
  const roc = durationH > 0 ? (last - first) / durationH : NaN;
  const peak = points.reduce((a, b) => (b.value > a.value ? b : a), points[0] ?? { value: 0 });
  return { count, avg, min, max, range, stdev, pctChange, durationH, roc, peak };
}

export function calculateOperatingEnergy(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const kw = fields.num("powerKw", "입력전력 kW");
  const hDay = fields.num("hoursPerDay", "일 운전시간");
  const days = fields.num("daysPerMonth", "월 운전일수");
  const lf = fields.optional("loadFactor", 1, "Load Factor");
  const priceRaw = fields.optional("energyPrice", 0, "전력단가");
  fields.requirePositive("powerKw", "입력전력", kw);
  fields.requireNonNegative("hoursPerDay", "일 운전시간", hDay);
  fields.requirePositive("daysPerMonth", "월 일수", days);
  if (hDay > 24) fields.errors.hoursPerDay = "하루 24시간을 넘을 수 없습니다.";
  if (days > 31) fields.errors.daysPerMonth = "월 일수는 31 이하로 넣으세요.";
  if (lf <= 0 || lf > 1) fields.errors.loadFactor = "Load Factor는 0 초과 1 이하여야 합니다.";
  if (priceRaw < 0) fields.errors.energyPrice = "단가는 0 이상이어야 합니다.";
  if (fields.failed()) return fields.fail();

  const daily = kw * hDay * lf;
  const monthly = daily * days;
  const yearly = monthly * 12;
  const monthCost = priceRaw > 0 ? monthly * priceRaw : 0;
  const yearCost = priceRaw > 0 ? yearly * priceRaw : 0;

  const metrics = [
    metric("day", "일 사용량", daily, "kWh", precision, { primary: true }),
    metric("mon", "월 사용량", monthly, "kWh", precision),
    metric("year", "연간 예상 사용량", yearly, "kWh", precision),
  ];
  if (priceRaw > 0) {
    metrics.push(metric("mcost", "월 사용량 기반 비용 추정", monthCost, "원", 0));
    metrics.push(metric("ycost", "연간 사용량 기반 비용 추정", yearCost, "원", 0));
  }

  return ok({
    metrics,
    inputSummary: [
      { label: "전력·시간", value: `${kw} kW × ${hDay} h/일 × ${days} 일 × LF ${lf}` },
      { label: "단가", value: priceRaw > 0 ? `${priceRaw} 원/kWh (사용자)` : "미입력 — 비용 생략" },
    ],
    interpretation: `월 ${roundTo(monthly, precision)} kWh, 연 ${roundTo(yearly, precision)} kWh. ${priceRaw > 0 ? "비용은 사용자 단가 × 사용량입니다. 한전 청구 예상액이 아닙니다." : "단가가 없어 비용은 계산하지 않았습니다."}`,
    warnings: [
      warning("error", "한전 청구 아님", "계약종별, 기본요금, 계절·시간대, 연료비, 기후환경, 역률, 부가세를 포함하지 않습니다. 사용량 기반 단순 비용 추정입니다."),
    ],
    formulaUsed: "E_day = P × h × LF,  E_month = E_day × 일수,  비용 추정 = E × 사용자 단가",
    steps: [
      `일 = ${kw} × ${hDay} × ${lf} = ${roundTo(daily, precision)} kWh`,
      `월 = ${roundTo(daily, precision)} × ${days} = ${roundTo(monthly, precision)} kWh`,
      `연 = ${roundTo(monthly, precision)} × 12 = ${roundTo(yearly, precision)} kWh`,
    ],
    reviewStatus: review("check", "사용량 기반 단순 에너지 비용 추정입니다. 전기요금 계산기가 아닙니다."),
    assumptionsUsed: ["입력전력이 관찰 구간의 평균 부하라고 가정합니다."],
    nextChecks: ["실제 검침 kWh", "최대수요 기본요금"],
    followUps: [
      followUp("월간 사용량 비교", "/tools/facility/monthly-energy", {}),
      followUp("개선 전후 비교", "/tools/facility/retrofit-compare", { baselineKw: roundTo(kw, 4) }),
    ],
  });
}

export function calculateRetrofitCompare(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const p0 = fields.num("baselineKw", "기존 소비전력");
  const p1 = fields.num("proposedKw", "개선 후 소비전력");
  const h0 = fields.num("baselineHours", "기존 연간 운전 h");
  const h1 = fields.optional("proposedHours", h0, "개선 후 연간 운전 h");
  const rate0 = fields.optional("baselineRate", 0, "기존 단가");
  const rate1 = fields.optional("proposedRate", rate0, "개선 후 단가");
  const capex = fields.optional("capitalCost", 0, "투자비");
  fields.requireNonNegative("baselineKw", "기존 전력", p0);
  fields.requireNonNegative("proposedKw", "개선 전력", p1);
  fields.requireNonNegative("baselineHours", "운전시간", h0);
  if (h1 < 0) fields.errors.proposedHours = "운전시간은 0 이상이어야 합니다.";
  if (fields.failed()) return fields.fail();

  const dP = p0 - p1;
  const e0 = p0 * h0;
  const e1 = p1 * h1;
  const dE = e0 - e1;
  const pct = p0 === 0 ? NaN : (dP / p0) * 100;
  const c0 = rate0 > 0 ? e0 * rate0 : 0;
  const c1 = rate1 > 0 ? e1 * rate1 : 0;
  const dC = c0 - c1;
  const payback = capex > 0 && dC > 0 ? capex / dC : NaN;

  const metrics = [
    metric("dp", "절감 kW", dP, "kW", precision, { primary: true }),
    metric("de", "연간 절감 kWh", dE, "kWh", precision),
    metric("pct", "절감률", Number.isFinite(pct) ? pct : 0, "%", precision),
  ];
  if (rate0 > 0 || rate1 > 0) metrics.push(metric("dc", "연간 예상 비용 절감", dC, "원", 0));
  if (Number.isFinite(payback)) metrics.push(metric("pb", "Simple Payback", payback, "년", Math.max(precision, 2)));

  return ok({
    metrics,
    inputSummary: [
      { label: "기존", value: `${p0} kW × ${h0} h` },
      { label: "개선", value: `${p1} kW × ${h1} h` },
    ],
    interpretation: `전력 ${roundTo(dP, precision)} kW, 연간 ${roundTo(dE, precision)} kWh ${dE >= 0 ? "감소" : "증가"} 추정입니다.`,
    warnings: [
      warning("info", "단순 비교", "ROI·NPV·IRR은 계산하지 않습니다. 비용은 사용자 단가 × 사용량 추정입니다."),
      warning("info", "한전 청구 아님", "기본요금·시간대별 요금은 포함하지 않습니다."),
    ],
    formulaUsed: "ΔP = P0−P1,  ΔE = P0 t0 − P1 t1,  절감률 = ΔP/P0,  Payback = 투자비 / 연간 비용절감",
    steps: [
      `ΔP = ${p0} − ${p1} = ${roundTo(dP, precision)} kW`,
      `ΔE = ${p0}×${h0} − ${p1}×${h1} = ${roundTo(dE, precision)} kWh`,
      Number.isFinite(payback) ? `Payback = ${capex} / ${roundTo(dC, 0)} = ${roundTo(payback, 2)} 년` : "투자비 또는 비용절감이 없어 Payback 생략",
    ],
    reviewStatus: review("check", "에너지 수지 비교입니다. 투자 의사결정 전용이 아닙니다."),
    assumptionsUsed: ["운전시간과 부하가 연간 일정하다고 가정합니다."],
    nextChecks: ["실제 검침", "유지비 변화"],
    followUps: [followUp("운전 에너지 kWh", "/tools/facility/energy-cost", { mode: "operating", powerKw: roundTo(p1, 4) })],
  });
}
