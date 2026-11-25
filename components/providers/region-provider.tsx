"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { RegionCode } from "@/lib/region/config";
import { getRegionConfig } from "@/lib/region/config";

type RegionContextValue = {
  region: RegionCode;
  config: ReturnType<typeof getRegionConfig>;
};

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({
  region,
  children,
}: {
  region: RegionCode;
  children: ReactNode;
}) {
  const value: RegionContextValue = { region, config: getRegionConfig(region) };
  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("RegionProvider missing");
  return ctx;
}

/** Outside SiteChrome (e.g. tests) falls back to KR. */
export function useOptionalRegion(): RegionCode {
  return useContext(RegionContext)?.region ?? "KR";
}