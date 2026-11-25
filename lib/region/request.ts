import { headers } from "next/headers";
import { getRegionConfig, regionFromPathname, REGION_HEADER, type RegionCode } from "@/lib/region/config";

/** Region is derived from pathname; header alone cannot override path. */
export async function getRequestRegion(): Promise<RegionCode> {
  const h = await headers();
  const path = h.get("x-ampory-pathname");
  if (path) return regionFromPathname(path);
  const value = h.get(REGION_HEADER);
  return value === "US" ? "US" : "KR";
}

export async function getRequestRegionConfig() {
  return getRegionConfig(await getRequestRegion());
}