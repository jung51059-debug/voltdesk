import { GROUP_A_SLUGS } from '@/lib/us/group-a-slugs';
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';

const FACILITY_GROUP_A = new Set([
  'field-compare',
  'duty-cycle',
  'trend-analysis',
  'retrofit-compare',
  'equipment-load',
  'energy-intensity',
]);

const FACILITY_GROUP_B = new Set(GROUP_B_TOOLS.filter((t) => t.domain === 'facility').map((t) => t.slug));

/** US routable calculator path (matches HTTP smoke / Playwright). */
export function usCalculatorPath(slug: string): string {
  if (slug === 'rlc-impedance') return '/us/tools/electrical/rlc-impedance';
  if (FACILITY_GROUP_A.has(slug) || FACILITY_GROUP_B.has(slug)) return `/us/tools/facility/${slug}`;
  return `/us/tools/electrical/${slug}`;
}

export function usCalculatorDomain(slug: string): 'electrical' | 'facility' {
  if (FACILITY_GROUP_A.has(slug) || FACILITY_GROUP_B.has(slug)) return 'facility';
  return 'electrical';
}

export const US_GROUP_A_SLUGS = GROUP_A_SLUGS;