"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { loadFavorites, subscribeStorage, toggleFavorite as toggleStored } from "@/lib/storage/local";
import type { StorageRegion } from "@/lib/storage/region-keys";

type FavoriteContextValue = {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => boolean;
};

const FavoriteContext = createContext<FavoriteContextValue | null>(null);


function getServerSnapshot() {
  return "[]";
}

export function FavoriteProvider({
  children,
  region = "KR",
}: {
  children: React.ReactNode;
  region?: StorageRegion;
}) {
  const getSnapshot = useCallback(() => JSON.stringify(loadFavorites(region)), [region]);
  const raw = useSyncExternalStore(subscribeStorage, getSnapshot, getServerSnapshot);
  const favorites = useMemo(() => JSON.parse(raw) as string[], [raw]);

  const toggle = useCallback(
    (id: string) => {
      const next = toggleStored(id, region);
      return next.includes(id);
    },
    [region],
  );

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
