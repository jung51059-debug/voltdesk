import { describe, expect, it } from "vitest";
import { GROUP_A_SLUGS } from "@/lib/us/group-a-slugs";
import { getUsCalculatorContent, groupAContentGaps } from "@/lib/us/content/registry";
import { US_CALCULATOR_CATALOG, countUsCatalogByGroup, isUsCalculatorPublished } from "@/lib/us/calculator-catalog";
import { isUsCalculatorIndexable, isUsCalculatorRoutable } from "@/lib/us/publication";
import { getToolBySlug } from "@/lib/data/tools";
import { usRouteForSlug } from "@/lib/us/verification/group-a-cases";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Phase US-2 fix inventory (authoritative counts)", () => {
  it("Group A slug count = 30", () => {
    expect(GROUP_A_SLUGS).toHaveLength(30);
    expect(countUsCatalogByGroup().A).toBe(30);
  });

  it("content registry = 30, gaps = 0", () => {
    expect(groupAContentGaps()).toHaveLength(0);
    for (const slug of GROUP_A_SLUGS) expect(getUsCalculatorContent(slug)).toBeTruthy();
  });

  it("routable = 30, indexable = 0", () => {
    const groupA = US_CALCULATOR_CATALOG.filter((e) => e.migrationGroup === "A");
    expect(groupA).toHaveLength(30);
    expect(groupA.every((e) => isUsCalculatorRoutable(e))).toBe(true);
    expect(groupA.every((e) => isUsCalculatorPublished(e))).toBe(true);
    expect(groupA.every((e) => !isUsCalculatorIndexable(e))).toBe(true);
    expect(groupA.every((e) => !e.indexable)).toBe(true);
  });

  it("domain split electrical 24 + facility 6", () => {
    let el = 0;
    let fac = 0;
    for (const slug of GROUP_A_SLUGS) {
      const d = getToolBySlug(slug)?.domain;
      if (d === "electrical") el += 1;
      if (d === "facility") fac += 1;
    }
    expect(el).toBe(24);
    expect(fac).toBe(6);
  });

  it("30 US routes (unique)", () => {
    const routes = new Set(GROUP_A_SLUGS.map((s) => usRouteForSlug(s)));
    expect(routes.size).toBe(30);
  });

  it("vitest file count in repo", () => {
    const root = path.join(process.cwd(), "lib");
    const count = fs
      .readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && String(e.name).endsWith(".test.ts")).length;
    expect(count).toBeGreaterThanOrEqual(24);
  });
});