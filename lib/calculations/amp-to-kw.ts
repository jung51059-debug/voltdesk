import type { CalculationOutcome, CalculationResult } from "@/lib/types";
import { fail, metric, warning } from "@/lib/calculations/helpers";
import { SQRT_3, toVolts } from "@/lib/math/units";
import { parseNumber } from "@/lib/math/validate";
import { formatNumber, roundTo } from "@/lib/math/round";

const INPUT_LIMIT = 1e12;

export const AMP_TO_KW_NOTICE =
  "이 결과는 입력한 전압·전류·역률을 이용한 전력 계산값입니다. 특정 차단기의 허용 부하나 안전 사용 가능 여부를 판정하는 값이 아닙니다.";

type CalcInput = Record<string, string | undefined>;

function result(value: Omit<CalculationResult, "ok">): CalculationResult {
  return { ok: true, ...value };
}

/** kW는 소수 둘째 자리까지 보여 줍니다. 반올림은 다른 계산기와 같은 roundTo입니다. */
export function formatFixedKw(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return roundTo(value, 2).toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 단상 P = V × I × PF, 3상 P = √3 × V × I × PF. 효율은 넣지 않습니다. */
export function ampToWatts(phase: "1" | "3", voltage: number, current: number, pf: number): number {
  const base = voltage * current * pf;
  return phase === "3" ? SQRT_3 * base : base;
}

export function calculateAmpToKw(input: CalcInput, precision: number): CalculationOutcome {
  const phase = input.phase === "3" ? "3" : "1";
  const fieldErrors: Record<string, string> = {};
  let voltage = 0;
  let current = 0;
  let pf = 0;

  try {
    voltage = toVolts(parseNumber(input.voltage, "전압"), input.voltageUnit || "V");
    if (!(voltage > 0)) fieldErrors.voltage = "전압은 0보다 커야 합니다.";
    else if (voltage > INPUT_LIMIT) fieldErrors.voltage = "전압이 허용 범위를 초과했습니다.";
  } catch (error) {
    fieldErrors.voltage = error instanceof Error ? error.message : "전압을 확인하세요.";
  }

  try {
    current = parseNumber(input.current, "전류");
    if (!(current > 0)) fieldErrors.current = "전류는 0보다 커야 합니다.";
    else if (current > INPUT_LIMIT) fieldErrors.current = "전류가 허용 범위를 초과했습니다.";
  } catch (error) {
    fieldErrors.current = error instanceof Error ? error.message : "전류를 확인하세요.";
  }

  try {
    pf = parseNumber(input.pf, "역률");
    if (!(pf > 0) || pf > 1) fieldErrors.pf = "역률은 0 초과 1 이하여야 합니다.";
  } catch (error) {
    fieldErrors.pf = error instanceof Error ? error.message : "역률을 확인하세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fail(fieldErrors, "입력값을 확인한 뒤 다시 계산하세요.");
  }

  const watts = ampToWatts(phase, voltage, current, pf);
  if (!Number.isFinite(watts) || watts > INPUT_LIMIT) {
    return fail(
      { current: "계산 결과가 너무 큽니다. 전압과 전류를 확인하세요." },
      "계산 결과가 너무 큽니다. 전압과 전류를 확인하세요.",
    );
  }

  const kw = watts / 1000;
  const voltageText = formatNumber(voltage, precision);
  const currentText = formatNumber(current, precision);
  const pfText = roundTo(pf, 2).toLocaleString("ko-KR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const wattText = formatNumber(watts, precision);
  const kwText = formatFixedKw(kw);
  const formula = phase === "3" ? "P = √3 × V × I × PF" : "P = V × I × PF";
  const product = phase === "3" ? `√3 × ${voltageText} × ${currentText} × ${pfText}` : `${voltageText} × ${currentText} × ${pfText}`;

  return result({
    metrics: [
      {
        id: "kw",
        label: "예상 전력",
        value: kwText,
        unit: "kW",
        primary: true,
        hint: AMP_TO_KW_NOTICE,
      },
      metric("power", "예상 전력", watts, "W", precision),
    ],
    inputSummary: [
      { label: "전원", value: phase === "3" ? "3상" : "단상" },
      { label: "전압", value: `${voltageText} V` },
      { label: "전류", value: `${currentText} A` },
      { label: "역률", value: pfText },
    ],
    interpretation: `${AMP_TO_KW_NOTICE} 실제 회로 설계 및 검토에서는 부하 특성, 차단기 정격, 케이블 허용전류, 설치조건 등을 함께 확인해야 합니다.`,
    warnings: [
      warning("info", "전력 환산", AMP_TO_KW_NOTICE),
      warning(
        "info",
        "회로 검토",
        "실제 회로 설계 및 검토에서는 부하 특성, 차단기 정격, 케이블 허용전류, 설치조건 등을 함께 확인해야 합니다.",
      ),
    ],
    formulaUsed: formula,
    steps: [formula, `${product} = ${wattText} W`, `${wattText} W = ${kwText} kW`],
    assumptionsUsed: [
      "효율은 넣지 않습니다. 입력 전류와 전압에서 전기 입력 유효전력을 계산합니다.",
      "역률 1.0은 단순 환산입니다. 실제 교류 부하는 역률이 1이 아닐 수 있습니다.",
    ],
    nextChecks: ["부하전류", "차단기 정격", "케이블 허용전류", "설치조건", "부하 특성과 기동전류"],
  });
}
