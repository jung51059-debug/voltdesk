/**
 * Phase 3B-2B-3 — load-schedule, arc-flash, field-compare
 */
import { describe, expect, it } from "vitest";
import { calculateFieldCompare } from "@/lib/calculations/field-verify";
import { normalizeLoadRow, rowPowers } from "@/lib/calculations/schedules";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getToolBySlug } from "@/lib/data/tools";
import { roundTo } from "@/lib/math/round";
import { sitemapEntries } from "@/lib/seo";
import type { CalcInput } from "@/lib/calculations/parse";

const numbersIn = (text: string) => (text.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

function metricNum(outcome: { ok: boolean; metrics?: { id: string; value: string | number }[] }, id: string): number {
  if (!outcome.ok || !outcome.metrics) throw new Error(`engine fail for ${id}`);
  const raw = outcome.metrics.find((m) => m.id === id)?.value;
  return Number(String(raw).replace(/,/g, ""));
}

describe("load-schedule lookup ↔ rowPowers", () => {
  const rows = [
    normalizeLoadRow({
      qty: 2,
      unitKw: 15,
      efficiency: 0.92,
      pf: 0.85,
      demand: 0.8,
      coincidence: 1,
      voltage: 380,
      phase: "3",
    }),
    normalizeLoadRow({
      qty: 40,
      unitKw: 0.04,
      efficiency: 1,
      pf: 1,
      demand: 0.9,
      coincidence: 0.85,
      voltage: 220,
      phase: "1",
    }),
    normalizeLoadRow({
      qty: 1,
      unitKw: 40,
      efficiency: 0.95,
      pf: 0.9,
      demand: 1,
      coincidence: 0.7,
      voltage: 380,
      phase: "3",
    }),
  ];

  rows.forEach((row, i) => {
    it(`load-schedule ${i + 1}행`, () => {
      const guide = getCalculatorGuide("load-schedule")!;
      const p = rowPowers(row);
      const table = guide.lookup!.rows[i].slice(1).flatMap((cell) => numbersIn(cell));
      expect(table[0]).toBeCloseTo(roundTo(p.demandKw, 2), 2);
      expect(table[1]).toBeCloseTo(roundTo(p.demandKva, 2), 2);
      expect(table[2]).toBeCloseTo(roundTo(p.currentA, 2), 2);
      const walkNums = numbersIn(guide.walkthroughs![i].lines.join(" "));
      expect(walkNums).toContain(roundTo(p.demandKw, 2));
    });
  });
});

describe("field-compare ↔ 엔진", () => {
  const cases = [
    {
      input: {
        itemName: "유량",
        designValue: "100",
        measuredValue: "94",
        unit: "m3/h",
        toleranceMode: "percent",
        tolerancePct: "5",
      },
      expectPct: 94,
      expectLo: 95,
    },
    {
      input: { designValue: "380", measuredValue: "375", unit: "V", toleranceMode: "percent", tolerancePct: "2" },
      expectPct: 98.68,
      expectLo: 372.4,
    },
    {
      input: { designValue: "100", measuredValue: "94", unit: "A", toleranceMode: "absolute", toleranceAbs: "7" },
      expectPct: 94,
      expectLo: 93,
    },
  ];

  cases.forEach((c, row) => {
    it(`field-compare ${row + 1}행`, () => {
      const out = calculateFieldCompare(c.input as unknown as CalcInput, 2);
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      const guide = getCalculatorGuide("field-compare")!;
      const table = guide.lookup!.rows[row].slice(1).flatMap((cell) => numbersIn(cell));
      expect(table[0]).toBeCloseTo(metricNum(out, "pct"), 2);
      expect(metricNum(out, "lo")).toBeCloseTo(c.expectLo, 2);
      const walkNums = numbersIn(guide.walkthroughs![row].lines.join(" "));
      expect(walkNums).toContain(metricNum(out, "pct"));
    });
  });
});

describe("Phase 3B-2B-3 메타·안내형", () => {
  const slugs = ["load-schedule", "arc-flash", "field-compare"] as const;

  it("FAQ 4·가이드·sitemap 링크", () => {
    const paths = new Set(sitemapEntries());
    for (const slug of slugs) {
      const tool = getToolBySlug(slug);
      const guide = getCalculatorGuide(slug);
      expect(tool?.faqs.length).toBe(4);
      expect(tool?.metaTitle).toBeTruthy();
      expect(guide?.walkthroughs?.length).toBe(3);
      expect(guide?.lookup?.rows.length).toBe(3);
      for (const link of guide?.links ?? []) {
        expect(paths.has(link.href), link.href).toBe(true);
      }
    }
  });

  it("arc-flash Incident Energy 미산출", () => {
    const body = JSON.stringify(getCalculatorGuide("arc-flash"));
    expect(body).toMatch(/Incident Energy|입사에너지/i);
    expect(body).not.toMatch(/cal\/cm²\s*=\s*\d/);
    expect(getToolBySlug("arc-flash")?.metaDescription).toMatch(/계산하지 않습니다/);
  });

  it("load-schedule 브라우저 저장 범위를 설명하고 내부 저장 키는 노출하지 않는다", () => {
    const guide = JSON.stringify(getCalculatorGuide("load-schedule"));
    expect(guide).toContain("브라우저 저장소");
    expect(guide).toContain("동기화되지 않습니다");
    expect(guide).not.toContain("voltdesk:load-schedule");
  });
});

describe("Phase 3B-2B 10종 가이드 존재", () => {
  const ten = [
    "voltage-drop",
    "motor-starting",
    "ups-backup-time",
    "ups-capacity",
    "grounding-rod",
    "spd-helper",
    "short-circuit",
    "load-schedule",
    "arc-flash",
    "field-compare",
  ] as const;

  it.each(ten)("%s 가이드·FAQ≥4", (slug) => {
    expect(getCalculatorGuide(slug)).toBeTruthy();
    expect(getToolBySlug(slug)?.faqs.length ?? 0).toBeGreaterThanOrEqual(4);
  });
});
