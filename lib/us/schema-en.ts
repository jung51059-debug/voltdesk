import type { FieldDef, FormSchema } from "@/lib/calculations/schemas";
import { localizeSchemaText, OPTION_VALUE_LABELS } from "@/lib/us/schema-ko-en";

const COMMON_UNIT_ARIA = "units";

/** Shared English labels by field id (Group A calculators). */
const FIELD_LABELS: Record<string, string> = {
  ratedKva: "Rated kVA",
  vPrimary: "Primary voltage",
  vSecondary: "Secondary voltage",
  voltage: "Voltage",
  phase: "Phase",
  current: "Current",
  power: "Real power",
  pf: "Power factor",
  efficiency: "Efficiency",
  frequency: "Frequency",
  loadKva: "Load kVA",
  noLoadKw: "No-load loss (nameplate kW)",
  loadLossKw: "Load loss at rated kVA (nameplate kW)",
  s1: "Transformer 1 kVA",
  z1: "Transformer 1 % impedance",
  s2: "Transformer 2 kVA",
  z2: "Transformer 2 % impedance",
  mode: "Calculation mode",
  hp: "Motor horsepower",
  rpm: "Speed (rpm)",
  slip: "Slip",
  syncSpeed: "Synchronous speed",
  poles: "Number of poles",
  inertia: "Load inertia",
  torque: "Torque",
  allowPct: "Allowable voltage drop (%)",
  multiplier: "Starting current multiplier",
  primary: "Primary quantity",
  secondary: "Secondary quantity",
  ratio: "Ratio",
  length: "Length",
  width: "Width",
  thickness: "Thickness",
  material: "Conductor material",
  illuminance: "Target illuminance",
  area: "Floor area",
  lampPower: "Lamp power",
  lampCount: "Lamp count",
  pvKw: "DC array size",
  irradiance: "Peak sun hours / irradiance",
  soil: "Soil resistivity",
  depth: "Rod depth",
  count: "Rod count",
  baseline: "Baseline value",
  measured: "Measured value",
  tolerance: "Tolerance (%)",
  onHours: "On-time (hours)",
  offHours: "Off-time (hours)",
  cycles: "Cycles per day",
  existingKwh: "Existing annual kWh",
  proposedKwh: "Proposed annual kWh",
  floorArea: "Conditioned floor area",
  energyUse: "Annual energy use",
  hours: "Operating hours",
  utilization: "Utilization factor",
};

const OPTION_LABELS: Record<string, string> = {
  ...OPTION_VALUE_LABELS,
  yes: "Yes",
  no: "No",
  single: "Single-phase",
  three: "Three-phase",
  "1p": "Single-phase",
  "3p": "Three-phase",
  basic: "Basic",
  detailed: "Detailed",
  cu: "Copper (Cu)",
  al: "Aluminum (Al)",
};

const SECTION_LABELS: Record<string, string> = {
  "전원 조건": "Supply",
  "부하 조건": "Load",
  "변압기": "Transformer",
};

const HINTS_EN: Record<string, Record<string, string>> = {
  "transformer-current": {
    ratedKva: "Nameplate kVA at rated taps; not short-circuit duty.",
  },
  "single-phase-current": {
    pf: "Enter as a decimal (e.g. 0.85), not a percentage.",
  },
};

const SLUG_FIELD_LABELS: Record<string, Record<string, string>> = {
  "amp-to-kw": {
    current: "Line current (A)",
    voltage: "Line-to-neutral or line voltage per mode",
  },
};

export function localizeFormSchema(slug: string, schema: FormSchema): FormSchema {
  const slugLabels = SLUG_FIELD_LABELS[slug] ?? {};
  const slugHints = HINTS_EN[slug] ?? {};
  const fields: FieldDef[] = schema.fields.map((field) => ({
    ...field,
    label: localizeSchemaText(slugLabels[field.id] ?? FIELD_LABELS[field.id] ?? field.label, "label")!,
    hint: localizeSchemaText(slugHints[field.id] ?? field.hint, "hint"),
    placeholder: localizeSchemaText(field.placeholder, "hint"),
    section: field.section
      ? localizeSchemaText(SECTION_LABELS[field.section] ?? field.section, "label")
      : undefined,
    options: field.options?.map((opt) => ({
      ...opt,
      label: localizeSchemaText(OPTION_LABELS[opt.value] ?? opt.label, "option")!,
    })),
    units: field.units?.map((unit) => ({
      ...unit,
      label: localizeSchemaText(unit.label, "label")!,
    })),
  }));
  return { ...schema, fields };
}

export function englishUnitAria(label: string): string {
  return `${label} ${COMMON_UNIT_ARIA}`;
}