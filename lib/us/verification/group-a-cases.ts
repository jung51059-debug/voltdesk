import type { GroupASlug } from "@/lib/us/group-a-slugs";
import { formSchemas } from "@/lib/calculations/schemas";
import { usCalculatorDefaults } from "@/lib/us/defaults";

export type VerifyCase = {
  slug: GroupASlug;
  inputs: Record<string, string>;
  badInputs?: Record<string, string>;
  domain: "electrical" | "facility";
};

const FACILITY: GroupASlug[] = [
  "field-compare",
  "duty-cycle",
  "trend-analysis",
  "retrofit-compare",
  "equipment-load",
  "energy-intensity",
];

function schemaInputs(slug: GroupASlug, patch: Record<string, string> = {}): Record<string, string> {
  const schema = formSchemas[slug];
  const base = schema ? usCalculatorDefaults(slug, { ...schema.defaults }) : {};
  return { ...base, ...patch };
}

/** Normal + US voltage patches where defaults were KR-oriented. */
export const GROUP_A_VERIFY_CASES: VerifyCase[] = [
  {
    slug: "single-phase-current",
    domain: "electrical",
    inputs: schemaInputs("single-phase-current", { power: "3", powerUnit: "kW", voltage: "120", pf: "0.9", efficiency: "1" }),
    badInputs: { voltage: "", power: "1" },
  },
  {
    slug: "three-phase-current",
    domain: "electrical",
    inputs: schemaInputs("three-phase-current", { power: "10", powerUnit: "kW", voltage: "208", pf: "0.85", efficiency: "0.95" }),
  },
  {
    slug: "amp-to-kw",
    domain: "electrical",
    inputs: schemaInputs("amp-to-kw", { phase: "3", current: "50", voltage: "208", pf: "0.88" }),
  },
  {
    slug: "kw-kva-hp",
    domain: "electrical",
    inputs: schemaInputs("kw-kva-hp", { mode: "from-kw", power: "75", powerUnit: "kW", pf: "0.9" }),
  },
  {
    slug: "power-factor",
    domain: "electrical",
    inputs: schemaInputs("power-factor", { kw: "100", kva: "111" }),
  },
  {
    slug: "power-triangle",
    domain: "electrical",
    inputs: schemaInputs("power-triangle", { kw: "80", kvar: "50" }),
  },
  {
    slug: "power-factor-correction",
    domain: "electrical",
    inputs: schemaInputs("power-factor-correction", { kw: "200", pfBefore: "0.75", pfAfter: "0.95" }),
  },
  { slug: "thd", domain: "electrical", inputs: schemaInputs("thd") },
  { slug: "harmonic-filter", domain: "electrical", inputs: schemaInputs("harmonic-filter") },
  { slug: "motor-slip", domain: "electrical", inputs: schemaInputs("motor-slip", { frequency: "60" }) },
  { slug: "motor-acceleration", domain: "electrical", inputs: schemaInputs("motor-acceleration") },
  { slug: "transformer-load", domain: "electrical", inputs: schemaInputs("transformer-load") },
  {
    slug: "transformer-current",
    domain: "electrical",
    inputs: schemaInputs("transformer-current"),
  },
  { slug: "transformer-loss", domain: "electrical", inputs: schemaInputs("transformer-loss") },
  { slug: "transformer-parallel", domain: "electrical", inputs: schemaInputs("transformer-parallel") },
  { slug: "transformer-impedance", domain: "electrical", inputs: schemaInputs("transformer-impedance") },
  {
    slug: "rlc-impedance",
    domain: "electrical",
    inputs: {
      circuit: "RLC",
      r: "10",
      l: "100",
      c: "100",
      frequency: "60",
      voltage: "208",
      rUnit: "Ω",
      lUnit: "mH",
      cUnit: "μF",
      frequencyUnit: "Hz",
      voltageUnit: "V",
    },
  },
  { slug: "ct-ratio", domain: "electrical", inputs: schemaInputs("ct-ratio") },
  { slug: "pt-ratio", domain: "electrical", inputs: schemaInputs("pt-ratio") },
  { slug: "busbar", domain: "electrical", inputs: schemaInputs("busbar") },
  { slug: "lux", domain: "electrical", inputs: schemaInputs("lux") },
  { slug: "lighting-density", domain: "electrical", inputs: schemaInputs("lighting-density") },
  { slug: "solar-pv", domain: "electrical", inputs: schemaInputs("solar-pv") },
  { slug: "soil-resistivity", domain: "electrical", inputs: schemaInputs("soil-resistivity") },
  { slug: "field-compare", domain: "facility", inputs: schemaInputs("field-compare") },
  { slug: "duty-cycle", domain: "facility", inputs: schemaInputs("duty-cycle") },
  {
    slug: "trend-analysis",
    domain: "facility",
    inputs: { raw: "100\n102\n101\n99\n103" },
  },
  { slug: "retrofit-compare", domain: "facility", inputs: schemaInputs("retrofit-compare") },
  { slug: "equipment-load", domain: "facility", inputs: schemaInputs("equipment-load") },
  { slug: "energy-intensity", domain: "facility", inputs: schemaInputs("energy-intensity") },
];

export function usRouteForSlug(slug: GroupASlug): string {
  const domain = FACILITY.includes(slug) ? "facility" : "electrical";
  if (slug === "rlc-impedance") return `/us/tools/electrical/rlc-impedance`;
  return `/us/tools/${domain}/${slug}`;
}