/**
 * Phase 3C-2A — guides ↔ engines / schedules
 */
import { describe, expect, it } from "vitest";
import { calculateDutyCycle, calculateGeneratorLoadTest, calculateRetrofitCompare } from "@/lib/calculations/field-verify";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getToolBySlug } from "@/lib/data/tools";
import { normalizeLoadRow, phaseImbalance, rowPowers, type PanelRow } from "@/lib/calculations/schedules";
import { SQRT_3 } from "@/lib/math/units";
import { roundTo } from "@/lib/math/round";
import { sitemapEntries } from "@/lib/seo";

const SLUGS = [
  "cable-schedule",
  "panel-schedule",
  "lightning-risk",
  "generator-load-test",
  "duty-cycle",
  "retrofit-compare",
] as const;

function numbersIn(text: string) {
  return (text.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

function metricNum(
  outcome: { ok: boolean; metrics?: { id: string; value: string | number }[] },
  id: string,
): number {
  if (!outcome.ok || !outcome.metrics) throw new Error(`engine fail for ${id}`);
  return Number(String(outcome.metrics.find((m) => m.id === id)?.value).replace(/,/g, ""));
}

function threeKva(v: number, i: number) {
  return (SQRT_3 * v * i) / 1000;
}

describe("Phase 3C-2A 가이드·SEO", () => {
  it("6종 고유 가이드·메타·FAQ 4", () => {
    const paths = new Set(sitemapEntries());
    for (const slug of SLUGS) {
      const guide = getCalculatorGuide(slug);
      const tool = getToolBySlug(slug);
      expect(guide, slug).toBeTruthy();
      expect(tool?.metaTitle, slug).toBeTruthy();
      expect(tool?.metaDescription, slug).toBeTruthy();
      expect(tool?.faqs.length, slug).toBe(4);
      expect(guide!.whenToUse.length).toBeGreaterThanOrEqual(2);
      expect(guide!.cautions.length).toBeGreaterThanOrEqual(3);
      expect(guide!.links?.length, slug).toBeGreaterThanOrEqual(3);
      for (const link of guide!.links ?? []) {
        expect(paths.has(link.href), `${slug} → ${link.href}`).toBe(true);
      }
    }
  });
});

describe("cable-schedule lookup ↔ rowPowers", () => {
  const rows = [
    normalizeLoadRow({ qty: 2, unitKw: 15, efficiency: 0.92, pf: 0.85, demand: 0.8, voltage: 380, phase: "3" }),
    normalizeLoadRow({ qty: 40, unitKw: 0.04, efficiency: 1, pf: 1, demand: 0.9, coincidence: 0.85, voltage: 220, phase: "1" }),
    normalizeLoadRow({ qty: 1, unitKw: 40, efficiency: 0.95, pf: 0.9, demand: 1, coincidence: 0.7, voltage: 380, phase: "3" }),
  ];

  rows.forEach((row, i) => {
    it(`행 ${i + 1} 전류`, () => {
      const guide = getCalculatorGuide("cable-schedule")!;
      const p = rowPowers(row);
      const shown = numbersIn(guide.lookup!.rows[i][1]);
      expect(shown[0]).toBeCloseTo(roundTo(p.currentA, 2), 2);
    });
  });
});

describe("panel-schedule lookup ↔ phaseImbalance", () => {
  const cases: PanelRow[][] = [
    [
      { id: "1", circuit: "1", name: "a", phase: "R", kw: 0, current: 30, breaker: "", cable: "", remark: "" },
      { id: "2", circuit: "2", name: "b", phase: "S", kw: 0, current: 30, breaker: "", cable: "", remark: "" },
      { id: "3", circuit: "3", name: "c", phase: "T", kw: 0, current: 30, breaker: "", cable: "", remark: "" },
    ],
    [
      { id: "1", circuit: "1", name: "a", phase: "R", kw: 0, current: 20, breaker: "", cable: "", remark: "" },
      { id: "2", circuit: "2", name: "b", phase: "S", kw: 0, current: 20, breaker: "", cable: "", remark: "" },
      { id: "3", circuit: "3", name: "c", phase: "T", kw: 0, current: 40, breaker: "", cable: "", remark: "" },
    ],
    [
      { id: "1", circuit: "1", name: "a", phase: "R", kw: 0, current: 15, breaker: "", cable: "", remark: "" },
      { id: "2", circuit: "2", name: "b", phase: "S", kw: 0, current: 25, breaker: "", cable: "", remark: "" },
      { id: "3", circuit: "3", name: "c", phase: "T", kw: 0, current: 20, breaker: "", cable: "", remark: "" },
    ],
  ];

  cases.forEach((panelRows, i) => {
    it(`불평형 ${i + 1}`, () => {
      const guide = getCalculatorGuide("panel-schedule")!;
      const bal = phaseImbalance(panelRows);
      const pct = numbersIn(guide.lookup!.rows[i][3])[0];
      expect(roundTo(bal.imbalancePct, 1)).toBeCloseTo(pct, 1);
    });
  });
});

describe("generator-load-test lookup ↔ 엔진", () => {
  const currents = [105, 210, 420];
  currents.forEach((i, idx) => {
    it(`${i} A`, () => {
      const guide = getCalculatorGuide("generator-load-test")!;
      const out = calculateGeneratorLoadTest(
        { ratedKva: "625", phase: "3", voltage: "380", current: String(i), pf: "0.8", hours: "1" },
        2,
      );
      expect(out.ok).toBe(true);
      const s = metricNum(out, "s");
      const p = metricNum(out, "p");
      const row = guide.lookup!.rows[idx];
      expect(numbersIn(row[1])[0]).toBeCloseTo(roundTo(s, 2), 2);
      expect(numbersIn(row[2])[0]).toBeCloseTo(roundTo(p, 2), 2);
      expect(s).toBeCloseTo(threeKva(380, i), 2);
    });
  });
});

describe("duty-cycle lookup ↔ 엔진", () => {
  const cases = [
    { input: { periodHours: "24", onHours: "8", starts: "12" }, expectRt: 33.33 },
    { input: { periodHours: "168", onHours: "120", starts: "20" }, expectRt: 71.43 },
    { input: { periodHours: "8", onHours: "2", starts: "4" }, expectRt: 25 },
  ];
  cases.forEach((c, i) => {
    it(`케이스 ${i + 1}`, () => {
      const guide = getCalculatorGuide("duty-cycle")!;
      const out = calculateDutyCycle(c.input, 2);
      expect(out.ok).toBe(true);
      const rt = metricNum(out, "rt");
      const pct = numbersIn(guide.lookup!.rows[i][3])[0];
      expect(rt).toBeCloseTo(pct, 2);
    });
  });
});

describe("retrofit-compare lookup ↔ 엔진", () => {
  const cases = [
    { baselineKw: "18", proposedKw: "11", baselineHours: "4000", proposedHours: "4000", de: 28000 },
    { baselineKw: "30", proposedKw: "24", baselineHours: "2000", proposedHours: "2000", de: 12000 },
    { baselineKw: "10", proposedKw: "10", baselineHours: "5000", proposedHours: "5000", de: 0 },
  ];
  cases.forEach((c, i) => {
    it(`케이스 ${i + 1}`, () => {
      const guide = getCalculatorGuide("retrofit-compare")!;
      const out = calculateRetrofitCompare(
        {
          baselineKw: c.baselineKw,
          proposedKw: c.proposedKw,
          baselineHours: c.baselineHours,
          proposedHours: c.proposedHours,
        },
        2,
      );
      expect(out.ok).toBe(true);
      const de = metricNum(out, "de");
      const shown = numbersIn(guide.lookup!.rows[i][3])[0];
      expect(de).toBeCloseTo(c.de, 2);
      expect(shown).toBeCloseTo(c.de, 2);
    });
  });
});