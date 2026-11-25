import { translateKoEngineText, usSanitizeRemainingKo } from "@/lib/us/messages-en";

const HANGUL = /[\u3131-\uD79D]/;

/** Exact Korean UI strings → US English (Group A form fields). */
const EXACT: Record<string, string> = {
  단상: "Single-phase",
  "3상": "Three-phase",
  "전기 입력 kW입니다. 모터 축출력이면 상세 조건의 효율로 나눕니다.":
    "Enter electrical input in kW. For motor shaft output, divide by efficiency in advanced inputs.",
  "3상 선간전압 (예: 380 V)": "Three-phase line-to-line voltage (e.g. 208 V, 240 V, or 480 V)",
  "단상은 사용 전압, 3상은 선간전압입니다. 기본은 단상 220 V, 3상 380 V입니다.":
    "Single-phase: line-to-neutral voltage. Three-phase: line-to-line voltage. US defaults: 120 V and 208 V.",
  "환산할 전류입니다. 이 값으로 차단기 허용 부하를 정하지 않습니다.":
    "Current to convert. This does not size breakers or conductors by itself.",
  "유효전력(kW)에서 환산": "Convert from real power (kW)",
  "피상전력(kVA)에서 환산": "Convert from apparent power (kVA)",
  "마력(HP)에서 환산": "Convert from horsepower (HP)",
  "kW와 kVA": "Compare kW and kVA",
  "유효전력과 전압·전류": "Real power vs voltage and current",
  "P와 S": "Given P and S",
  "P와 Q": "Given P and Q",
  "P와 PF": "Given P and power factor",
  "계산 방향": "Calculation direction",
  "기본은 회전수 → 슬립입니다. 슬립을 알면 역산을 고르세요.":
    "Default: speed → slip. Choose inverse if you know slip instead.",
  "실제 회전수로 슬립 계산": "Compute slip from actual speed",
  "슬립률로 실제 회전수 역산": "Back-calculate speed from slip",
  "모터+부하 환산 관성": "Combined motor + load inertia (converted)",
  "설계 계산 · kW + 역률": "Design path: kW and power factor",
  "설계 계산 · kVA": "Design path: kVA",
  "현장 측정 · 전압·전류": "Field measurement: voltage and current",
  "Ω를 구하거나 입력하는 측의 전압입니다. 상전압을 넣지 마세요.":
    "Voltage on the side where you enter or solve ohms — not line-to-neutral on three-phase.",
  "100, 200, 400 등": "Common ratios such as 100, 200, 400",
  "사용자 허용 전류밀도 A/mm² (경험값)": "User allowable current density (A/mm²)",
  "표준 허용전류표가 아닙니다.": "Not a standard ampacity table.",
  "등기구 광속 lm *": "Lamp lumens (lm)",
  "평균 단가 원/kWh": "Average energy cost (your currency/kWh)",
  "계통연계": "Grid-tied",
  독립형: "Off-grid",
  하이브리드: "Hybrid",
  "일일 사용전력 kWh *": "Daily energy use (kWh)",
  "항목명": "Item name",
  "설계값 / 기준값 *": "Design or reference value",
  "실측값 *": "Measured value",
  "비우면 관찰기간 − ON. IEC 60034 Duty Type이 아닙니다.":
    "If blank, OFF = observation period − ON. Not IEC 60034 duty classification.",
  "기존 에너지 단가 원/kWh (사용자)": "Baseline energy cost (your tariff)",
  "분모 단위 이름": "Denominator unit name",
  "단상 P = V × I × PF, 3상 P = √3 × V × I × PF":
    "Single-phase P = V × I × PF; three-phase P = √3 × V × I × PF",
};

const TOKEN_PAIRS: [string | RegExp, string][] = [
  [/유효전력/g, "Real power"],
  [/피상전력/g, "Apparent power"],
  [/역률/g, "Power factor"],
  [/선간전압/g, "Line-to-line voltage"],
  [/상전압/g, "Line-to-neutral voltage"],
  [/전원 방식/g, "Supply type"],
  [/전류/g, "Current"],
  [/전압/g, "Voltage"],
  [/효율/g, "Efficiency"],
  [/부하/g, "Load"],
  [/변압기/g, "Transformer"],
  [/모터/g, "Motor"],
  [/정격/g, "Rated"],
  [/구분/g, "Quantity type"],
  [/용도/g, "Application"],
  [/계측/g, "Metering"],
  [/병렬/g, "Parallel"],
  [/관찰기간/g, "Observation period"],
  [/기동횟수/g, "Starts per period"],
  [/생산/g, "Production"],
];

export const OPTION_VALUE_LABELS: Record<string, string> = {
  "1": "Single-phase",
  "3": "Three-phase",
  "from-kw": "From real power (kW)",
  "from-kva": "From apparent power (kVA)",
  "from-hp": "From horsepower (HP)",
  "v-thd": "Voltage THD",
  "i-thd": "Current THD",
  forward: "Speed → slip",
  inverse: "Slip → speed",
  measure: "Measured V and I",
  "design_kw": "Design (kW + PF)",
  "design_kva": "Design (kVA)",
  cu: "Copper",
  al: "Aluminum",
  grid: "Grid-tied",
  offgrid: "Off-grid",
  hybrid: "Hybrid",
};

export function localizeSchemaText(text: string | undefined, kind: "label" | "hint" | "option" = "label"): string | undefined {
  if (!text) return text;
  if (!HANGUL.test(text)) return text;
  if (EXACT[text]) return EXACT[text];
  let out = text;
  for (const [from, to] of TOKEN_PAIRS) {
    out = typeof from === "string" ? out.split(from).join(to) : out.replace(from, to);
  }
  if (!HANGUL.test(out)) return out.replace(/\s+/g, " ").trim();
  const translated = translateKoEngineText(out);
  if (!HANGUL.test(translated)) return translated;
  return usSanitizeRemainingKo(text, kind === "hint" ? "warning" : "label");
}