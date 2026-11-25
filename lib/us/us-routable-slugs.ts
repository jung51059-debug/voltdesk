import { GROUP_A_SLUGS } from '@/lib/us/group-a-slugs';
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { US_CABLE_TOOLS } from '@/lib/us/cable-tools';
import { US_NEW_TOOLS } from '@/lib/us/new-tools';
import { GROUP_C_TOOLS } from '@/lib/us/group-c-tools';

/** Routable US calculator slugs after US-4 (61 total). */
export const US_ROUTABLE_SLUGS = [
  ...GROUP_A_SLUGS,
  ...GROUP_B_TOOLS.map((t) => t.slug),
  ...US_CABLE_TOOLS.map((t) => t.slug),
  ...US_NEW_TOOLS.map((t) => t.slug),
  ...GROUP_C_TOOLS.map((t) => t.slug),
  'conduit-fill-physical',
] as const;

export function usRoutableCount(): number {
  return US_ROUTABLE_SLUGS.length;
}