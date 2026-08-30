import { SQRT_3, toVolts, toWatts } from "@/lib/math/units";
import { FieldBag, metric, ok, review, roundTo, warning, type CalcInput } from "@/lib/calculations/parse";
import { followUp } from "@/lib/calculations/handoff";
import type { CalculationOutcome } from "@/lib/types";

function motorPowerWatts(fields: FieldBag, input: CalcInput): number {
  const unit = input.powerUnit ?? "kW";
  const power = fields.num("power", "모터 출력");
  if (fields.errors.power) return NaN;
  fields.requirePositive("power", "모터 출력", power);
  return toWatts(power, unit);
}

/** 3상: I = P / (√3 V PF η), 단상: I = P / (V PF η) */
export function calculateMotorCurrent(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const phase = input.phase ?? "3";
  const P = motorPowerWatts(fields, input);
  const V = toVolts(fields.num("voltage", "전압"), input.voltageUnit ?? "V");
  const pf = fields.optional("pf", 0.85, "역률");
  const eta = fields.optional("efficiency", 0.9, "효율");
  fields.requirePositive("voltage", "전압", V);
  fields.requireUnitInterval("pf", "역률", pf);
  fields.requireUnitInterval("efficiency", "효율", eta);
  if (fields.failed()) return fields.fail();

  const denom = phase === "1" ? V * pf * eta : SQRT_3 * V * pf * eta;
  if (denom === 0) return fields.fail("전압·역률·효율의 곱이 0이라 전류를 계산할 수 없습니다.");

  const I = P / denom;
  const pin = P / eta;
  const kWout = P / 1000;
  const kWin = pin / 1000;
  const kVA = kWin / pf;
  const startLow = I * 5;
  const startHigh = I * 8;

  const steps =
    phase === "1"
      ? [
          `출력을 와트로 환산: P = ${roundTo(P, 1)} W`,
          `I = P / (V × PF × η) = ${roundTo(P, 1)} / (${roundTo(V, 2)} × ${roundTo(pf, 3)} × ${roundTo(eta, 3)})`,
          `정격전류 I = ${roundTo(I, precision)} A`,
          `입력전력 = P / η = ${roundTo(kWin, precision)} kW`,
          `피상전력 = 입력전력 / PF = ${roundTo(kVA, precision)} kVA`,
        ]
      : [
          `출력을 와트로 환산: P = ${roundTo(P, 1)} W`,
          `I = P / (√3 × V × PF × η) = ${roundTo(P, 1)} / (${roundTo(SQRT_3, 5)} × ${roundTo(V, 2)} × ${roundTo(pf, 3)} × ${roundTo(eta, 3)})`,
          `정격전류 I = ${roundTo(I, precision)} A`,
          `입력전력 = P / η = ${roundTo(kWin, precision)} kW`,
          `피상전력 = 입력전력 / PF = ${roundTo(kVA, precision)} kVA`,
        ];

  return ok({
    metrics: [
      metric("flc", "정격전류(FLC)", I, "A", precision, { primary: true }),
      metric("pin", "입력전력", kWin, "kW", precision),
      metric("kva", "피상전력", kVA, "kVA", precision),
      metric("pout", "축출력", kWout, "kW", precision),
      metric("startLow", "기동전류 하한 참고(5×FLC)", startLow, "A", precision),
      metric("startHigh", "기동전류 상한 참고(8×FLC)", startHigh, "A", precision),
      metric("cableHint", "케이블 검토용 전류 참고", I * 1.25, "A", precision, {
        hint: "연속 부하에 1.25를 곱한 실무 참고이며 규정 값이 아닙니다.",
      }),
    ],
    inputSummary: [
      { label: "회로", value: phase === "1" ? "단상" : "3상" },
      { label: "축출력", value: `${roundTo(kWout, precision)} kW` },
      { label: "전압", value: `${roundTo(V, precision)} V` },
      { label: "역률", value: String(roundTo(pf, 3)) },
      { label: "효율", value: String(roundTo(eta, 3)) },
    ],
    interpretation: `${phase === "1" ? "단상" : "3상"} ${roundTo(V, 0)} V, ${roundTo(kWout, precision)} kW 모터의 정격전류는 ${roundTo(I, precision)} A입니다. 기동전류 범위는 DOL 유도전동기에서 흔히 보는 5~8배 참고 구간이며 명판·기동방식이 우선입니다.`,
    warnings: [
      warning("error", "선정 승인 아님", "케이블·차단기·과부하계전기는 제조사 명판, 기동방식, 적용 배전 규정을 검토한 뒤 정해야 합니다."),
      warning("info", "기동전류", "5~8배는 DOL 농형 유도전동기의 흔한 실무 구간입니다. 소프트스타터·VFD·권선형은 훨씬 낮을 수 있습니다."),
    ],
    formulaUsed: phase === "1" ? "I = P / (V × PF × η)" : "I = P / (√3 × V × PF × η)",
    steps,
    assumptionsUsed: [
      "정현파·정상 운전·평형(3상)을 가정합니다.",
      "P는 축출력이며 전기 입력은 효율로 나눈 값입니다.",
    ],
    reviewStatus: review("check", "정격전류는 계산되었으나 보호기기·케이블은 명판과 규정 검토가 필요합니다."),
    followUps: [
      followUp("이 값으로 전선 굵기 계산", "/tools/electrical/cable-sizing", {
        phase,
        power: roundTo(kWout, 4),
        powerUnit: "kW",
        voltage: roundTo(V, 4),
        pf: roundTo(pf, 4),
        efficiency: roundTo(eta, 4),
      }),
      followUp("차단기 정격 검토", "/tools/electrical/breaker-current", {
        current: roundTo(I, 4),
      }),
      followUp("실측 전류와 비교", "/tools/facility/field-compare", {
        designValue: roundTo(I, 4),
        unit: "A",
      }),
    ],
  });
}

const STARTING_DISCLAIMER =
  "실제 기동전류는 모터 특성, 기동방식, 부하조건 및 제조사 데이터에 따라 달라질 수 있습니다. 가능한 경우 제조사 기동전류 데이터를 사용하세요.";
const ESTIMATE_NOTE = "본 결과는 입력한 기동배수와 배선조건에 따른 추정값입니다.";
const ALLOW_UNREVIEWED = "미검토 — 허용 전압강하 기준을 입력하면 비교할 수 있습니다.";

const METHOD_LABEL: Record<string, string> = {
  dol: "DOL 직입",
  "star-delta": "Y-Δ",
  soft: "소프트스타터",
  vfd: "VFD",
};

export function calculateMotorStarting(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const flc = fields.num("flc", "정격전류");
  const k = fields.num("multiplier", "기동배수");
  const method = input.method ?? "dol";
  fields.requirePositive("flc", "정격전류", flc);
  fields.requirePositive("multiplier", "기동배수", k);
  if (fields.failed()) return fields.fail();

  const methodLabel = METHOD_LABEL[method] ?? method;
  const Istart = flc * k;
  return ok({
    metrics: [
      metric("istart", "예상 기동전류", Istart, "A", precision, { primary: true }),
      metric("k", "적용 배수", k, "×FLC", precision),
      metric("flc", "정격전류", flc, "A", precision),
    ],
    inputSummary: [
      { label: "기동방식", value: methodLabel },
      { label: "기동배수", value: `${roundTo(k, precision)} ×FLC (사용자 입력)` },
    ],
    interpretation: `${methodLabel}에서 사용자 입력 배수 ${roundTo(k, 2)}를 적용하면 기동전류는 ${roundTo(Istart, precision)} A입니다. 이 값은 명판 구속전류·컨트롤러 설정을 대체하지 않습니다.`,
    warnings: [
      warning("info", "기동전류", STARTING_DISCLAIMER),
      warning("error", "보호 정정 아님", "과전류·지락·기동 타이머 정정은 보호협조 검토가 필요합니다."),
    ],
    formulaUsed: "I_start = k × I_FLC",
    steps: [`I_start = ${roundTo(k, 3)} × ${roundTo(flc, precision)} = ${roundTo(Istart, precision)} A`],
    reviewStatus: review("check", "기동배수는 제조사 데이터·명판으로 확인하세요."),
    assumptionsUsed: ["기동배수는 사용자가 입력한 값만 사용합니다. 기동방식별 기본 배수를 넣지 않습니다."],
  });
}

export function calculateMotorStartVoltageDrop(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const phase = input.phase ?? "3";
  const flc = fields.num("flc", "정격전류");
  const k = fields.num("multiplier", "기동배수");
  const length = fields.num("length", "편도 길이 m");
  const rOhmKm = fields.num("resistance", "도체 저항 Ω/km");
  const V = toVolts(fields.num("voltage", "전압"), input.voltageUnit ?? "V");
  fields.requirePositive("flc", "정격전류", flc);
  fields.requirePositive("multiplier", "기동배수", k);
  fields.requirePositive("length", "길이", length);
  fields.requirePositive("resistance", "저항", rOhmKm);
  fields.requirePositive("voltage", "전압", V);

  const allowRaw = fields.raw("allowPct").trim();
  const allow = allowRaw === "" ? NaN : fields.num("allowPct", "허용 전압강하율");
  if (allowRaw !== "" && !fields.errors.allowPct) {
    fields.requirePositive("allowPct", "허용 전압강하율", allow);
  }
  if (fields.failed()) return fields.fail();

  const Istart = flc * k;
  const lengthKm = length / 1000;
  const dV = phase === "1" ? 2 * Istart * lengthKm * rOhmKm : SQRT_3 * Istart * lengthKm * rOhmKm;
  const pct = (dV / V) * 100;
  const vend = V - dV;
  const hasAllow = Number.isFinite(allow) && allow > 0;

  const compareMetrics = hasAllow
    ? [
        metric("allowPct", "입력 허용값", allow, "%", precision),
        {
          id: "compare",
          label: "허용값 비교",
          value:
            pct <= allow
              ? `${roundTo(pct, precision)}% ≤ ${roundTo(allow, precision)}% → 사용자 입력 기준 이하`
              : `${roundTo(pct, precision)}% > ${roundTo(allow, precision)}% → 사용자 입력 기준 초과`,
        },
      ]
    : [{ id: "compare", label: "허용값 비교", value: ALLOW_UNREVIEWED }];

  const status = !hasAllow
    ? review("check", ALLOW_UNREVIEWED)
    : pct <= allow
      ? { kind: "in-range" as const, label: "사용자 입력 기준 이하", note: `${roundTo(pct, precision)}% ≤ ${roundTo(allow, precision)}%` }
      : { kind: "caution" as const, label: "사용자 입력 기준 초과", note: `${roundTo(pct, precision)}% > ${roundTo(allow, precision)}%` };

  return ok({
    metrics: [
      metric("dv", "기동 시 전압강하", dV, "V", precision, { primary: true }),
      metric("pct", "기동 전압강하율", pct, "%", precision),
      metric("vend", "말단 예상전압", vend, "V", precision),
      metric("istart", "기동전류", Istart, "A", precision),
      ...compareMetrics,
    ],
    inputSummary: [
      { label: "회로", value: phase === "1" ? "단상" : "3상" },
      { label: "기동전류", value: `${roundTo(Istart, precision)} A` },
      {
        label: "허용 전압강하",
        value: hasAllow ? `${roundTo(allow, precision)}% (사용자 입력)` : "미입력 · 비교 안 함",
      },
    ],
    interpretation: `저항 근사로 본 기동 전압강하는 ${roundTo(dV, precision)} V (${roundTo(pct, precision)}%), 말단 약 ${roundTo(vend, precision)} V입니다.`,
    warnings: [
      warning("info", "저항 근사", "리액턴스·계통 임피던스·변압기 %Z는 포함하지 않았습니다."),
      warning("warning", "다른 부하", "동일 모선의 조명·제어전원 순간 저전압도 함께 보세요."),
    ],
    formulaUsed: phase === "1" ? "ΔV = 2 × I_start × L × r" : "ΔV = √3 × I_start × L × r",
    steps: [
      `I_start = ${roundTo(flc, precision)} × ${roundTo(k, 2)} = ${roundTo(Istart, precision)} A`,
      phase === "1"
        ? `ΔV = 2 × ${roundTo(Istart, precision)} × ${roundTo(lengthKm, 5)} km × ${roundTo(rOhmKm, 4)} Ω/km`
        : `ΔV = √3 × ${roundTo(Istart, precision)} × ${roundTo(lengthKm, 5)} km × ${roundTo(rOhmKm, 4)} Ω/km`,
      `ΔV = ${roundTo(dV, precision)} V,  % = ΔV / ${roundTo(V, 2)} × 100 = ${roundTo(pct, precision)}%`,
      `V_end = ${roundTo(V, 2)} − ${roundTo(dV, precision)} = ${roundTo(vend, precision)} V`,
    ],
    reviewStatus: status,
  });
}

/**
 * 정격전류 → 기동전류 → (선택) 기동 전압강하.
 * 수학은 calculateMotorCurrent / calculateMotorStarting / calculateMotorStartVoltageDrop을 그대로 호출한다.
 */
export function calculateMotorStartingReview(input: CalcInput, precision: number): CalculationOutcome {
  const flcMode = input.flcMode ?? "known";
  let resolved: CalcInput = { ...input };

  if (flcMode === "from-nameplate") {
    const currentOut = calculateMotorCurrent(input, precision);
    if (!currentOut.ok) return currentOut;
    const flcMetric = currentOut.metrics.find((item) => item.id === "flc");
    resolved = { ...input, flc: String(flcMetric?.value ?? "") };
  }

  const startOut = calculateMotorStarting(resolved, precision);
  if (!startOut.ok) return startOut;

  const appliedK = startOut.metrics.find((item) => item.id === "k");
  const length = Number(input.length);
  const resistance = Number(input.resistance);
  const voltage = Number(input.voltage);
  const wantVd =
    Number.isFinite(length) &&
    length > 0 &&
    Number.isFinite(resistance) &&
    resistance > 0 &&
    Number.isFinite(voltage) &&
    voltage > 0;

  const startWarnings = [...startOut.warnings];

  if (!wantVd) {
    return {
      ...startOut,
      interpretation: `${startOut.interpretation} ${ESTIMATE_NOTE}`,
      warnings: [
        ...startWarnings,
        warning(
          "info",
          "기동 전압강하",
          "배선 길이·도체 저항·전압을 넣으면 기존 저항 근사로 기동 시 전압강하를 함께 봅니다.",
        ),
      ],
    };
  }

  const vdOut = calculateMotorStartVoltageDrop(
    {
      ...resolved,
      multiplier: appliedK ? String(appliedK.value) : resolved.multiplier,
      phase: input.phase ?? "3",
      length: input.length,
      resistance: input.resistance,
      voltage: input.voltage,
      voltageUnit: input.voltageUnit,
      allowPct: input.allowPct,
    },
    precision,
  );
  if (!vdOut.ok) return vdOut;

  return ok({
    metrics: [
      ...startOut.metrics.map((item) => (item.id === "istart" ? { ...item, primary: false } : item)),
      ...vdOut.metrics.filter((item) => item.id !== "istart"),
    ],
    inputSummary: [...startOut.inputSummary, ...vdOut.inputSummary.filter((row) => row.label !== "기동전류")],
    interpretation: `${startOut.interpretation} ${vdOut.interpretation} ${ESTIMATE_NOTE}`,
    warnings: [...startWarnings, ...vdOut.warnings],
    formulaUsed: `${startOut.formulaUsed}. ${vdOut.formulaUsed}`,
    steps: [...(startOut.steps ?? []), ...(vdOut.steps ?? [])],
    reviewStatus: vdOut.reviewStatus,
    assumptionsUsed: [...(startOut.assumptionsUsed ?? []), ...(vdOut.assumptionsUsed ?? [])],
    followUps: [
      followUp("정상 운전 전압강하", "/tools/electrical/voltage-drop", {
        phase: input.phase ?? "3",
        current: String(startOut.metrics.find((item) => item.id === "flc")?.value ?? ""),
        voltage: input.voltage,
        length: input.length,
        rMode: "ohm",
        resistance: input.resistance,
      }),
    ],
  });
}

export function calculateMotorAcceleration(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const J = fields.num("inertia", "관성모멘트 J kg·m²");
  const rpm = fields.num("rpm", "정격 회전수");
  const tAcc = fields.num("torque", "평균 가속 토크 N·m");
  fields.requirePositive("inertia", "관성모멘트", J);
  fields.requirePositive("rpm", "회전수", rpm);
  fields.requirePositive("torque", "가속 토크", tAcc);
  if (fields.failed()) return fields.fail();

  const omega = (rpm * 2 * Math.PI) / 60;
  const t = (J * omega) / tAcc;

  return ok({
    metrics: [
      metric("time", "가속시간 추정", t, "s", Math.max(precision, 2), { primary: true }),
      metric("omega", "각속도", omega, "rad/s", precision),
    ],
    inputSummary: [
      { label: "J", value: `${J} kg·m²` },
      { label: "N", value: `${rpm} r/min` },
      { label: "T_acc", value: `${tAcc} N·m` },
    ],
    interpretation: `일정 가속 토크 가정 시 t = Jω / T_acc ≈ ${roundTo(t, precision)} s입니다. 부하 토크 곡선·전압강하를 무시합니다.`,
    warnings: [
      warning("warning", "단순 모델", "실제 가속은 토크-속도 곡선, 전압, 유체 부하에 따라 달라집니다."),
    ],
    formulaUsed: "t = J × ω / T_acc,  ω = 2πn / 60",
    steps: [
      `ω = 2π × ${rpm} / 60 = ${roundTo(omega, precision)} rad/s`,
      `t = ${J} × ${roundTo(omega, precision)} / ${tAcc} = ${roundTo(t, precision)} s`,
    ],
    reviewStatus: review("check", "명판·부하 관성 데이터가 있으면 그 값을 우선하세요."),
  });
}
