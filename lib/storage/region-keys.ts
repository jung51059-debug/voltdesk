/** KR keys unchanged for backward compatibility. */
export const STORAGE_KEYS_KR = {
  preferences: "voltdesk:preferences",
  favorites: "voltdesk:favorites",
  recentTools: "voltdesk:recent-tools",
  recentArticles: "voltdesk:recent-articles",
  recentSearches: "voltdesk:recent-searches",
  calcHistory: "voltdesk:calc-history",
} as const;

/** US locale uses separate keys (US-2+). US-1 defines keys only. */
export const STORAGE_KEYS_US = {
  preferences: "voltdesk:preferences:us",
  favorites: "voltdesk:favorites:us",
  recentTools: "voltdesk:recent-tools:us",
  recentArticles: "voltdesk:recent-articles:us",
  recentSearches: "voltdesk:recent-searches:us",
  calcHistory: "voltdesk:calc-history:us",
} as const;

export type StorageRegion = "KR" | "US";

export function storageKeysFor(region: StorageRegion) {
  return region === "US" ? STORAGE_KEYS_US : STORAGE_KEYS_KR;
}