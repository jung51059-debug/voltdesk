"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { loadFavorites, subscribeStorage, toggleFavorite as toggleStored } from "@/lib/storage/local";

type FavoriteContextValue = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => boolean;
};

const FavoriteContext = createContext<FavoriteContextValue | null>(null);

function getSnapshot() {
  return JSON.stringify(loadFavorites());
}

function getServerSnapshot() {
  return "[]";
}

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribeStorage, getSnapshot, getServerSnapshot);
  const favorites = useMemo(() => JSON.parse(raw) as string[], [raw]);

  const toggle = useCallback((id: string) => {
    const next = toggleStored(id);
    return next.includes(id);
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      isFavorite: (id: string) => favorites.includes(id),
      toggle,
    }),
    [favorites, toggle],
  );

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoriteContext);
  if (!ctx) throw new Error("FavoriteProvider missing");
  return ctx;
}
