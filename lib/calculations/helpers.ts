import type { CalculationFailure, CalculationResult, EngineeringWarning, ResultMetric } from "@/lib/types";
import { FieldError } from "@/lib/math/validate";
import { formatNumber } from "@/lib/math/round";

export function fail(fieldErrors: Record<string, string>, formError?: string): CalculationFailure {
  return { ok: false, fieldErrors, formError };
}

export function fromFieldError(error: FieldError, fieldId: string): CalculationFailure {
  return fail({ [fieldId]: error.message });
}

export function catchCompute(fn: () => CalculationResult): CalculationResult | CalculationFailure {
  try {
    return fn();
  } catch (error) {
    if (error instanceof FieldError) {
      return fail({ _form: error.message }, error.message);
    }
    if (error instanceof Error) {
      return fail({}, error.message);
    }
    return fail({}, "계산 중 오류가 발생했습니다.");
  }
}

export function metric(
  id: string,
  label: string,
  value: number,
  unit: string,
  precision: number,
  extra?: Partial<ResultMetric>,
): ResultMetric {
  return {
    id,
    label,
    value: formatNumber(value, precision),
    unit,
    ...extra,
  };
}

export function warning(
  level: EngineeringWarning["level"],
  title: string,
  message: string,
): EngineeringWarning {
  return { level, title, message };
}
