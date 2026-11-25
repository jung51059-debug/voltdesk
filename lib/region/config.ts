export type RegionCode = "KR" | "US";

export const REGION_HEADER = "x-ampory-region";

export type RegionConfig = {
  region: RegionCode;
  locale: string;
  language: string;
  htmlLang: string;
  routePrefix: string;
  defaultFrequencyHz: number;
  unitSystem: "si" | "us-customary";
  regulationLabel: string;
  defaultVoltageV: number;
  openGraphLocale: string;
  jsonLdInLanguage: string;
  currencyLabel: string;
};

export const REGION_KR: RegionConfig = {
  region: "KR",
  locale: "ko-KR",
  language: "ko",
  htmlLang: "ko",
  routePrefix: "",
  defaultFrequencyHz: 60,
  unitSystem: "si",
  regulationLabel: "KEC",
  defaultVoltageV: 380,
  openGraphLocale: "ko_KR",
  jsonLdInLanguage: "ko",
  currencyLabel: "KRW",
};

export const REGION_US: RegionConfig = {
  region: "US",
  locale: "en-US",
  language: "en",
  htmlLang: "en-US",
  routePrefix: "/us",
  defaultFrequencyHz: 60,
  unitSystem: "us-customary",
  regulationLabel: "NEC (reference only)",
  /** Not a single site-wide default — per-calculator presets in later phases. */
  defaultVoltageV: 120,
  openGraphLocale: "en_US",
  jsonLdInLanguage: "en-US",
  currencyLabel: "USD",
};

export function getRegionConfig(region: RegionCode): RegionConfig {
  return region === "US" ? REGION_US : REGION_KR;
}

/** True when pathname is under /us (prefix route). */
export function regionFromPathname(pathname: string): RegionCode {
  return pathname === "/us" || pathname.startsWith("/us/") ? "US" : "KR";
}

export function isUsPath(pathname: string): boolean {
  return regionFromPathname(pathname) === "US";
}

/** Prefix an app path for a region (KR keeps path as-is). */
export function regionalPath(region: RegionCode, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (region === "KR") return normalized;
  if (normalized === "/") return "/us";
  return `/us${normalized}`;
}