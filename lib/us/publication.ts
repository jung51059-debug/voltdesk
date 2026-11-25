import type { UsCalculatorEntry } from "@/lib/us/calculator-catalog";
import { isUsNavPublic } from "@/lib/region/feature-flags";
import { GROUP_A_SLUGS } from "@/lib/us/group-a-slugs";
import { getUsCalculatorContent } from "@/lib/us/content/registry";
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { US_CABLE_TOOLS } from '@/lib/us/cable-tools';
import { GROUP_C_TOOLS } from '@/lib/us/group-c-tools';

const GROUP_A = new Set<string>(GROUP_A_SLUGS);

let groupAPublicationApplied = false;

/**
 * Marks Group A catalog rows that have English content as locally routable (`published`)
 * while keeping `indexable` false until a deliberate US launch (US-2 SEO guard).
 * Call once after `US_CALCULATOR_CATALOG` is built (parent wires this in catalog init).
 */
export function applyGroupAUsPublication(catalog: UsCalculatorEntry[]): void {
  if (groupAPublicationApplied) return;
  for (const entry of catalog) {
    if (!GROUP_A.has(entry.krSlug)) continue;
    if (!getUsCalculatorContent(entry.krSlug)) continue;
    entry.publicationStatus = "published";
    entry.indexable = false;
    if (entry.technicalReviewStatus === "pending") {
      entry.technicalReviewStatus = "in-progress";
    }
  }
  groupAPublicationApplied = true;
}

/** Whether the US app may serve a calculator page (dev-complete content), not search indexing. */
export function isUsCalculatorRoutable(entry: UsCalculatorEntry): boolean {
  if (entry.publicationStatus === "blocked") return false;
  if(entry.publicationStatus==='review'&&(GROUP_B_TOOLS.some(tool=>tool.slug===entry.krSlug)||US_CABLE_TOOLS.some(tool=>tool.slug===entry.krSlug)||GROUP_C_TOOLS.some(tool=>tool.slug===entry.krSlug))) return true;
  if (entry.publicationStatus === "published") return true;
  if (entry.publicationStatus === "review" && GROUP_A.has(entry.krSlug) && getUsCalculatorContent(entry.krSlug)) {
    return true;
  }
  return false;
}

/** Search indexing: requires explicit indexable flag, published state, content, and US public flag. */
export function isUsCalculatorIndexable(entry: UsCalculatorEntry): boolean {
  return (
    entry.indexable &&
    entry.publicationStatus === "published" &&
    isUsNavPublic() &&
    Boolean(getUsCalculatorContent(entry.krSlug))
  );
}
