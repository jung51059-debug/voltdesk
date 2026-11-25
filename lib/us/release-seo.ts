import type { Metadata } from "next";
import inventory from "@/lib/us/release-allowlist.json";
import hreflangPairs from "@/lib/us/hreflang-pairs.json";
import { absoluteUrl } from "@/lib/seo";
import { REGION_KR, REGION_US } from "@/lib/region/config";
import { usBuildMode } from "@/lib/us/release-gate";

type AllowRow = (typeof inventory)[number];

function normalizeUsPath(path: string): string {
  const trimmed = path.replace(/\/$/, "");
  if (trimmed === "" || trimmed === "/us") return "/us";
  return trimmed.startsWith("/us") ? trimmed : `/us${trimmed}`;
}

export function isUsProductionPublic(): boolean {
  return usBuildMode() === "public";
}

export function usAllowlistRow(path: string): AllowRow | undefined {
  return inventory.find((row) => row.path === normalizeUsPath(path));
}

/** Search indexing: READY_FOR_RELEASE with proposedIndex on a public US build only. */
export function isUsPathSearchIndexable(path: string): boolean {
  if (!isUsProductionPublic()) return false;
  const row = usAllowlistRow(path);
  return row?.status === "READY_FOR_RELEASE" && row.proposedIndex === true;
}

/** Sitemap: same 46 paths as PHASE-US9B-INDEXABLE-URL-PLAN.csv */
export function usSitemapIndexablePaths(): string[] {
  if (!isUsProductionPublic()) return [];
  return inventory
    .filter((row) => row.status === "READY_FOR_RELEASE" && row.proposedIndex)
    .map((row) => row.path)
    .sort();
}

function hreflangRowForKr(krPath: string) {
  const normalized = krPath === "" ? "/" : krPath.replace(/\/$/, "") || "/";
  return hreflangPairs.find((row) => row.krPath === normalized);
}

function hreflangRowForUs(usPath: string) {
  return hreflangPairs.find((row) => row.usPath === normalizeUsPath(usPath));
}

/**
 * Reciprocal ko-KR / en-US alternates for approved indexable pairs only.
 * Omits x-default and US-only pages by design.
 */
export function hreflangLanguagesForKrPath(krPath: string): Record<string, string> | null {
  if (!isUsProductionPublic()) return null;
  const pair = hreflangRowForKr(krPath);
  if (!pair || !isUsPathSearchIndexable(pair.usPath)) return null;
  return {
    [REGION_KR.locale]: absoluteUrl(pair.krPath),
    [REGION_US.locale]: absoluteUrl(pair.usPath),
  };
}

export function hreflangLanguagesForUsPath(usPath: string): Record<string, string> | null {
  if (!isUsProductionPublic()) return null;
  const pair = hreflangRowForUs(usPath);
  if (!pair || !isUsPathSearchIndexable(usPath)) return null;
  return {
    [REGION_KR.locale]: absoluteUrl(pair.krPath),
    [REGION_US.locale]: absoluteUrl(usPath),
  };
}

export function mergeKrAlternates(path: string, canonical = path): Metadata["alternates"] {
  const languages = hreflangLanguagesForKrPath(canonical);
  if (!languages) return { canonical };
  return { canonical, languages };
}

export function resolveUsPageIndexable(path: string, explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit && isUsPathSearchIndexable(path);
  return isUsPathSearchIndexable(path);
}