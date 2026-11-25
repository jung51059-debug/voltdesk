import { describe, expect, it, vi } from "vitest";
import { sitemapEntries } from "@/lib/seo";
import inventory from "@/lib/us/release-allowlist.json";
import hreflangPairs from "@/lib/us/hreflang-pairs.json";
import { usSitemapIndexablePaths, isUsPathSearchIndexable, isUsProductionPublic } from "@/lib/us/release-seo";
import fs from "node:fs";

function parseIndexablePlan(): string[] {
  const text = fs.readFileSync("PHASE-US9B-INDEXABLE-URL-PLAN.csv", "utf8");
  const lines = text.trim().split(/\r?\n/).slice(1);
  return lines.map((line) => line.split(",")[0].replace(/^"|"$/g, ""));
}

describe("US-9 public release SEO (build-time flag required)", () => {
  it("non-public builds keep the legacy KR-only 132-entry sitemap", () => {
    expect(sitemapEntries()).toHaveLength(132);
    expect(sitemapEntries().some((path) => path.startsWith("/us"))).toBe(false);
  });

  it("public builds expose exactly the approved 46 US indexable URLs and 178 total sitemap URLs", () => {
    vi.stubEnv("AMPORY_US_BUILD_MODE", "public");
    try {
      expect(usSitemapIndexablePaths()).toHaveLength(46);
      const plan = parseIndexablePlan();
      expect(new Set(usSitemapIndexablePaths())).toEqual(new Set(plan));
      expect(sitemapEntries()).toHaveLength(178);
      const krOnly = sitemapEntries().filter((path) => !path.startsWith("/us"));
      expect(krOnly).toHaveLength(132);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("public build source omits legacy preview marketing phrases in US shell", () => {
    const footer = fs.readFileSync("components/layout/us-footer.tsx", "utf8");
    const home = fs.readFileSync("app/us/page.tsx", "utf8");
    expect(footer).toContain("isUsProductionPublic");
    expect(home).toContain("Browse calculator catalog");
    expect(home).toContain("isUsProductionPublic()");
  });

  it("hreflang pairs stay within indexable allowlist and omit workspaces hub", () => {
    vi.stubEnv("AMPORY_US_BUILD_MODE", "public");
    try {
      const indexable = new Set(usSitemapIndexablePaths());
      expect(hreflangPairs).toHaveLength(39);
      for (const pair of hreflangPairs) {
        expect(indexable.has(pair.usPath), pair.usPath).toBe(true);
        expect(isUsPathSearchIndexable(pair.usPath)).toBe(true);
        expect(pair.usPath).not.toBe("/us/workspaces");
      }
      const ready = inventory.filter((r) => r.status.startsWith("READY_"));
      expect(ready).toHaveLength(74);
      expect(ready.filter((r) => r.proposedIndex)).toHaveLength(46);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});