import { SQRT_3, toVolts } from "@/lib/math/units";
import { FieldBag, metric, ok, review, roundTo, warning, type CalcInput } from "@/lib/calculations/parse";
import { followUp } from "@/lib/calculations/handoff";
import type { CalculationOutcome } from "@/lib/types";

/** 국내 저압·특고압 변전에서 자주 보는 상용 kVA 눈금. 규정 의무 용량표가 아님. */
export const COMMON_TRANSFORMER_KVA = [50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 2500, 3000];

export function nearestCommonKva(need: number): number {
  const found = COMMON_TRANSFORMER_KVA.find((s) => s >= need - 1e-9);
  return found ?? Math.ceil(need);
}

export function calculateTransformerSizing(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const demandKw = fields.num("demandKw", "최대수요전력 kW");
  const pf = fields.optional("pf", 0.9, "역률");
  const detailed = (input.mode ?? "basic") === "detailed";
  const design = detailed ? fields.optional("designMargin", 0.1, "설계 여유") : 0;
  const future = detailed ? fields.optional("futureMargin", 0.1, "증설 여유") : 0;
  const loss = detailed ? fields.optional("distLoss", 0.03, "배전 손실") : 0;
  const V1 = toVolts(fields.optional("vPrimary", 22900, "1차 전압"), input.vPrimaryUnit ?? "V");
  const V2 = toVolts(fields.optional("vSecondary", 380, "2차 전압"), input.vSecondaryUnit ?? "V");
  fields.requirePositive("demandKw", "최대수요전력", demandKw);
  fields.requireUnitInterval("pf", "역률", pf);
  fields.requireNonNegative("designMargin", "설계 여유", design);
  fields.requireNonNegative("futureMargin", "증설 여유", future);
  fields.requireNonNegative("distLoss", "배전 손실", loss);
  if (V1) fields.requirePositive("vPrimary", "1차 전압", V1);
  if (V2) fields.requirePositive("vSecondary", "2차 전압", V2);
  if (fields.failed()) return fields.fail();

  const pWithLoss = demandKw * (1 + loss);
  const sLoad = pWithLoss / pf;
  const sNeed = sLoad * (1 + design) * (1 + future);
  const sPick = nearestCommonKva(sNeed);
  const loadRatio = (sLoad / sPick) * 100;
  const I1 = V1 > 0 ? (sPick * 1000) / (SQRT_3 * V1) : 0;
  const I2 = V2 > 0 ? (sPick * 1000) / (SQRT_3 * V2) : 0;

  const zPct = fields.optional("zPct", 0, "%Z");
  const c = fields.optional("cFactor", 1.05, "전압계수 c");
  const metrics = [
    metric("need", "필요 kVA", sNeed, "kVA", precision, { primary: true }),
    metric("pick", "상용 용량 후보", sPick, "kVA", 0),
    metric("ratio", "후보 대비 예상 부하율", loadRatio, "%", precision),
    metric("sload", "손실 반영 부하 kVA", sLoad, "kVA", precision),
  ];
  if (V1 > 0) metrics.push(metric("i1", "1차 정격전류(후보 용량)", I1, "A", precision));
  if (V2 > 0) metrics.push(metric("i2", "2차 정격전류(후보 용량)", I2, "A", precision));

  const warnings = [
    warning("info", "상용 용량", "50·100·200·300·500·1000 kVA 등은 현장에서 자주 쓰는 눈금입니다. 강제 표준 용량표가 아닙니다."),
    warning("warning", "고조파·냉각", "K-factor, 고도, 온도, 옥내 환기는 반영하지 않았습니다."),
  ];

  if (zPct > 0 && V2 > 0) {
    const In = (sPick * 1000) / (SQRT_3 * V2);
    const Ik = (In * 100 * c) / zPct;
    const skMva = (SQRT_3 * V2 * Ik) / 1e6;
    metrics.push(metric("ik", "2차 예상 대칭 단락전류", Ik, "A", 0));
    metrics.push(metric("sk", "단락용량", skMva, "MVA", precision));
    warnings.push(
      warning("info", "%Z 단락", "Ik ≈ c × In × 100 / %Z. 케이블·계통 임피던스가 없으면 변압기만의 근사입니다."),
    );
  }

  return ok({
    metrics,
    inputSummary: [
      { label: "수요", value: `${demandKw} kW` },
      { label: "여유", value: `설계 ${design * 100}%, 증설 ${future * 100}%, 손실 ${loss * 100}%` },
    ],
    interpretation: `필요 ${roundTo(sNeed, precision)} kVA, 상용 후보 ${sPick} kVA에서 예상 부하율 ${roundTo(loadRatio, precision)}%입니다.`,
    warnings,
    formulaUsed: "S_need = (P × (1+손실) / PF) × (1+설계여유) × (1+증설여유)",
    steps: [
      `P' = ${demandKw} × (1+${loss}) = ${roundTo(pWithLoss, precision)} kW`,
      `S_load = P' / PF = ${roundTo(sLoad, precision)} kVA`,
      `S_need = ${roundTo(sLoad, precision)} × ${1 + design} × ${1 + future} = ${roundTo(sNeed, precision)} kVA`,
      `상용 후보 = ${sPick} kVA`,
      V2 > 0 ? `I2 = S / (√3 V2) = ${roundTo(I2, precision)} A` : "2차 전압 없음",
    ],
    reviewStatus: review("check", "필요 kVA는 산정되었습니다. 실제 명판 용량·냉각·고조파를 확인하세요."),
    nextChecks: ["냉각 방식·고도", "고조파 K-factor", "명판 %Z로 단락 재검토"],
    followUps: [
      followUp("이 조건으로 단락전류 계산", "/tools/electrical/short-circuit", {
        voltage: roundTo(V2, 4),
        includeTr: "yes",
        trKva: sPick,
        trZpct: zPct > 0 ? roundTo(zPct, 4) : 6,
      }),
      followUp("변압기 부하율 확인", "/tools/electrical/transformer-load", {
        loadKw: roundTo(demandKw, 4),
      }),
      followUp("현장 측정 부하율", "/tools/electrical/transformer-load", {
        loadMode: "measured",
      }),
      followUp("1·2차 전류", "/tools/electrical/transformer-current", {
        vPrimary: roundTo(V1, 4),
        vSecondary: roundTo(V2, 4),
      }),
    ],
  });
}

export function calculateTransformerCurrents(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const s = fields.num("ratedKva", "정격 kVA");
  const V1 = toVolts(fields.num("vPrimary", "1차 전압"), input.vPrimaryUnit ?? "V");
  const V2 = toVolts(fields.num("vSecondary", "2차 전압"), input.vSecondaryUnit ?? "V");
  fields.requirePositive("ratedKva", "정격", s);
  fields.requirePositive("vPrimary", "1차 전압", V1);
  fields.requirePositive("vSecondary", "2차 전압", V2);
  if (fields.failed()) return fields.fail();
  const I1 = (s * 1000) / (SQRT_3 * V1);
  const I2 = (s * 1000) / (SQRT_3 * V2);
  return ok({
    metrics: [
      metric("i2", "2차 정격전류", I2, "A", precision, { primary: true }),
      metric("i1", "1차 정격전류", I1, "A", precision),
    ],
    inputSummary: [
      { label: "S", value: `${s} kVA` },
      { label: "V1", value: `${roundTo(V1, 1)} V` },
      { label: "V2", value: `${roundTo(V2, 1)} V` },
    ],
    interpretation: `3상 정격전류는 1차 ${roundTo(I1, precision)} A, 2차 ${roundTo(I2, precision)} A입니다.`,
    warnings: [warning("info", "3상", "단상 변압기는 V가 아닌 해당 권선 전압으로 I = S/V 를 쓰세요.")],
    formulaUsed: "I = S / (√3 × V)",
    steps: [
      `I1 = ${s} × 1000 / (√3 × ${roundTo(V1, 2)}) = ${roundTo(I1, precision)} A`,
      `I2 = ${s} × 1000 / (√3 × ${roundTo(V2, 2)}) = ${roundTo(I2, precision)} A`,
    ],
    reviewStatus: review("in-range", "명판 전압·용량만으로 구한 정격전류입니다."),
  });
}

export function calculateTransformerParallel(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const s1 = fields.num("s1", "TR1 kVA");
  const z1 = fields.num("z1", "TR1 %Z");
  const s2 = fields.num("s2", "TR2 kVA");
  const z2 = fields.num("z2", "TR2 %Z");
  const load = fields.num("loadKva", "공통 부하 kVA");
  fields.requirePositive("s1", "TR1", s1);
  fields.requirePositive("z1", "%Z1", z1);
  fields.requirePositive("s2", "TR2", s2);
  fields.requirePositive("z2", "%Z2", z2);
  fields.requireNonNegative("loadKva", "부하", load);
  if (fields.failed()) return fields.fail();

  const y1 = s1 / z1;
  const y2 = s2 / z2;
  const p1 = load * (y1 / (y1 + y2));
  const p2 = load * (y2 / (y1 + y2));
  const r1 = (p1 / s1) * 100;
  const r2 = (p2 / s2) * 100;
  const zDiff = (Math.abs(z1 - z2) / Math.min(z1, z2)) * 100;

  const warnings = [
    warning("warning", "기본 검토", "전압비, 위상, 임피던스 전압, 극성이 맞아야 병렬이 가능합니다. 이 계산은 부하 분담만 봅니다."),
  ];
  if (zDiff > 10) {
    warnings.push(warning("warning", "%Z 차이", "임피던스 전압 차이가 큽니다. 순환전류·편부하 위험이 있습니다."));
  }

  return ok({
    metrics: [
      metric("p1", "TR1 분담", p1, "kVA", precision, { primary: true }),
      metric("p2", "TR2 분담", p2, "kVA", precision),
      metric("r1", "TR1 부하율", r1, "%", precision),
      metric("r2", "TR2 부하율", r2, "%", precision),
      metric("zd", "%Z 상대차", zDiff, "%", precision),
    ],
    inputSummary: [
      { label: "TR1", value: `${s1} kVA / ${z1}%` },
      { label: "TR2", value: `${s2} kVA / ${z2}%` },
    ],
    interpretation: `부하 분담은 %Z에 반비례(용량 가중합)합니다. TR1 ${roundTo(p1, precision)} kVA, TR2 ${roundTo(p2, precision)} kVA.`,
    warnings,
    formulaUsed: "Si = S × (Si_rated / zi) / Σ(Sj / zj)",
    steps: [
      `Y1 = ${s1}/${z1} = ${roundTo(y1, 4)}, Y2 = ${s2}/${z2} = ${roundTo(y2, 4)}`,
      `S1 = ${load} × Y1 / (Y1+Y2) = ${roundTo(p1, precision)} kVA`,
      `S2 = ${load} × Y2 / (Y1+Y2) = ${roundTo(p2, precision)} kVA`,
    ],
    reviewStatus: zDiff > 10 ? review("caution", "%Z 차이가 큽니다.") : review("check", "전압비·위상 확인이 남아 있습니다."),
  });
}

export function calculateTransformerLoss(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const sRated = fields.num("ratedKva", "정격 kVA");
  const p0 = fields.num("noLoadKw", "무부하손 kW");
  const pk = fields.num("loadLossKw", "전부하동손 kW");
  const loadKva = fields.num("loadKva", "실제 부하 kVA");
  const pf = fields.optional("pf", 0.9, "역률");
  fields.requirePositive("ratedKva", "정격", sRated);
  fields.requireNonNegative("noLoadKw", "무부하손", p0);
  fields.requireNonNegative("loadLossKw", "동손", pk);
  fields.requireNonNegative("loadKva", "부하", loadKva);
  fields.requireUnitInterval("pf", "역률", pf);
  if (fields.failed()) return fields.fail();

  const beta = loadKva / sRated;
  const pLoss = p0 + pk * beta * beta;
  const pOut = loadKva * pf;
  const eta = pOut + pLoss > 0 ? (pOut / (pOut + pLoss)) * 100 : 0;

  return ok({
    metrics: [
      metric("eta", "효율 추정", eta, "%", precision, { primary: true }),
      metric("ploss", "총 손실", pLoss, "kW", precision),
      metric("beta", "부하율 β", beta * 100, "%", precision),
    ],
    inputSummary: [{ label: "명판 손실", value: `P0=${p0} kW, Pk=${pk} kW` }],
    interpretation: `β=${roundTo(beta, 3)}에서 손실 ${roundTo(pLoss, precision)} kW, 효율 약 ${roundTo(eta, precision)}%입니다.`,
    warnings: [
      warning("info", "명판 값", "무부하손·부하손은 사용자가 명판 또는 시험성적서에서 넣어야 합니다. 임의의 전형값을 내장하지 않습니다."),
    ],
    formulaUsed: "P_loss = P0 + Pk × β²,  η = P_out / (P_out + P_loss)",
    steps: [
      `β = ${loadKva} / ${sRated} = ${roundTo(beta, 4)}`,
      `P_loss = ${p0} + ${pk} × β² = ${roundTo(pLoss, precision)} kW`,
      `P_out = ${loadKva} × ${pf} = ${roundTo(pOut, precision)} kW`,
      `η = ${roundTo(pOut, precision)} / (${roundTo(pOut, precision)} + ${roundTo(pLoss, precision)}) = ${roundTo(eta, precision)}%`,
    ],
    reviewStatus: review("in-range", "사용자 명판 손실 기준 추정입니다."),
  });
}
