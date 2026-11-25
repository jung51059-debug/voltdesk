/** Hand-derived reference values (not calling Ampory engines). */

const SQRT3 = Math.sqrt(3);

export function refSinglePhaseCurrentKw(pKw: number, v: number, pf: number, eta: number): number {
  const P = pKw * 1000;
  return P / (v * pf * eta);
}

export function refThreePhaseCurrentKw(pKw: number, vLine: number, pf: number, eta: number): number {
  const P = pKw * 1000;
  return P / (SQRT3 * vLine * pf * eta);
}

/** Transformer rated currents: I = S / (√3 V) for 3-wire kVA notation used in engine. */
export function refTransformerCurrents(kva: number, vPrimary: number, vSecondary: number) {
  const I1 = (kva * 1000) / (SQRT3 * vPrimary);
  const I2 = (kva * 1000) / (SQRT3 * vSecondary);
  return { I1, I2 };
}

export function refRlcSeriesZ(
  rOhm: number,
  lHenries: number,
  cFarads: number,
  fHz: number,
): { xl: number; xc: number; z: number; i: number } {
  const xl = 2 * Math.PI * fHz * lHenries;
  const xc = cFarads > 0 ? 1 / (2 * Math.PI * fHz * cFarads) : 0;
  const x = xl - xc;
  const z = Math.hypot(rOhm, x);
  return { xl, xc, z, i: 0 };
}

export function refTrendMean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function refTrendSampleStdev(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = refTrendMean(values);
  const ss = values.reduce((s, v) => s + (v - mean) ** 2, 0);
  return Math.sqrt(ss / (n - 1));
}

export function refPowerFactor(realKw: number, apparentKva: number): number {
  return realKw / apparentKva;
}

export function refMotorSyncRpm(poles: number, fHz: number): number {
  return (120 * fHz) / poles;
}

export function refMotorSlipPercent(syncRpm: number, actualRpm: number): number {
  return ((syncRpm - actualRpm) / syncRpm) * 100;
}

export function near(actual: number, expected: number, rel = 0.02, abs = 0.05): boolean {
  return Math.abs(actual - expected) <= Math.max(abs, Math.abs(expected) * rel);
}