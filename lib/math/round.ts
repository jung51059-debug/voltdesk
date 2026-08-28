/** Deterministic rounding used by all calculators. */
export function roundTo(value: number, precision: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatNumber(value: number, precision: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return roundTo(value, precision).toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

export function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
