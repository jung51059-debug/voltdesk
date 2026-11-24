/** SI units internally. Bounds are numerical safeguards, not equipment ratings. */
export const CABLE_AREAS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];
export const CABLE_LENGTHS = [10, 25, 50, 100, 150, 200, 300, 500];
export function bounded(value: number, label: string, min = 0, max = 1e12): number {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${label}: ${min}~${max} 범위의 유한한 값을 입력하세요.`);
  return value;
}
export function finiteResults<T extends Record<string, unknown>>(result: T): T {
  if (Object.values(result).some((v) => typeof v === "number" && !Number.isFinite(v))) throw new Error("수치 처리 범위를 벗어났습니다. 입력값을 확인하세요.");
  return result;
}
export const MATERIALS = { cu: { rho: 0.01724, alpha: 0.00393 }, al: { rho: 0.02826, alpha: 0.00403 } };
export type CableInput = { mode: "theory" | "manufacturer"; material: "cu" | "al"; area: number; length: number; temperature: number; frequency: number; inductance: number; resistance: number; reactance: number };
export function theoreticalResistance(material: "cu" | "al", area: number, temperature: number) {
  if (!MATERIALS[material]) throw new Error("도체 재질을 확인하세요.");
  bounded(area, "단면적 mm²", 1e-9, 1e6); bounded(temperature, "도체 온도 ℃", -50, 250);
  const { rho, alpha } = MATERIALS[material];
  return { r20: rho * 1000 / area, r: rho * 1000 / area * (1 + alpha * (temperature - 20)), increasePct: alpha * (temperature - 20) * 100 };
}
export function cableImpedance(input: CableInput) {
  if (!["theory", "manufacturer"].includes(input.mode)) throw new Error("계산 모드를 확인하세요.");
  const length = bounded(input.length, "편도 길이 m", 1e-9, 1e7);
  const theory = input.mode === "theory";
  const resistance = theory ? theoreticalResistance(input.material, input.area, input.temperature) : null;
  if (theory) { bounded(input.frequency, "주파수 Hz", 1e-9, 1e9); bounded(input.inductance, "인덕턴스 mH/km", 0, 1e6); }
  const rUnit = resistance?.r ?? bounded(input.resistance, "교류저항 Ω/km");
  const xUnit = theory ? 2 * Math.PI * input.frequency * input.inductance * 1e-3 : bounded(input.reactance, "리액턴스 Ω/km");
  const r = rUnit * length / 1000, x = xUnit * length / 1000;
  return finiteResults({ r, x, z: Math.hypot(r, x), angle: r === 0 && x === 0 ? null : Math.atan2(x, r) * 180 / Math.PI, xr: r === 0 ? null : x / r,
    r20: resistance ? resistance.r20 * length / 1000 : null, increasePct: resistance?.increasePct ?? null,
    inductanceH: theory ? input.inductance * 1e-3 * length / 1000 : null, rUnit, xUnit, zUnit: Math.hypot(rUnit, xUnit) });
}
export function cableAreaComparison(input: CableInput) {
  if (input.mode !== "theory") return [];
  const selected = cableImpedance(input);
  return [...new Set([...CABLE_AREAS, input.area])].sort((a,b) => a-b).map(area => {
    const result = cableImpedance({ ...input, area });
    return { area, ...result, changePct: (result.r / selected.r - 1) * 100 };
  });
}
export function cableLengthComparison(input: CableInput) {
  return [...new Set([...CABLE_LENGTHS, input.length])].sort((a,b) => a-b).map(length => ({ length, ...cableImpedance({ ...input, length }) }));
}
export const UNIT_FACTORS = { "mΩ": 1e-3, "Ω": 1, "kΩ": 1e3, "MΩ": 1e6, "μH": 1e-6, "mH": 1e-3, H: 1, pF: 1e-12, nF: 1e-9, "μF": 1e-6, mF: 1e-3, F: 1, Hz: 1, kHz: 1e3, MHz: 1e6, mV: 1e-3, V: 1, kV: 1e3 };
export const UNIT_GROUPS = { resistance: ["mΩ", "Ω", "kΩ", "MΩ"], inductance: ["μH", "mH", "H"], capacitance: ["pF", "nF", "μF", "mF", "F"], frequency: ["Hz", "kHz", "MHz"], voltage: ["mV", "V", "kV"] };
export function toSI(value: number, unit: string, group: keyof typeof UNIT_GROUPS) {
  if (!UNIT_GROUPS[group].includes(unit)) throw new Error("단위를 확인하세요.");
  return bounded(value, "입력값") * UNIT_FACTORS[unit as keyof typeof UNIT_FACTORS];
}
export type RlcInput = { circuit: string; r: number; l: number; c: number; frequency: number; voltage: number };
export function rlcImpedance(input: RlcInput) {
  const { circuit } = input;
  if (!["R", "L", "C", "RL", "RC", "LC", "RLC"].includes(circuit)) throw new Error("직렬 회로 종류를 확인하세요.");
  const f = bounded(input.frequency, "주파수 Hz", 1e-9, 1e12), voltage = bounded(input.voltage, "RMS 전압 V");
  const r = circuit.includes("R") ? bounded(input.r, "저항 Ω") : 0;
  const l = circuit.includes("L") ? bounded(input.l, "인덕턴스 H") : 0;
  const c = circuit.includes("C") ? bounded(input.c, "정전용량 F", 1e-18) : 0;
  const xl = 2 * Math.PI * f * l, xc = c ? 1 / (2 * Math.PI * f * c) : 0;
  const difference = xl - xc;
  // Roundoff at ideal resonance must not produce a fictitious enormous current.
  const x = Math.abs(difference) <= 32 * Number.EPSILON * Math.max(xl, xc) ? 0 : difference;
  const z = Math.hypot(r, x), singular = z === 0;
  const current = singular ? null : voltage / z;
  return finiteResults({ r, xl: circuit.includes("L") ? xl : null, xc: c ? xc : null, x, z, angle: singular ? null : Math.atan2(x,r)*180/Math.PI,
    pf: singular ? null : r / z, current, p: current === null ? null : current ** 2 * r, q: current === null ? null : current ** 2 * x,
    s: current === null ? null : voltage * current, resonance: l > 0 && c > 0 ? 1/(2*Math.PI*Math.sqrt(l*c)) : null,
    singular, relation: singular ? "이상적 영 임피던스" : x > 0 ? "지상" : x < 0 ? "진상" : "동상" });
}
export type AcDropInput = { phase: "1" | "3"; voltage: number; current: number; length: number; r: number; x: number; pf: number; direction: "lagging" | "leading" };
export function acVoltageDrop(input: AcDropInput) {
  if (!["1","3"].includes(input.phase) || !["lagging","leading"].includes(input.direction)) throw new Error("회로 방식과 역률 방향을 확인하세요.");
  bounded(input.voltage,"기준전압 V",1e-9); bounded(input.current,"전류 A"); bounded(input.length,"길이 m",1e-9,1e7);
  bounded(input.r,"상별 저항 Ω/km"); bounded(input.x,"상별 리액턴스 Ω/km"); bounded(input.pf,"역률",0,1);
  const factor = input.phase === "1" ? 2 : Math.sqrt(3), lengthKm = input.length/1000;
  const basicDrop = factor * input.current * lengthKm * input.r;
  const resistive = basicDrop * input.pf;
  const reactive = factor * input.current * lengthKm * input.x * Math.sqrt(1-input.pf**2) * (input.direction === "leading" ? -1 : 1);
  const drop = resistive + reactive;
  return finiteResults({ resistive, reactive, drop, percent: drop/input.voltage*100, loadVoltage: input.voltage-drop,
    lossW: (input.phase === "1" ? 2 : 3)*input.current**2*input.r*lengthKm, basicDrop });
}
