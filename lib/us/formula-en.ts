import type { FormulaDefinition } from "@/lib/types";
import { translateKoEngineText, usSanitizeRemainingKo } from "@/lib/us/messages-en";

const HANGUL = /[\u3131-\uD79D]/;

/** Korean variable descriptions from shared FormulaDefinition → US guide copy. */
const VARIABLE_DESCRIPTION_EN: Record<string, string> = {
  "계산된 선전류": "Calculated line current",
  "부하의 유효전력": "Load real power",
  "상전압 또는 사용 전압": "Line-to-neutral or applied voltage",
  "0 초과 1 이하의 역률": "Power factor strictly between 0 and 1",
  "모터 등 효율. 단순 부하는 1": "Motor or drive efficiency; use 1 for resistive loads",
  "선간전압 (Y 또는 Δ)": "Line-to-line voltage (wye or delta)",
  "√3 계수 포함 3상": "Three-phase with √3 factor",
  "선택 회로에 포함된 소자만 반영": "Only elements in the selected circuit",
  "SI 환산 후 계산": "Converted to SI units before calculation",
  "포함 시 양수": "Positive when present in the circuit",
  "전원 RMS 전압": "Source RMS voltage",
  "20℃ 대표 고유저항": "Representative resistivity at 20 °C",
  "직류저항 온도계수": "DC resistance temperature coefficient",
  "편도 길이": "One-way conductor length",
  "단위 인덕턴스": "Inductance per unit length",
  "0.25는 예시값이며 제조사 사양이 아님": "0.25 mH/km is an example, not a manufacturer spec",
};

const SYMBOL_HINT_EN: Record<string, string> = {
  I: "Electric current",
  P: "Real power",
  V: "Voltage",
  PF: "Power factor",
  η: "Efficiency",
  R: "Resistance",
  L: "Inductance",
  C: "Capacitance",
  S: "Apparent power",
  Q: "Reactive power",
  f: "Frequency",
  Z: "Impedance magnitude",
  X: "Reactance",
  θ: "Phase angle",
  kVA: "Apparent power",
  kW: "Real power",
  kvar: "Reactive power",
};

const FORMULA_EXPRESSION_EN: Record<string, string> = {
  "I = P / (V × PF × η)": "I = P / (V × PF × η)",
  "단상 P = V × I × PF, 3상 P = √3 × V × I × PF":
    "Single-phase P = V × I × PF; three-phase P = √3 × V × I × PF",
  "부하율(%) = (S_load / S_rated) × 100, S_load = P / PF":
    "Load ratio (%) = (S_load / S_rated) × 100; S_load = P / PF",
  "편차% = (실측 − 설계) / 설계 × 100": "Deviation % = (measured − design) / design × 100",
  "ΔE = P0 t0 − P1 t1, Payback = 투자 / 연간절감":
    "ΔE = P₀×t₀ − P₁×t₁; simple payback = investment / annual savings",
  "부하율=Pavg/Prated, 가동률=trun/tperiod": "Load factor = P_avg/P_rated; duty = t_run/t_period",
  "원단위 = kWh / 활동량": "Energy intensity = kWh / activity units",
  "평균, 최소, 최대, 표본표준편차, 변화율": "Mean, min, max, sample standard deviation, percent change",
};

function localizeFormulaExpression(expr: string): string {
  if (!expr || !HANGUL.test(expr)) return expr;
  if (FORMULA_EXPRESSION_EN[expr]) return FORMULA_EXPRESSION_EN[expr];
  return expr
    .replace(/단상/g, "Single-phase")
    .replace(/3상/g, "Three-phase")
    .replace(/실측/g, "measured")
    .replace(/설계/g, "design")
    .replace(/투자/g, "investment")
    .replace(/연간절감/g, "annual savings")
    .replace(/부하율/g, "Load factor")
    .replace(/가동률/g, "duty")
    .replace(/활동량/g, "activity")
    .replace(/사용자/g, "user")
    .replace(/원단위/g, "Energy intensity");
}

export function localizeSymbol(symbol: string): string {
  let s = symbol
    .replace(/\(사용자\)/g, "(user)")
    .replace(/사용자/g, "user")
    .replace(/또는/g, "or")
    .replace(/동일/g, "same")
    .replace(/활동량/g, "Activity");
  if (HANGUL.test(s)) s = usSanitizeRemainingKo(s, "label");
  return s;
}

export function localizeVariableDescription(variable: {
  symbol: string;
  description?: string;
  name?: string;
}): string {
  const raw = variable.description?.trim() || variable.name?.trim() || "";
  if (!raw) return SYMBOL_HINT_EN[variable.symbol] ?? variable.symbol;
  if (VARIABLE_DESCRIPTION_EN[raw]) return VARIABLE_DESCRIPTION_EN[raw];
  const translated = translateKoEngineText(raw);
  if (!HANGUL.test(translated)) return translated;
  return SYMBOL_HINT_EN[variable.symbol] ?? usSanitizeRemainingKo(raw, "step");
}

export function localizeFormulaForUs(formula: FormulaDefinition): FormulaDefinition {
  return {
    ...formula,
    formula: localizeFormulaExpression(formula.formula),
    variables: formula.variables.map((v) => ({
      ...v,
      symbol: localizeSymbol(v.symbol),
      unit: v.unit ? localizeSymbol(String(v.unit)) : v.unit,
      description: localizeVariableDescription(v),
    })),
  };
}