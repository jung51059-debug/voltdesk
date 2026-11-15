/**
 * Phase 3C-2B — guides ↔ engines (6종)
 */
import { describe, expect, it } from "vitest";
import { calculateEnergyIntensity, calculatePmInterval, calculateYoyEnergy } from "@/lib/calculations/facility-extra";
import { analyzeTrend, calculateSensorCalibration, parseTrendText } from "@/lib/calculations/field-verify";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getToolBySlug } from "@/lib/data/tools";
import { roundTo } from "@/lib/math/round";
import { sitemapEntries } from "@/lib/seo";

const SLUGS = [
  "energy-intensity",
  "pm-interval",
  "yoy-energy",
  "sld",
  "sensor-calibration",
  "trend-analysis",
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

const SENSOR_INPUT = {
  spanMin: "0",
  spanMax: "100",
  ind1: "0.2",
  ref1: "0",
  ind2: "25.8",
  ref2: "25",
  ind3: "50.1",
  ref3: "50",
  ind4: "74.6",
  ref4: "75",
  ind5: "99.8",
  ref5: "100",
};

describe("Phase 3C-2B 가이드·SEO", () => {
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

describe("energy-intensity lookup ↔ 엔진", () => {
  const cases = [
    { kwh: "12000", denominator: "3000", unitLabel: "m²", expect: 4 },
    { kwh: "8640", denominator: "720", unitLabel: "개", expect: 12 },
    { kwh: "5000", denominator: "2500", unitLabel: "인시", expect: 2 },
  ];
  cases.forEach((c, i) => {
    it(`케이스 ${i + 1}`, () => {
      const guide = getCalculatorGuide("energy-intensity")!;
      const out = calculateEnergyIntensity(
        { kwh: c.kwh, denominator: c.denominator, unitLabel: c.unitLabel },
        2,
      );
      expect(out.ok).toBe(true);
      const ei = metricNum(out, "ei");
      const shown = numbersIn(guide.lookup!.rows[i][2])[0];
      expect(ei).toBeCloseTo(c.expect, 2);
      expect(shown).toBeCloseTo(c.expect, 2);
    });
  });
});

describe("pm-interval lookup ↔ 엔진", () => {
  const cases = [
    { runHours: "2300", intervalHours: "500", due: 200 },
    { runHours: "2500", intervalHours: "500", due: 0 },
    { runHours: "100", intervalHours: "800", due: 700 },
  ];
  cases.forEach((c, i) => {
    it(`케이스 ${i + 1}`, () => {
      const guide = getCalculatorGuide("pm-interval")!;
      const out = calculatePmInterval({ runHours: c.runHours, intervalHours: c.intervalHours }, 2);
      expect(out.ok).toBe(true);
      const due = metricNum(out, "due");
      const shown = numbersIn(guide.lookup!.rows[i][2])[0];
      expect(due).toBeCloseTo(c.due, 2);
      expect(shown).toBeCloseTo(c.due, 2);
    });
  });
});

describe("yoy-energy lookup ↔ 엔진", () => {
  const cases = [
    { thisKwh: "12000", lastKwh: "10000", d: 2000, pct: 20 },
    { thisKwh: "9000", lastKwh: "10000", d: -1000, pct: -10 },
    { thisKwh: "5000", lastKwh: "4000", d: 1000, pct: 25 },
  ];
  cases.forEach((c, i) => {
    it(`케이스 ${i + 1}`, () => {
      const guide = getCalculatorGuide("yoy-energy")!;
      const out = calculateYoyEnergy({ thisKwh: c.thisKwh, lastKwh: c.lastKwh }, 2);
      expect(out.ok).toBe(true);
      const d = metricNum(out, "d");
      const pct = metricNum(out, "pct");
      const row = guide.lookup!.rows[i];
      expect(d).toBeCloseTo(c.d, 2);
      expect(pct).toBeCloseTo(c.pct, 2);
      expect(numbersIn(row[2])[0]).toBeCloseTo(Math.abs(c.d), 2);
      expect(numbersIn(row[3])[0]).toBeCloseTo(Math.abs(c.pct), 2);
    });
  });
});

describe("sensor-calibration lookup ↔ 엔진", () => {
  const points = [1, 2, 5];
  points.forEach((p, i) => {
    it(`P${p} 절대오차`, () => {
      const guide = getCalculatorGuide("sensor-calibration")!;
      const out = calculateSensorCalibration(SENSOR_INPUT, 4);
      expect(out.ok).toBe(true);
      const abs = metricNum(out, `a${p}`);
      const err = metricNum(out, `e${p}`);
      const row = guide.lookup!.rows[i];
      expect(numbersIn(row[2])[0]).toBeCloseTo(abs, 4);
      const mag = numbersIn(row[1])[0];
      const signed = row[1].trim().startsWith("-") ? -mag : mag;
      expect(signed).toBeCloseTo(err, 4);
    });
  });
});

describe("trend-analysis lookup ↔ analyzeTrend", () => {
  it("10·12·14", () => {
    const guide = getCalculatorGuide("trend-analysis")!;
    const stats = analyzeTrend(parseTrendText("10\n12\n14").points);
    expect(stats.avg).toBeCloseTo(12, 6);
    expect(stats.stdev).toBeCloseTo(2, 6);
    expect(stats.pctChange).toBeCloseTo(40, 6);
    const rows = guide.lookup!.rows;
    expect(Number(rows[0][1])).toBeCloseTo(roundTo(stats.avg, 0), 0);
    expect(Number(rows[1][1])).toBeCloseTo(roundTo(stats.stdev, 0), 0);
    expect(Number(rows[2][1])).toBeCloseTo(roundTo(stats.pctChange, 0), 0);
  });
});