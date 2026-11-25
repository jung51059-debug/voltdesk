import { getToolBySlug } from "@/lib/data/tools";
import { GROUP_B_TOOLS } from "@/lib/us/group-b-tools";
import { US_CABLE_TOOLS } from "@/lib/us/cable-tools";
import { GROUP_C_TOOLS } from "@/lib/us/group-c-tools";

/** English UI title for a US calculator route (never fall back to Korean name). */
export function usCalculatorTitle(usSlug: string, krSlug: string): string {
  const fromB = GROUP_B_TOOLS.find((t) => t.slug === usSlug);
  if (fromB) return fromB.title;
  const fromCable = US_CABLE_TOOLS.find((t) => t.slug === usSlug);
  if (fromCable) return fromCable.title;
  const fromC = GROUP_C_TOOLS.find((t) => t.slug === usSlug);
  if (fromC) return fromC.title;
  const kr = getToolBySlug(krSlug);
  if (kr?.nameEn) return kr.nameEn;
  return usSlug.replace(/-/g, " ");
}