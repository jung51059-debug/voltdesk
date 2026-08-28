"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_PREFERENCES, type UserPreference } from "@/lib/types";
import { loadPreferences, savePreferences, subscribeStorage } from "@/lib/storage/local";

type PrefContextValue = {
  prefs: UserPreference;
  setPrefs: (next: UserPreference) => void;
  patchPrefs: (partial: Partial<UserPreference>) => void;
  ready: boolean;
};

const PrefContext = createContext<PrefContextValue | null>(null);

function applyTheme(theme: UserPreference["theme"]) {
  if (typeof document === "undefined") return;
  const dark =
    theme === "dark" || (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function getSnapshot() {
  return JSON.stringify(loadPreferences());
}

function getServerSnapshot() {
  return JSON.stringify(DEFAULT_PREFERENCES);
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribeStorage, getSnapshot, getServerSnapshot);
  const prefs = useMemo(() => JSON.parse(raw) as UserPreference, [raw]);

  useEffect(() => {
    applyTheme(prefs.theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(prefs.theme);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs.theme]);

  const setPrefs = useCallback((next: UserPreference) => {
    savePreferences(next);
    applyTheme(next.theme);
  }, []);

  const patchPrefs = useCallback((partial: Partial<UserPreference>) => {
    const next = { ...loadPreferences(), ...partial };
    savePreferences(next);
    applyTheme(next.theme);
  }, []);

  const value = useMemo(() => ({ prefs, setPrefs, patchPrefs, ready: true }), [prefs, setPrefs, patchPrefs]);

  return <PrefContext.Provider value={value}>{children}</PrefContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PrefContext);
  if (!ctx) throw new Error("PreferencesProvider missing");
  return ctx;
}
