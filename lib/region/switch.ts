import type { RegionCode } from "@/lib/region/config";
import {usNavigationTarget} from '@/lib/us/release-gate';
import { getPublishedContentPair } from "@/lib/us/content-mapping";
import { getUsCalculatorByKrSlug, getUsCalculatorByUsSlug } from "@/lib/us/calculator-catalog";
import { isUsCalculatorRoutable } from "@/lib/us/publication";

/**
 * Region switch without IP redirect. Unmapped or unpublished targets fall back to regional hubs.
 */
function regionalSwitchTarget(pathname: string, target: RegionCode): string {
  if (target === "US") {
    if (pathname === "/" || pathname === "") return "/us";
    const pair = getPublishedContentPair(pathname, "KR");
    if (pair?.usPath) return pair.usPath;
    const calc = pathname.match(/^\/tools\/(?:electrical|facility)\/([^/]+)$/);
    if (calc) {
      const domain = pathname.includes("/facility/") ? "facility" : "electrical";
      const entry = getUsCalculatorByKrSlug(calc[1]!);
      if (entry && isUsCalculatorRoutable(entry)) {
        return `/us/tools/${domain}/${entry.usSlug}`;
      }
      if (entry) return `/us/tools/${domain}`;
    }
    if (pathname.startsWith("/tools")) return "/us/tools";
    if (pathname.startsWith("/references")) return "/us/references";
    if (pathname.startsWith("/about")) return "/us/about";
    if (pathname.startsWith("/contact")) return "/us/contact";
    return "/us";
  }

  if (!pathname.startsWith("/us")) return pathname;
  const usPath = pathname.replace(/^\/us/, "") || "/";
  const pair = getPublishedContentPair(usPath === "/" ? "/" : usPath, "US");
  if (pair?.krPath) return pair.krPath;
  const usCalc = pathname.match(/^\/us\/tools\/(?:electrical|facility)\/([^/]+)$/);
  if (usCalc) {
    const domain = pathname.includes("/facility/") ? "facility" : "electrical";
    const entry = getUsCalculatorByUsSlug(usCalc[1]!);
    if (entry && isUsCalculatorRoutable(entry)) {
      return `/tools/${domain}/${entry.krSlug}`;
    }
    if (entry) return `/tools/${domain}`;
  }
  if (pathname.startsWith("/us/tools")) return "/tools";
  if (pathname.startsWith("/us/references")) return "/references";
  return "/";
}
export function getRegionalSwitchTarget(pathname:string,target:RegionCode):string {
  return usNavigationTarget(regionalSwitchTarget(pathname,target));
}
