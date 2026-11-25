import type { UsPublicationStatus } from "@/lib/us/calculator-catalog";

export type ContentKind =
  | "calculator"
  | "reference_article"
  | "calculator_guide"
  | "policy"
  | "hub"
  | "workspace";

export type ContentMappingEntry = {
  contentId: string;
  kind: ContentKind;
  krPath: string;
  usPath: string;
  publicationStatus: UsPublicationStatus;
  indexable: boolean;
};

/**
 * Explicit KR↔US pairs. hreflang / region switch use only published+indexable rows.
 * US-1: policy hubs registered as planned; no published pairs yet.
 */
const MAPPINGS: ContentMappingEntry[] = [
  { contentId: "hub-home", kind: "hub", krPath: "/", usPath: "/us", publicationStatus: "planned", indexable: false },
  { contentId: "hub-tools", kind: "hub", krPath: "/tools", usPath: "/us/tools", publicationStatus: "planned", indexable: false },
  { contentId: "hub-electrical", kind: "hub", krPath: "/tools/electrical", usPath: "/us/tools/electrical", publicationStatus: "planned", indexable: false },
  { contentId: "hub-facility", kind: "hub", krPath: "/tools/facility", usPath: "/us/tools/facility", publicationStatus: "planned", indexable: false },
  { contentId: "hub-references", kind: "hub", krPath: "/references", usPath: "/us/references", publicationStatus: "planned", indexable: false },
  { contentId: "policy-about", kind: "policy", krPath: "/about", usPath: "/us/about", publicationStatus: "planned", indexable: false },
  { contentId: "policy-contact", kind: "policy", krPath: "/contact", usPath: "/us/contact", publicationStatus: "planned", indexable: false },
  { contentId: "policy-privacy", kind: "policy", krPath: "/privacy", usPath: "/us/privacy", publicationStatus: "planned", indexable: false },
  { contentId: "policy-terms", kind: "policy", krPath: "/terms", usPath: "/us/terms", publicationStatus: "planned", indexable: false },
  { contentId: "policy-sources", kind: "policy", krPath: "/sources", usPath: "/us/sources", publicationStatus: "planned", indexable: false },
  { contentId: "policy-disclaimer", kind: "policy", krPath: "/disclaimer", usPath: "/us/disclaimer", publicationStatus: "planned", indexable: false },
  { contentId: "util-search", kind: "hub", krPath: "/search", usPath: "/us/search", publicationStatus: "planned", indexable: false },
  { contentId: "util-favorites", kind: "hub", krPath: "/favorites", usPath: "/us/favorites", publicationStatus: "planned", indexable: false },
  { contentId: "util-settings", kind: "hub", krPath: "/settings", usPath: "/us/settings", publicationStatus: "planned", indexable: false },
];

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function getPublishedContentPair(
  path: string,
  source: "KR" | "US",
): { krPath: string; usPath: string } | null {
  const p = normalizePath(path);
  const row = MAPPINGS.find((m) => (source === "KR" ? m.krPath === p : m.usPath === p));
  if (!row || row.publicationStatus !== "published" || !row.indexable) return null;
  return { krPath: row.krPath, usPath: row.usPath };
}

export function allContentMappings(): ContentMappingEntry[] {
  return MAPPINGS;
}

export function findMappingByKrPath(krPath: string): ContentMappingEntry | undefined {
  return MAPPINGS.find((m) => m.krPath === normalizePath(krPath));
}

export function findMappingByUsPath(usPath: string): ContentMappingEntry | undefined {
  return MAPPINGS.find((m) => m.usPath === normalizePath(usPath));
}