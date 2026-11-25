/** Hand-derived cable defaults (mirrors phase-us3-cable.test.ts, not engine echo). */
const area = (Math.PI / 4) * (0.127 * 92 ** (24 / 39)) ** 2;
const lengthM = 30.48;
const r = (0.01724 * lengthM) / area;
const x = ((2 * Math.PI * 60 * 0.25 * 1e-3) * lengthM) / 1000;
const dv = 2 * 20 * (r * 0.9 + x * Math.sqrt(1 - 0.9 ** 2));

export const CABLE_INDEPENDENT: Record<string, { metric: string; value: number }> = {
  'cable-impedance': { metric: 'z', value: Math.hypot(r, x) },
  'cable-resistance': { metric: 'r', value: r },
  'cable-parallel': { metric: 'ieach', value: 10 },
  'voltage-drop': { metric: 'dv', value: dv },
  'path-voltage-drop': { metric: 'dv', value: dv },
};