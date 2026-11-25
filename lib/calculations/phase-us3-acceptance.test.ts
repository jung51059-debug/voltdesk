import { describe, expect, it } from "vitest";
import { US_CALCULATOR_CATALOG } from "@/lib/us/calculator-catalog";
import { isUsCalculatorRoutable } from "@/lib/us/publication";
import { GROUP_A_SLUGS } from "@/lib/us/group-a-slugs";
import { GROUP_B_TOOLS } from "@/lib/us/group-b-tools";
import { US_CABLE_TOOLS } from "@/lib/us/cable-tools";
import { US_NEW_TOOLS } from "@/lib/us/new-tools";
import { getPublishedTools } from "@/lib/data/tools";
import { sitemapEntries } from "@/lib/seo";

const GROUP_B_BLOCKED = ["load-flow", "sld", "load-schedule", "cable-schedule"];

describe("US-3 acceptance inventory", () => {
  it("KR publication baseline unchanged", () => {
    expect(getPublishedTools()).toHaveLength(71);
    const urls = new Set(sitemapEntries());
    expect(urls.size).toBe(132);
    expect([...urls].some((u) => u.startsWith("/us"))).toBe(false);
  });

  it("US catalog indexable remains zero", () => {
    const indexable = US_CALCULATOR_CATALOG.filter((e) => e.indexable);
    expect(indexable).toHaveLength(0);
  });

  it("Group B: 28 catalog rows, 24 routable surfaces, 4 workspace blocked", () => {
    const b = US_CALCULATOR_CATALOG.filter((e) => e.migrationGroup === "B");
    expect(b).toHaveLength(28);
    for (const slug of GROUP_B_BLOCKED) {
      const row = b.find((e) => e.krSlug === slug);
      expect(row?.publicationStatus).toBe("blocked");
    }
    const implementedSlugs = new Set([
      ...GROUP_B_TOOLS.map((t) => t.slug),
      ...US_CABLE_TOOLS.map((t) => t.slug),
    ]);
    expect(implementedSlugs.size).toBe(24);
    expect(GROUP_B_TOOLS).toHaveLength(19);
    expect(US_CABLE_TOOLS).toHaveLength(5);
  });

  it("Group A routable with English content: 30", () => {
    const routableA = US_CALCULATOR_CATALOG.filter(
      (e) => GROUP_A_SLUGS.includes(e.krSlug as (typeof GROUP_A_SLUGS)[number]) && isUsCalculatorRoutable(e),
    );
    expect(routableA).toHaveLength(30);
  });

  it("US-only new calculators: 2 routable pages", () => {
    expect(US_NEW_TOOLS).toHaveLength(2);
  });

  it("total US calculator pages for QA matrix baseline", () => {
    const total = 30 + 24 + US_NEW_TOOLS.length;
    expect(total).toBe(56);
  });
});