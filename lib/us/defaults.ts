import { REGION_US } from "@/lib/region/config";

/** US-specific default field values without mutating KR schema defaults. */
export function usCalculatorDefaults(slug: string, defaults: Record<string, string>): Record<string, string> {
  const next = { ...defaults };
  if(slug==='single-phase-current') next.voltage='120';
  if(slug==='three-phase-current') next.voltage='208';
  if(['amp-to-kw','power-factor-correction','harmonic-filter'].includes(slug)) next.voltage='480';
  if (slug === "transformer-current") {
    next.ratedKva = "750";
    next.vPrimary = "12470";
    next.vPrimaryUnit = "V";
    next.vSecondary = "480";
    next.vSecondaryUnit = "V";
  }
  if (slug.includes("phase") && slug.includes("current")) {
    next.frequency = next.frequency || String(REGION_US.defaultFrequencyHz);
  }
  if (defaults.frequency === "50" && slug !== "motor-slip") {
    next.frequency = String(REGION_US.defaultFrequencyHz);
  }
  return next;
}
