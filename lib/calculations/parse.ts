import type { CalculationResult, ReviewKind, ReviewStatus } from "@/lib/types";
import { fail, metric, warning } from "@/lib/calculations/helpers";
import { parseNumber } from "@/lib/math/validate";
import { roundTo } from "@/lib/math/round";

export type CalcInput = Record<string, string>;

export class FieldBag {
  readonly errors: Record<string, string> = {};

  constructor(private readonly input: CalcInput) {}

  raw(id: string): string {
    return this.input[id] ?? "";
  }

  num(id: string, label: string): number {
    try {
      return parseNumber(this.input[id], label);
    } catch (error) {
      this.errors[id] = error instanceof Error ? error.message : `${label}을(를) 확인하세요.`;
      return NaN;
    }
  }

  optional(id: string, fallback: number, label = id): number {
    const raw = this.input[id];
    if (raw === undefined || raw.trim() === "") return fallback;
    try {
      return parseNumber(raw, label);
    } catch (error) {
      this.errors[id] = error instanceof Error ? error.message : `${label}을(를) 확인하세요.`;
      return fallback;
    }
  }

  requirePositive(id: string, label: string, value: number) {
    if (this.errors[id]) return;
    if (!(value > 0) || !Number.isFinite(value)) {
      this.errors[id] = `${label}은(는) 0보다 커야 합니다.`;
    }
  }

  requireNonNegative(id: string, label: string, value: number) {
    if (this.errors[id]) return;
    if (!(value >= 0) || !Number.isFinite(value)) {
      this.errors[id] = `${label}은(는) 0 이상이어야 합니다.`;
    }
  }

  requireUnitInterval(id: string, label: string, value: number) {
    if (this.errors[id]) return;
    if (!(value > 0 && value <= 1)) {
      this.errors[id] = `${label}은(는) 0 초과 1 이하여야 합니다.`;
    }
  }

  failed() {
    return Object.keys(this.errors).length > 0;
  }

  fail(formError?: string) {
    return fail(this.errors, formError);
  }
}

export function ok(value: Omit<CalculationResult, "ok">): CalculationResult {
  return { ok: true, ...value };
}

export function review(kind: ReviewKind, note: string): ReviewStatus {
  const label = kind === "in-range" ? "검토 범위 내" : kind === "check" ? "추가 확인 필요" : "주의";
  return { kind, label, note };
}

export { metric, warning, roundTo };
