import { describe, expect, it } from "vitest";
import { engines } from "@/lib/calculations/engines";
import { formSchemas } from "@/lib/calculations/schemas";
import { sitemapEntries } from "@/lib/seo";
import { getPublishedTools } from "@/lib/data/tools";
import { GROUP_A_SLUGS } from "@/lib/us/group-a-slugs";
import { getUsCalculatorContent } from "@/lib/us/content/registry";
import { US_CALCULATOR_CATALOG, countUsCatalogByGroup } from "@/lib/us/calculator-catalog";
import { isUsCalculatorPublished } from "@/lib/us/calculator-catalog";
import { isUsCalculatorRoutable } from "@/lib/us/publication";
import { regionFromPathname } from "@/lib/region/config";
import { parseRlc } from "@/lib/calculations/impedance-engine";
import { rlcImpedance } from "@/lib/calculations/impedance";

const SCHEMA_OPTIONAL = new Set(["rlc-impedance", "trend-analysis"]);

describe("Phase US-2 Group A", () => {
  it("Group A = 30 slugs aligned with catalog", () => {
    expect(GROUP_A_SLUGS).toHaveLength(30);
    const g = countUsCatalogByGroup();
    expect(g.A).toBe(30);
  });

  it("all Group A have English content and routable publication", () => {
    for (const slug of GROUP_A_SLUGS) {
      expect(getUsCalculatorContent(slug), slug).toBeTruthy();
      const entry = US_CALCULATOR_CATALOG.find((e) => e.krSlug === slug)!;
      expect(isUsCalculatorPublished(entry), slug).toBe(true);
      expect(isUsCalculatorRoutable(entry), slug).toBe(true);
      expect(entry.indexable, slug).toBe(false);
    }
  });

  it("KR sitemap unchanged (132, no /us)", () => {
    const paths = sitemapEntries();
    expect(paths).toHaveLength(132);
    expect(paths.every((p) => !p.startsWith("/us"))).toBe(true);
  });

  it("KR published tool count unchanged", () => {
    expect(getPublishedTools()).toHaveLength(71);
  });

  it("pathname wins over spoofed region header concept", () => {
    expect(regionFromPathname("/")).toBe("KR");
    expect(regionFromPathname("/us/tools/electrical/transformer-current")).toBe("US");
    expect(regionFromPathname("/tools/electrical/transformer-current")).toBe("KR");
  });

  it("transformer-current independent check (750 kVA, 12470 / 480 V)", () => {
    const out = engines["transformer-current"](
      {
        ratedKva: "750",
        vPrimary: "12470",
        vPrimaryUnit: "V",
        vSecondary: "480",
        vSecondaryUnit: "V",
      },
      2,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const i2 = out.metrics.find((m) => m.id === "i2");
    const i1 = out.metrics.find((m) => m.id === "i1");
    expect(i2?.value).toContain("902");
    expect(i1?.value).toContain("34.7");
    const content = getUsCalculatorContent("transformer-current")!;
    expect(i2?.value).toContain(content.workedExample.expectedValueContains.split(".")[0] ?? "902");
  });

  it("rlc-impedance independent check (10 Ω, 100 mH, 100 µF, 60 Hz, 208 V)", () => {
    const input = parseRlc({
      circuit: "RLC",
      r: "10",
      l: "100",
      c: "100",
      frequency: "60",
      voltage: "208",
      rUnit: "Ω",
      lUnit: "mH",
      cUnit: "μF",
      frequencyUnit: "Hz",
      voltageUnit: "V",
    });
    const r = rlcImpedance(input);
    expect(r.z).toBeGreaterThan(14);
    expect(r.z).toBeLessThan(16);
    expect(r.current).toBeGreaterThan(13);
    expect(r.current).toBeLessThan(15);
  });

  it("Group A engines exist and schemas except dedicated UIs", () => {
    for (const slug of GROUP_A_SLUGS) {
      if (slug === "rlc-impedance" || slug === "trend-analysis") continue;
      expect(engines[slug], slug).toBeTypeOf("function");
      if (!SCHEMA_OPTIONAL.has(slug)) {
        expect(formSchemas[slug], slug).toBeTruthy();
      }
    }
  });
});