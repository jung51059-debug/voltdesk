import { getToolById } from "@/lib/data/tools";
import {isUsNavigationVisible} from './release-gate';
import { getUsCalculatorByKrSlug } from "@/lib/us/calculator-catalog";
import { isUsCalculatorRoutable } from "@/lib/us/publication";
import { buildUsToolPresentation, type UsToolPresentation } from "@/lib/us/tool-presentation";

export function getUsRelatedPresentations(tool: UsToolPresentation): UsToolPresentation[] {
  const out: UsToolPresentation[] = [];
  for (const id of tool.relatedToolIds) {
    const kr = getToolById(id);
    if (!kr) continue;
    const entry = getUsCalculatorByKrSlug(kr.slug);
    if (!entry || !isUsCalculatorRoutable(entry)) continue;
    const pres = buildUsToolPresentation(kr.slug);
    if (pres && isUsNavigationVisible(pres.href)) out.push(pres);
  }
  return out;
}
