import { DEFAULT_PREFERENCES, type UserPreference } from "@/lib/types";

const PREF_KEY = "voltdesk:preferences";
const FAV_KEY = "voltdesk:favorites";
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

export function loadPreferences(): UserPreference {
  return { ...DEFAULT_PREFERENCES, ...readJson(PREF_KEY, {}) };
}

export function savePreferences(prefs: UserPreference) {
  writeJson(PREF_KEY, prefs);
}

export function loadFavorites(): string[] {
  return readJson<string[]>(FAV_KEY, []);
}

export function toggleFavorite(toolId: string): string[] {
  const current = loadFavorites();
  const next = current.includes(toolId) ? current.filter((id) => id !== toolId) : [toolId, ...current];
  writeJson(FAV_KEY, next);
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

export function loadRecentSearches(): string[] {
  return readJson<string[]>(RECENT_SEARCH_KEY, []);
}

export function pushRecentSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  const next = [q, ...loadRecentSearches().filter((item) => item !== q)].slice(0, 8);
  writeJson(RECENT_SEARCH_KEY, next);
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
