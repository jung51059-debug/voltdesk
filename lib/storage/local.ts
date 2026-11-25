import { DEFAULT_PREFERENCES, type UserPreference } from "@/lib/types";
import { storageKeysFor, type StorageRegion } from "@/lib/storage/region-keys";
const PREF_KEY = storageKeysFor("KR").preferences;

const FAV_KEY = storageKeysFor("KR").favorites;
const RECENT_TOOLS_KEY = "voltdesk:recent-tools";
const RECENT_ARTICLES_KEY = "voltdesk:recent-articles";
const RECENT_SEARCH_KEY = "voltdesk:recent-searches";
const HISTORY_KEY = "voltdesk:calc-history";

const listeners = new Set<() => void>();

export function subscribeStorage(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

function emitStorage() {
  listeners.forEach((listener) => listener());
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  emitStorage();
}

const US_PREFERENCE_DEFAULTS: UserPreference = {
  ...DEFAULT_PREFERENCES,
  defaultVoltage: 480,
  defaultFrequency: 60,
  unitSystem: "mixed",
  language: "en",
};

export function loadPreferences(region: StorageRegion = "KR"): UserPreference {
  const base = region === "US" ? US_PREFERENCE_DEFAULTS : DEFAULT_PREFERENCES;
  return { ...base, ...readJson(storageKeysFor(region).preferences, {}) };
}

export function savePreferences(prefs: UserPreference, region: StorageRegion = "KR") {
  writeJson(storageKeysFor(region).preferences, prefs);
}

export function loadFavorites(region: StorageRegion = "KR"): string[] {
  return readJson<string[]>(storageKeysFor(region).favorites, []);
}

export function toggleFavorite(toolId: string, region: StorageRegion = "KR"): string[] {
  const key = storageKeysFor(region).favorites;
  const current = loadFavorites(region);
  const next = current.includes(toolId) ? current.filter((id) => id !== toolId) : [toolId, ...current];
  writeJson(key, next);
  return next;
}

export function loadRecentTools(): string[] {
  return readJson<string[]>(RECENT_TOOLS_KEY, []);
}

export function pushRecentTool(toolId: string) {
  const next = [toolId, ...loadRecentTools().filter((id) => id !== toolId)].slice(0, 12);
  writeJson(RECENT_TOOLS_KEY, next);
}

export function loadRecentArticles(): string[] {
  return readJson<string[]>(RECENT_ARTICLES_KEY, []);
}

export function pushRecentArticle(articleId: string) {
  const next = [articleId, ...loadRecentArticles().filter((id) => id !== articleId)].slice(0, 12);
  writeJson(RECENT_ARTICLES_KEY, next);
}

export function loadRecentSearches(region: StorageRegion = "KR"): string[] {
  return readJson<string[]>(storageKeysFor(region).recentSearches, []);
}

export function pushRecentSearch(query: string, region: StorageRegion = "KR") {
  const q = query.trim();
  if (!q) return;
  const key = storageKeysFor(region).recentSearches;
  const current = readJson<string[]>(key, []);
  const next = [q, ...current.filter((item) => item !== q)].slice(0, 8);
  writeJson(key, next);
}

export function clearRecent() {
  writeJson(RECENT_TOOLS_KEY, []);
  writeJson(RECENT_ARTICLES_KEY, []);
  writeJson(RECENT_SEARCH_KEY, []);
}

export function clearHistory() {
  writeJson(HISTORY_KEY, []);
}

export function loadHistory(): unknown[] {
  return readJson(HISTORY_KEY, []);
}

export const storageKeys = {
  PREF_KEY,
  FAV_KEY,
  RECENT_TOOLS_KEY,
  RECENT_ARTICLES_KEY,
  RECENT_SEARCH_KEY,
} as const;
