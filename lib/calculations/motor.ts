import { SQRT_3, WATTS_PER_HP, toVolts, toWatts } from "@/lib/math/units";
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

export function calculateMotorStarting(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const flc = fields.num("flc", "정격전류");
  const method = input.method ?? "dol";
  const kUser = fields.optional("multiplier", NaN, "기동배수");
  fields.requirePositive("flc", "정격전류", flc);
  if (fields.failed()) return fields.fail();

  const typical: Record<string, { k: number; label: string; range: string }> = {
    dol: { k: 6, label: "DOL 직입", range: "통상 5~8배 참고" },
    "star-delta": { k: 2, label: "Y-Δ", range: "이론상 DOL 전류의 약 1/3, 현장은 1.5~2.5배 참고" },
    soft: { k: 3, label: "소프트스타터", range: "설정 전류 제한값. 기본 3배는 예시" },
    vfd: { k: 1.2, label: "VFD", range: "가속 전류는 보통 FLC 근처~1.5배" },
  };
  const spec = typical[method] ?? typical.dol;
  const k = Number.isFinite(kUser) && kUser > 0 ? kUser : spec.k;
  if (Number.isFinite(kUser) && kUser <= 0) {
    return fields.fail("기동배수는 0보다 커야 합니다.");
  }

  const Istart = flc * k;
  return ok({
    metrics: [
      metric("istart", "예상 기동전류", Istart, "A", precision, { primary: true }),
      metric("k", "적용 배수", k, "×FLC", precision),
      metric("flc", "정격전류", flc, "A", precision),
    ],
    inputSummary: [
      { label: "기동방식", value: spec.label },
      { label: "배수 출처", value: Number.isFinite(kUser) && kUser > 0 ? "사용자 입력" : `참고값 (${spec.range})` },
    ],
    interpretation: `${spec.label}에서 배수 ${roundTo(k, 2)}를 적용하면 기동전류는 ${roundTo(Istart, precision)} A입니다. 이 값은 명판 구속전류·컨트롤러 설정을 대체하지 않습니다.`,
    warnings: [
      warning("warning", "참고 배수", spec.range + ". 제조사 데이터나 소프트스타터/VFD 설정값이 있으면 그 값을 입력하세요."),
      warning("error", "보호 정정 아님", "과전류·지락·기동 타이머 정정은 보호협조 검토가 필요합니다."),
    ],
    formulaUsed: "I_start = k × I_FLC",
    steps: [`I_start = ${roundTo(k, 3)} × ${roundTo(flc, precision)} = ${roundTo(Istart, precision)} A`],
    reviewStatus: review("check", "기동배수는 실측·명판으로 확인하세요."),
    assumptionsUsed: ["사용자가 배수를 넣지 않으면 방식별 흔한 참고 배수를 씁니다. 규정 표가 아닙니다."],
  });
}

export function calculateMotorStartVoltageDrop(input: CalcInput, precision: number): CalculationOutcome {
  const fields = new FieldBag(input);
  const phase = input.phase ?? "3";
  const flc = fields.num("flc", "정격전류");
  const k = fields.optional("multiplier", 6, "기동배수");
  const length = fields.num("length", "편도 길이 m");
  const rOhmKm = fields.num("resistance", "도체 저항 Ω/km");
  const V = toVolts(fields.num("voltage", "전압"), input.voltageUnit ?? "V");
  fields.requirePositive("flc", "정격전류", flc);
  fields.requirePositive("multiplier", "기동배수", k);
  fields.requirePositive("length", "길이", length);
  fields.requirePositive("resistance", "저항", rOhmKm);
  fields.requirePositive("voltage", "전압", V);
  if (fields.failed()) return fields.fail();

  const Istart = flc * k;
  const lengthKm = length / 1000;
  const dV = phase === "1" ? 2 * Istart * lengthKm * rOhmKm : SQRT_3 * Istart * lengthKm * rOhmKm;
  const pct = (dV / V) * 100;
  const vend = V - dV;
  const allow = fields.optional("allowPct", 15, "허용 전압강하율");

  let status = review("check", "기동 전압강하는 모터 토크와 다른 부하에 영향을 줍니다. 프로젝트 허용치를 확인하세요.");
  if (allow > 0 && pct <= allow) {
    status = review("in-range", `사용자 허용 ${roundTo(allow, 1)}% 이하입니다. 규정 합격 판정이 아닙니다.`);
  } else if (allow > 0 && pct > allow) {
    status = review("caution", `사용자 허용 ${roundTo(allow, 1)}%를 초과합니다.`);
  }

  return ok({
    metrics: [
      metric("dv", "기동 시 전압강하", dV, "V", precision, { primary: true }),
      metric("pct", "전압강하율", pct, "%", precision),
      metric("vend", "말단 예상전압", vend, "V", precision),
      metric("istart", "기동전류", Istart, "A", precision),
    ],
    inputSummary: [
      { label: "회로", value: phase === "1" ? "단상" : "3상" },
      { label: "기동전류", value: `${roundTo(Istart, precision)} A` },
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
