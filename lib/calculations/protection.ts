import { SQRT_3, toVolts } from "@/lib/math/units";
import { FieldBag, metric, ok, review, roundTo, warning, type CalcInput } from "@/lib/calculations/parse";
import { kecCoordCond1, kecCoordCond2 } from "@/lib/calculations/kec-review";
import type { CalculationOutcome } from "@/lib/types";

export function calculateCtRatio(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const loadI = fields.num("loadCurrent", "부하전류");
  const ip = fields.num("primary", "CT 1차 정격");
  const is = input.secondary === "1" ? 1 : 5;
  const burdenVa = fields.optional("burdenVa", 0, "부담 VA");
  const leadOhm = fields.optional("leadOhm", 0, "리드 저항");
  const purpose = input.purpose ?? "metering";
  fields.requirePositive("loadCurrent", "부하전류", loadI);
  fields.requirePositive("primary", "1차 정격", ip);
  if (fields.failed()) return fields.fail();

  const ratio = ip / is;
  const i2 = loadI / ratio;
  const loadPct = (loadI / ip) * 100;
  const burdenOhm = burdenVa / (is * is);
  const v2 = i2 * (burdenOhm + leadOhm);

  return ok({
    metrics: [
      metric("ratio", "변류비", ratio, `:${is}A 환산`, precision, { primary: true }),
      metric("i2", "예상 2차 전류", i2, "A", Math.max(precision, 3)),
      metric("loadpct", "1차 정격 대비 부하", loadPct, "%", precision),
      metric("label", "표기 예", Number(`${ip}`), `/${is}A`, 0),
    ],
    inputSummary: [
      { label: "용도", value: purpose === "protection" ? "보호" : "계측" },
      { label: "2차", value: `${is} A` },
      { label: "부담", value: burdenVa > 0 ? `${burdenVa} VA` : "미입력" },
    ],
    interpretation: `${ip}/${is}A는 1차 ${ip} A일 때 2차 ${is} A가 되도록 설계된 변류기입니다. 변류비는 ${roundTo(ratio, 2)}:1이며, 부하 ${roundTo(loadI, precision)} A이면 이상 2차 전류는 ${roundTo(i2, 3)} A입니다.`,
    warnings: [
      warning(
        "info",
        "표기 의미",
        "100/5A, 200/5A, 400/5A는 1차 정격/2차 정격을 뜻합니다. 2차가 5A인 계기와 맞추는 조합이 흔합니다.",
      ),
      warning(
        "warning",
        "부담·포화",
        "보호용 CT는 포화 특성(ALF 등)이 계측용과 다릅니다. 부담이 정격을 넘으면 오차가 커집니다.",
      ),
      warning("error", "선정 승인 아님", "오차 계급, 부담, 극한 온도, IEC 61869 적용은 제조사 데이터로 확인하세요."),
    ],
    formulaUsed: "n = Ip / Is,  I2 = I1 / n",
    steps: [
      `n = ${ip} / ${is} = ${roundTo(ratio, 3)}`,
      `I2 = ${roundTo(loadI, precision)} / ${roundTo(ratio, 3)} = ${roundTo(i2, 3)} A`,
      burdenVa > 0 ? `정격 부담 저항 근사 = VA / Is² = ${roundTo(burdenOhm, 4)} Ω, 2차 전압 근사 ${roundTo(v2, 3)} V` : "부담 미입력",
    ],
    reviewStatus: review("check", "비와 2차 전류는 계산되었습니다. 계급·부담·용도는 추가 확인이 필요합니다."),
    assumptionsUsed: ["이상 CT(오차 0). 실제 비오차·위상오차는 미포함"],
  });
}

export function calculatePtRatio(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const v1 = toVolts(fields.num("vPrimary", "1차 전압"), input.vPrimaryUnit ?? "V");
  const v2 = toVolts(fields.num("vSecondary", "2차 전압"), input.vSecondaryUnit ?? "V");
  fields.requirePositive("vPrimary", "1차", v1);
  fields.requirePositive("vSecondary", "2차", v2);
  if (fields.failed()) return fields.fail();
  const n = v1 / v2;
  return ok({
    metrics: [
      metric("n", "변성비", n, "—", precision, { primary: true }),
      metric("v1", "1차", v1, "V", 1),
      metric("v2", "2차", v2, "V", 2),
    ],
    inputSummary: [{ label: "표기", value: `${roundTo(v1, 0)}/${roundTo(v2, 1)} V` }],
    interpretation: `PT/VT ${roundTo(v1, 0)}/${roundTo(v2, 1)} V의 변성비는 ${roundTo(n, precision)}입니다. 계기 전압 = 1차 전압 / 변성비.`,
    warnings: [warning("info", "부담", "정격 부담을 초과하면 오차가 증가합니다. IEC 61869 계기용 변압기를 참고하세요.")],
    formulaUsed: "n = V_primary / V_secondary",
    steps: [`n = ${roundTo(v1, 2)} / ${roundTo(v2, 3)} = ${roundTo(n, precision)}`],
    reviewStatus: review("in-range", "변성비 계산입니다. 절연계급·부담은 별도입니다."),
  });
}

export function calculateVfdSizing(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const kW = fields.num("motorKw", "모터 kW");
  const I = fields.optional("motorA", 0, "모터 전류");
  const V = toVolts(fields.num("voltage", "전압"), input.voltageUnit ?? "V");
  const margin = fields.optional("margin", 0.1, "여유율");
  const derate = fields.optional("derate", 1, "사용자 감소계수");
  const loadType = input.loadType ?? "variable";
  fields.requirePositive("motorKw", "모터 kW", kW);
  fields.requirePositive("voltage", "전압", V);
  fields.requireNonNegative("margin", "여유", margin);
  fields.requirePositive("derate", "감소계수", derate);
  if (I) fields.requirePositive("motorA", "전류", I);
  if (fields.failed()) return fields.fail();

  const sFromP = (kW * (1 + margin)) / derate;
  const sFromI = I > 0 ? (SQRT_3 * V * I * (1 + margin)) / 1000 / derate : 0;
  const sNeed = Math.max(sFromP, sFromI);

  return ok({
    metrics: [
      metric("s", "필요 VFD 용량 검토값", sNeed, "kVA", precision, { primary: true }),
      metric("sp", "전력 기준", sFromP, "kVA", precision),
      ...(I > 0 ? [metric("si", "전류 기준", sFromI, "kVA", precision)] : []),
    ],
    inputSummary: [
      { label: "부하 특성(기록)", value: loadType === "constant" ? "고토크/항시" : "변동 토크 등" },
      { label: "여유", value: `${margin * 100}%` },
      { label: "감소계수", value: String(derate) },
    ],
    interpretation: `여유와 사용자 감소계수를 반영한 검토 용량은 약 ${roundTo(sNeed, precision)} kVA입니다. 제조사 kW 정격·과부하 듀티(중과부하/경과부하)가 우선입니다.`,
    warnings: [
      warning("error", "자동 선정 아님", "케이블 길이, EMC, 제동저항, 고조파, 모터 절연은 제조사 선정표를 따르세요."),
      warning("info", "감소계수", "고지·고온·고캐리어 주파수 감소는 제조사 표 값을 사용자가 넣습니다. 임의 표를 내장하지 않습니다."),
    ],
    formulaUsed: "S_P = P × (1+여유) / k_derate,  S_I = √3 V I (1+여유) / 1000 / k_derate",
    steps: [
      `S_P = ${kW} × ${1 + margin} / ${derate} = ${roundTo(sFromP, precision)} kVA`,
      I > 0
        ? `S_I = √3 × ${roundTo(V, 1)} × ${I} × ${1 + margin} / 1000 / ${derate} = ${roundTo(sFromI, precision)} kVA`
        : "모터 전류 미입력 — 전력 기준만 사용",
      `필요 검토값 = max = ${roundTo(sNeed, precision)} kVA`,
    ],
    reviewStatus: review("check", "용량 하한 검토입니다. 드라이브 명판 듀티를 확인하세요."),
  });
}

export function calculateSoftStarter(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const flc = fields.num("flc", "모터 FLC");
  const k = fields.optional("startMult", 3.5, "기동배수");
  const t = fields.optional("startSec", 8, "기동시간 s");
  const starts = fields.optional("startsPerHour", 6, "시간당 기동");
  fields.requirePositive("flc", "FLC", flc);
  fields.requirePositive("startMult", "배수", k);
  fields.requirePositive("startSec", "기동시간", t);
  fields.requirePositive("startsPerHour", "기동횟수", starts);
  if (fields.failed()) return fields.fail();

  const istart = flc * k;
  const thermal = (istart / flc) ** 2 * (t / 3600) * starts;

  return ok({
    metrics: [
      metric("istart", "기동전류 설정 참고", istart, "A", precision, { primary: true }),
      metric("duty", "간이 열적 듀티 지표", thermal, "p.u.·h", 3),
    ],
    inputSummary: [
      { label: "FLC", value: `${flc} A` },
      { label: "k, t, n", value: `${k}×, ${t}s, ${starts}/h` },
    ],
    interpretation: `기동전류 참고 ${roundTo(istart, precision)} A. 열적 지표 (I/FLC)² × (t/3600) × 횟수 = ${roundTo(thermal, 3)} 입니다. 제조사 열모델이 아닙니다.`,
    warnings: [
      warning("error", "제조사 열용량 우선", "시간당 기동 횟수·온도와 바이패스 유무는 소프트스타터 카탈로그를 따릅니다."),
      warning("info", "간이 검토", "이 지표는 상대 비교용입니다. 합격 판정이 아닙니다."),
    ],
    formulaUsed: "I_start = k × FLC,  듀티 지표 = (k)² × t_hour × n",
    steps: [
      `I_start = ${k} × ${flc} = ${roundTo(istart, precision)} A`,
      `지표 = ${k}² × (${t}/3600) × ${starts} = ${roundTo(thermal, 3)}`,
    ],
    reviewStatus: review("check", "설정 전류·기동 횟수는 장치 명판으로 확인하세요."),
  });
}

export function calculateBreakerExtended(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const I = fields.num("current", "부하전류");
  const margin = fields.optional("margin", 1.25, "여유율");
  const isc = fields.optional("iscKa", 0, "단락전류 kA");
  const icu = fields.optional("icuKa", 0, "차단기 Icu kA");
  const inRated = fields.optional("inRated", 0, "In");
  const izCorrected = fields.optional("izCorrected", 0, "Iz");
  const i2Conv = fields.optional("i2Conv", 0, "I2");
  const loadType = input.loadType ?? "mixed";
  fields.requirePositive("current", "부하전류", I);
  fields.requirePositive("margin", "여유율", margin);
  if (inRated < 0) fields.errors.inRated = "In은 0 이상이어야 합니다.";
  if (izCorrected < 0) fields.errors.izCorrected = "Iz는 0 이상이어야 합니다.";
  if (i2Conv < 0) fields.errors.i2Conv = "I₂는 0 이상이어야 합니다.";
  if (fields.failed()) return fields.fail();

  const minRating = I * margin;
  const stepsList = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000];
  const near = stepsList.find((s) => s >= minRating - 1e-9) ?? Math.ceil(minRating);
  const hasCoord = inRated > 0 && izCorrected > 0;

  const warnings = [
    warning(
      "error",
      "정격 검토 참고",
      "차단기를 자동 선정하지 않습니다. 트립 곡선, 선택차단, 케이블 보호, 모터 기동은 제조사 데이터와 보호협조가 필요합니다.",
    ),
    warning("info", "여유율과 구분", "임의 여유율 I×k는 KEC 212.4.1 협조 조건(Ib·In·Iz)과 다른 참고값입니다."),
  ];
  if (loadType === "motor") {
    warnings.push(warning("warning", "모터 부하", "기동전류로 순시 트립이 오동작하지 않는지 명판과 곡선을 보세요."));
  }
  if (hasCoord) {
    warnings.push(
      warning(
        "info",
        "관계 표시",
        "수치관계 확인 결과이며 설비의 KEC 적합성을 자동 판정하지 않습니다.",
      ),
    );
  }

  const cond1 = hasCoord ? kecCoordCond1(I, inRated, izCorrected) : null;
  const cond2 = i2Conv > 0 && izCorrected > 0 ? kecCoordCond2(i2Conv, izCorrected) : null;

  const metrics = [
    metric("min", "임의 여유율 참고값", minRating, "A", precision, { primary: true }),
    metric("near", "가까운 상용 눈금", near, "A", 0),
    metric("ib", "설계전류 Ib", I, "A", precision),
  ];
  if (inRated > 0) metrics.push(metric("in", "차단기 정격/설정 In", inRated, "A", precision));
  if (izCorrected > 0) metrics.push(metric("iz", "보정 후 도체 허용전류 Iz", izCorrected, "A", precision));
  metrics.push({
    id: "cond1",
    label: "조건 1  Ib ≤ In ≤ Iz",
    value: cond1 ? `수치관계 ${cond1}` : "미검토",
  });
  if (i2Conv > 0) {
    metrics.push(metric("i2", "입력 규약동작전류 I₂", i2Conv, "A", precision));
    if (izCorrected > 0) {
      metrics.push(metric("i2Limit", "1.45 × Iz", 1.45 * izCorrected, "A", precision));
    }
  }
  metrics.push({
    id: "i2Review",
    label: "조건 2  I₂ ≤ 1.45 Iz",
    value: cond2 ? `수치관계 ${cond2}` : "미검토",
  });

  let status = review("check", "부하전류 여유만 반영한 참고값입니다. KEC 적합 판정이 아닙니다.");
  if (isc > 0 && icu > 0) {
    metrics.push(metric("isc", "입력 단락전류", isc, "kA", precision));
    metrics.push(metric("icu", "입력 Icu", icu, "kA", precision));
    if (icu + 1e-9 >= isc) {
      status = review("in-range", "사용자 입력 Icu가 입력 단락전류 이상입니다. 제조사 조건·DC 성분·카테고리는 미검토입니다.");
    } else {
      status = review("caution", "입력 Icu가 입력 단락전류보다 작습니다.");
      warnings.push(warning("warning", "차단용량", "Icu < Isc 입력입니다. 기기 적용 전 반드시 재검토하세요."));
    }
  }

  const i2Note = cond2
    ? `조건 2 수치관계 ${cond2}. I₂는 제조사 기술사양 또는 적용 제품표준에서 확인합니다.`
    : "조건 2 미검토. I₂는 제조사 기술사양 또는 적용 제품표준에서 확인하세요.";
  const cond1Note = cond1 ? `조건 1 수치관계 ${cond1}.` : "조건 1 미검토 (In·Iz 필요).";

  return ok({
    metrics,
    inputSummary: [
      { label: "부하 종류", value: loadType },
      { label: "여유율", value: String(margin) },
      { label: "In", value: inRated > 0 ? `${roundTo(inRated, precision)} A` : "미입력" },
      { label: "Iz", value: izCorrected > 0 ? `${roundTo(izCorrected, precision)} A` : "미입력" },
      { label: "I₂", value: i2Conv > 0 ? `${roundTo(i2Conv, precision)} A` : "미검토" },
    ],
    interpretation: hasCoord
      ? `Ib ${roundTo(I, precision)} A, In ${roundTo(inRated, precision)} A, Iz ${roundTo(izCorrected, precision)} A입니다. ${cond1Note} ${i2Note} 수치관계 확인이며 적합 판정이 아닙니다. 임의 여유율 참고값은 ${roundTo(minRating, precision)} A입니다.`
      : `설계전류에 임의 여유율 ${roundTo(margin, 2)}를 곱한 참고값은 ${roundTo(minRating, precision)} A입니다. 가까운 상용 정격 ${near} A는 제안이 아니라 스케일 참고입니다. ${cond1Note} ${i2Note}`,
    warnings,
    formulaUsed: hasCoord
      ? "참고 I×k. 조건 1 Ib≤In≤Iz, 조건 2 I₂≤1.45 Iz (입력 시에만 수치관계)"
      : "I_ref = Ib × 임의 여유율. 협조 조건은 In·Iz·I₂ 입력 시",
    steps: [
      `I_ref = ${roundTo(I, precision)} × ${margin} = ${roundTo(minRating, precision)} A`,
      isc > 0 ? `Isc = ${isc} kA, Icu = ${icu || "미입력"} kA` : "단락전류 미입력 — 차단용량 비교 생략",
      cond1 ? `조건 1 Ib≤In≤Iz : 수치관계 ${cond1}` : "조건 1 미검토",
      cond2 ? `조건 2 I₂≤1.45 Iz : 수치관계 ${cond2}` : "조건 2 미검토",
    ],
    reviewStatus: status,
  });
}

/** IEC 60255-151 IDMT: t = TMS × A / ((I/Is)^p − 1) */
const IEC_CURVES: Record<string, { A: number; p: number; label: string }> = {
  SI: { A: 0.14, p: 0.02, label: "IEC Standard Inverse" },
  VI: { A: 13.5, p: 1, label: "IEC Very Inverse" },
  EI: { A: 80, p: 2, label: "IEC Extremely Inverse" },
  LTI: { A: 120, p: 1, label: "IEC Long Time Inverse" },
};

export function calculateRelayIec(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const pickup = fields.num("pickup", "픽업 전류 A");
  const I = fields.num("faultCurrent", "사고전류 A");
  const tms = fields.optional("tms", 0.1, "TMS");
  const curve = input.curve ?? "SI";
  fields.requirePositive("pickup", "픽업", pickup);
  fields.requirePositive("faultCurrent", "사고전류", I);
  fields.requirePositive("tms", "TMS", tms);
  if (fields.failed()) return fields.fail();
  if (I <= pickup) {
    return fields.fail("사고전류가 픽업 이하이면 반한시 동작시간을 정의하지 않습니다.");
  }
  const spec = IEC_CURVES[curve] ?? IEC_CURVES.SI;
  const M = I / pickup;
  const t = (tms * spec.A) / (M ** spec.p - 1);

  return ok({
    metrics: [
      metric("t", "동작시간", t, "s", Math.max(precision, 3), { primary: true }),
      metric("m", "플러그비 M", M, "—", precision),
    ],
    inputSummary: [
      { label: "곡선", value: spec.label },
      { label: "TMS", value: String(tms) },
    ],
    interpretation: `${spec.label}에서 M=${roundTo(M, 3)}, t≈${roundTo(t, 3)} s입니다. 향후 협조 곡선 플롯용으로 같은 데이터 구조를 쓸 수 있습니다.`,
    warnings: [
      warning("info", "상수", "A, p는 IEC 60255-151 / IEC 60255-3에 공개된 IDMT 상수입니다."),
      warning("error", "협조 확정 아님", "실제 계전기는 제조사 곡선, DT 요소, 방향, CT 오차를 포함합니다."),
    ],
    formulaUsed: "t = TMS × A / ((I/Is)^p − 1)",
    steps: [
      `M = ${roundTo(I, precision)} / ${roundTo(pickup, precision)} = ${roundTo(M, 4)}`,
      `A=${spec.A}, p=${spec.p}`,
      `t = ${tms} × ${spec.A} / (${roundTo(M, 4)}^${spec.p} − 1) = ${roundTo(t, 4)} s`,
    ],
    reviewStatus: review("check", "IEC 반한시 수식 계산입니다. 보호협조 도면이 아닙니다."),
  });
}
