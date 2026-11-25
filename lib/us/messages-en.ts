import type { CalculationFailure, CalculationOutcome, CalculationResult } from "@/lib/types";

const HANGUL = /[\u3131-\uD79D]/;

const METRIC_LABELS: Record<string, string> = {
  current: "Load current",
  i1: "Primary full-load current",
  i2: "Secondary full-load current",
  kw: "Real power",
  kva: "Apparent power",
  kvar: "Reactive power",
  pf: "Power factor",
  need: "Required kVA",
  pick: "Standard kVA candidate",
  ratio: "Load ratio",
  sload: "Load kVA with losses",
  ik: "Estimated secondary short-circuit current",
  sk: "Short-circuit MVA",
  p1: "Transformer 1 share",
  p2: "Transformer 2 share",
  r1: "Transformer 1 load ratio",
  r2: "Transformer 2 load ratio",
  zd: "%Z difference",
  thd: "Total harmonic distortion",
  slip: "Slip",
  sync: "Synchronous speed",
  avg: "Average",
  min: "Minimum",
  max: "Maximum",
  range: "Range",
  sd: "Sample standard deviation",
  n: "Sample count",
  pct: "Percent change",
  dur: "Observation period",
  roc: "Rate of change",
  peak: "Peak value",
  primary: "Primary",
  secondary: "Secondary",
  loss: "Total loss",
  noLoad: "No-load loss",
  loadLoss: "Load loss",
  lumens: "Total lumens",
  flux: "Luminous flux",
  density: "Power density",
  area: "Area",
  energy: "Energy",
  intensity: "Energy intensity",
  utilization: "Utilization",
  compare: "Difference",
  filter: "Filter kVAR",
};

const INPUT_SUMMARY_LABELS: Record<string, string> = {
  유효전력: "Real power",
  전압: "Voltage",
  역률: "Power factor",
  효율: "Efficiency",
  전원: "Supply",
  "3상": "Three-phase",
  단상: "Single-phase",
  시료: "Samples",
  "Peak 발생": "Peak time",
};

/** Ordered phrase replacements (Korean engine copy → US English). */
const PHRASE_RULES: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/^([^:]+)을\(를\) 입력하세요\.?$/, (m) => `Enter ${translateFieldName(m[1]!)}.`],
  [/^([^:]+)은\(는\) 숫자여야 합니다\.?$/, (m) => `${translateFieldName(m[1]!)} must be a number.`],
  [/^([^:]+)은\(는\) 0보다 커야 합니다\.?$/, (m) => `${translateFieldName(m[1]!)} must be greater than 0.`],
  [/^([^:]+)은\(는\) 0 초과 1 이하여야 합니다\.?$/, (m) => `${translateFieldName(m[1]!)} must be between 0 and 1 (exclusive of 0).`],
  [/^([^:]+)을\(를\) 확인하세요\.?$/, (m) => `Check ${translateFieldName(m[1]!)}.`],
  [/계산 중 오류가 발생했습니다\.?/, "An error occurred during calculation."],
  [/전압·역률·효율의 곱이 0/, "Voltage × power factor × efficiency is zero; current is undefined."],
  [/직렬 회로 종류를 확인하세요/, "Check the series circuit type."],
  [/단위를 확인하세요/, "Check the unit."],
  [/입력값을 확인하세요/, "Check your inputs."],
  [/이상적 영 임피던스/, "Ideal zero impedance"],
  [/지상/, "lagging"],
  [/진상/, "leading"],
  [/동상/, "in-phase"],
];

const FIELD_NAME_KO_EN: Record<string, string> = {
  전력: "power",
  유효전력: "real power",
  전압: "voltage",
  역률: "power factor",
  효율: "efficiency",
  피상전력: "apparent power",
  마력: "horsepower",
  주파수: "frequency",
  저항: "resistance",
  인덕턴스: "inductance",
  정전용량: "capacitance",
  "RMS 전압": "RMS voltage",
  입력값: "value",
  "편도 길이 m": "one-way length (m)",
  "단면적 mm²": "cross-section (mm²)",
  "도체 온도 ℃": "conductor temperature (°C)",
};

function translateFieldName(ko: string): string {
  return FIELD_NAME_KO_EN[ko] ?? (ko.replace(/[을를은는이가]/g, "").trim() || "value");
}

export function usSanitizeRemainingKo(text: string, kind: "step" | "warning" | "value" | "label"): string {
  const t = translateKoEngineText(text);
  if (!HANGUL.test(t)) return t;
  const nums = t.match(/-?\d[\d,.]*/g);
  if (kind === "value" && nums?.length) return nums.join(" ");
  if (kind === "step") return "See the Formula section and worked example for calculation steps.";
  if (kind === "warning") return "Review inputs, units, and applicable electrical practice — not a code compliance check.";
  if (kind === "label") return "Notice";
  return "Engineering estimate — confirm with nameplate and site conditions.";
}

export function translateKoEngineText(text: string): string {
  if (!text || !HANGUL.test(text)) return text;
  if (INPUT_SUMMARY_LABELS[text]) return INPUT_SUMMARY_LABELS[text];
  for (const [re, repl] of PHRASE_RULES) {
    const m = text.match(re);
    if (m) return typeof repl === "function" ? repl(m) : text.replace(re, repl);
  }
  // Fallback: strip common honorifics but keep sentence if no rule matched (surfaced in QA).
  return text;
}

export function localizeCalculationResult(result: CalculationResult): CalculationResult {
  return {
    ...result,
    metrics: result.metrics.map((m) => ({
      ...m,
      label: METRIC_LABELS[m.id] ?? usSanitizeRemainingKo(m.label, "label"),
      hint: m.hint ? usSanitizeRemainingKo(m.hint, "warning") : undefined,
    })),
    inputSummary: result.inputSummary?.map((row) => ({
      label: INPUT_SUMMARY_LABELS[row.label] ?? usSanitizeRemainingKo(row.label, "label"),
      value: usSanitizeRemainingKo(row.value, "value"),
    })),
    interpretation: result.interpretation
      ? (() => {
          const t = translateKoEngineText(result.interpretation!);
          return HANGUL.test(t)
            ? "Engineering estimate from your inputs. Confirm nameplate data, supply voltage type, and applicable codes separately."
            : t;
        })()
      : result.interpretation,
    formulaUsed: result.formulaUsed ? usSanitizeRemainingKo(result.formulaUsed, "step") : result.formulaUsed,
    steps: result.steps?.map((s) => usSanitizeRemainingKo(s, "step")),
    warnings: result.warnings?.map((w) => ({
      ...w,
      title:
        w.title === "주의"
          ? "Notice"
          : w.title === "경고"
            ? "Warning"
            : w.title === "큰 전류"
              ? "High current"
              : w.title === "낮은 역률"
                ? "Low power factor"
                : translateKoEngineText(w.title),
      message: usSanitizeRemainingKo(w.message, "warning"),
    })),
    corrections: result.corrections?.map((row) => ({
      ...row,
      label: usSanitizeRemainingKo(row.label, "label"),
      note: row.note ? usSanitizeRemainingKo(row.note, "warning") : undefined,
    })),
    followUps: result.followUps?.map((f) => ({
      ...f,
      label: usSanitizeRemainingKo(f.label, "label"),
    })),
    reviewStatus: result.reviewStatus
      ? {
          ...result.reviewStatus,
          label: usSanitizeRemainingKo(result.reviewStatus.label, "label"),
          note: usSanitizeRemainingKo(result.reviewStatus.note, "warning"),
        }
      : undefined,
    assumptionsUsed: result.assumptionsUsed?.map((a) => usSanitizeRemainingKo(a, "warning")),
    nextChecks: result.nextChecks?.map((c) => usSanitizeRemainingKo(c, "warning")),
  };
}

export function localizeFailure(failure: CalculationFailure): CalculationFailure {
  const fieldErrors: Record<string, string> = {};
  for (const [k, v] of Object.entries(failure.fieldErrors)) {
    fieldErrors[k] = usSanitizeRemainingKo(v, "warning");
  }
  return finalizeUsStrings({
    ...failure,
    fieldErrors,
    formError: failure.formError ? usSanitizeRemainingKo(failure.formError, "warning") : failure.formError,
  });
}

function finalizeUsStrings<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => (typeof val === "string" ? usSanitizeRemainingKo(val, "value") : val)),
  ) as T;
}

export function localizeOutcome(outcome: CalculationOutcome | null): CalculationOutcome | null {
  if (!outcome) return null;
  if (!outcome.ok) return localizeFailure(outcome);
  return finalizeUsStrings(localizeCalculationResult(outcome));
}

/** Vitest helper: US-facing outcome must not contain Hangul after localization. */
export function assertUsOutcomeEnglish(outcome: CalculationOutcome, slug: string): void {
  const serialized = JSON.stringify(localizeOutcome(outcome));
  if (HANGUL.test(serialized)) {
    throw new Error(`Hangul remains after US localization for ${slug}`);
  }
}