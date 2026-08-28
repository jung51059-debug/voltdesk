export const SQRT_3 = Math.sqrt(3);

/** Mechanical horsepower. */
export const WATTS_PER_HP = 746;

export const COPPER_RESISTIVITY = 0.0175;
export const ALUMINUM_RESISTIVITY = 0.0282;

const POWER_TO_W: Record<string, number> = {
  W: 1,
  kW: 1000,
  MW: 1_000_000,
  HP: WATTS_PER_HP,
};

const VOLTAGE_TO_V: Record<string, number> = {
  V: 1,
  kV: 1000,
};

const CURRENT_TO_A: Record<string, number> = {
  A: 1,
  kA: 1000,
};

const LENGTH_TO_M: Record<string, number> = {
  m: 1,
  km: 1000,
  ft: 0.3048,
};

const ENERGY_TO_WH: Record<string, number> = {
  Wh: 1,
  kWh: 1000,
  MWh: 1_000_000,
};

const RESISTANCE_PER_KM: Record<string, number> = {
  "ohm/km": 1,
  "ohm/m": 1000,
  "ohm/kft": 1 / 0.3048,
};

function convert(value: number, from: string, table: Record<string, number>): number {
  const factor = table[from];
  if (factor === undefined) {
    throw new Error(`지원하지 않는 단위: ${from}`);
  }
  return value * factor;
}

export function toWatts(value: number, unit: string): number {
  return convert(value, unit, POWER_TO_W);
}

export function wattsTo(value: number, unit: string): number {
  const factor = POWER_TO_W[unit];
  if (factor === undefined) {
    throw new Error(`지원하지 않는 단위: ${unit}`);
  }
  return value / factor;
}

export function toVolts(value: number, unit: string): number {
  return convert(value, unit, VOLTAGE_TO_V);
}

export function toAmperes(value: number, unit: string): number {
  return convert(value, unit, CURRENT_TO_A);
}

export function toMeters(value: number, unit: string): number {
  return convert(value, unit, LENGTH_TO_M);
}

export function toWattHours(value: number, unit: string): number {
  return convert(value, unit, ENERGY_TO_WH);
}

export function toOhmPerKm(value: number, unit: string): number {
  return convert(value, unit, RESISTANCE_PER_KM);
}

export function resistivityOf(material: "cu" | "al"): number {
  return material === "cu" ? COPPER_RESISTIVITY : ALUMINUM_RESISTIVITY;
}

export function conductorResistanceOhm(params: {
  resistivity: number;
  lengthM: number;
  areaMm2: number;
}): number {
  return (params.resistivity * params.lengthM) / params.areaMm2;
}

export function conductorOhmPerKm(resistivity: number, areaMm2: number): number {
  return (resistivity * 1000) / areaMm2;
}
