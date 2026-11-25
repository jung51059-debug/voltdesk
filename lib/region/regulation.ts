import type { RegionCode } from "@/lib/region/config";

/** KEC review UI and logic must not activate on US routes (US-1 guard; calculators wired in US-2+). */
export function isKecReviewAllowed(region: RegionCode): boolean {
  return region === "KR";
}