/**
 * Phase 3B-2B-1 — voltage-drop, motor-starting, ups-backup-time, ups-capacity
 * 가이드·FAQ·메타 ↔ 엔진 정합 (엔진 변경 없음).
 */
import { describe, expect, it } from "vitest";
import { calculateVoltageDrop, calculateUpsBackup, calculateUpsCapacity } from "@/lib/calculations/engines";
import { calculateMotorStartingReview } from "@/lib/calculations/motor";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getFormulaById } from "@/lib/data/formulas";
import { getToolBySlug } from "@/lib/data/tools";
import { sitemapEntries } from "@/lib/seo";
import type { CalcInput } from "@/lib/calculations/parse";

const numbersIn = (text: string) => (text.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

function metricNum(outcome: { ok: boolean; metrics?: { id: string; value: string | number }[] }, id: string): number {
  if (!outcome.ok || !outcome.metrics) throw new Error(`engine fail for ${id}`);
  const raw = outcome.metrics.find((m) => m.id === id)?.value;
  return Number(String(raw).replace(/,/g, ""));
}

describe("12개 lookup 행·walkthrough ↔ 엔진", () => {
  const cases = [
    {
      slug: "voltage-drop" as const,
      engine: calculateVoltageDrop,
      inputs: [
        { phase: "3", current: "80", length: "80", voltage: "380", rMode: "ohm", resistance: "0.727" },
        { phase: "3", current: "100", length: "100", voltage: "380", rMode: "ohm", resistance: "0.524" },
        { phase: "1", current: "25", length: "40", voltage: "220", rMode: "ohm", resistance: "0.727" },
      ],
      metrics: ["dv", "pct"] as const,
      walkthroughRows: [0, 1, 2],
    },
    {
      slug: "motor-starting" as const,
      engine: calculateMotorStartingReview,
      inputs: [
        {
          flcMode: "known",
          flc: "60",
          method: "dol",
          multiplier: "6",
          phase: "3",
          voltage: "380",
          length: "80",
          resistance: "0.524",
        },
        { flcMode: "known", flc: "60", method: "dol", multiplier: "4", phase: "3", voltage: "380" },
        {
          flcMode: "from-nameplate",
          phase: "3",
          power: "30",
          powerUnit: "kW",
          voltage: "380",
          pf: "0.85",
          efficiency: "0.92",
          method: "dol",
          multiplier: "6",
          length: "80",
          resistance: "0.524",
        },
      ],
      metrics: ["istart", "pct"] as const,
      walkthroughRows: [0, 1, 2],
      optionalMetric: (row: number, result: ReturnType<typeof calculateMotorStartingReview>) => {
        if (row === 1) return [metricNum(result, "istart")];
        return [metricNum(result, "istart"), metricNum(result, "pct")];
      },
    },
    {
      slug: "ups-backup-time" as const,
      engine: calculateUpsBackup,
      inputs: [
        { mode: "battery", batteryV: "384", ah: "100", load: "20", loadUnit: "kW", efficiency: "0.92", dod: "0.8", aging: "1" },
        { mode: "battery", batteryV: "384", ah: "200", load: "20", loadUnit: "kW", efficiency: "0.92", dod: "0.8", aging: "1" },
        { mode: "energy", energy: "38.4", energyUnit: "kWh", load: "15", loadUnit: "kW", efficiency: "0.9", dod: "0.8", aging: "1" },
      ],
      metrics: ["min"] as const,
      walkthroughRows: [0, 1, 2],
    },
    {
      slug: "ups-capacity" as const,
      engine: calculateUpsCapacity,
      inputs: [
        { mode: "basic", loadKw: "40", pf: "0.8", growth: "0.25", outputPf: "0.9" },
        { mode: "basic", loadKw: "60", pf: "0.9", growth: "0.2", outputPf: "0.9" },
        { mode: "basic", loadKw: "30", pf: "0.95", growth: "0.15", outputPf: "1" },
      ],
      metrics: ["kva"] as const,
      walkthroughRows: [0, 1, 2],
    },
  ];

  for (const entry of cases) {
    entry.inputs.forEach((input, row) => {
      it(`${entry.slug} lookup ${row + 1}행·walkthrough`, () => {
        const guide = getCalculatorGuide(entry.slug)!;
        const result = entry.engine(input as CalcInput, 2);
        expect(result.ok).toBe(true);
        if (!result.ok) return;

        const table = guide
          .lookup!.rows[row]
          .slice(1)
          .flatMap((cell) => numbersIn(cell));
        const expected =
          entry.slug === "motor-starting" && row === 1
            ? [metricNum(result, "istart")]
            : entry.metrics.map((id) => metricNum(result, id));
        expect(table.length).toBe(expected.length);
        expected.forEach((value, i) => expect(table[i]).toBeCloseTo(value, 2));

        const walkthrough = guide.walkthroughs![entry.walkthroughRows[row]];
        const values = numbersIn(walkthrough.lines.join(" "));
        for (const value of expected) expect(values, `${entry.slug} row ${row}`).toContain(value);
      });
    });
  }
});

describe("Phase 3B-2B-1 메타·FAQ·콘텐츠", () => {
  const slugs = ["voltage-drop", "motor-starting", "ups-backup-time", "ups-capacity"] as const;

  it("4종 고유 가이드·walkthrough 3·lookup 3·FAQ 4", () => {
    const paths = new Set(sitemapEntries());
    for (const slug of slugs) {
      const guide = getCalculatorGuide(slug);
      const tool = getToolBySlug(slug);
      expect(guide, slug).toBeTruthy();
      expect(tool?.faqs.length, slug).toBe(4);
      expect(guide?.walkthroughs?.length, slug).toBe(3);
      expect(guide?.lookup?.rows.length, slug).toBe(3);
      expect(guide?.links?.length ?? 0, slug).toBeGreaterThanOrEqual(3);
      for (const link of guide?.links ?? []) {
        expect(paths.has(link.href), `${slug} → ${link.href}`).toBe(true);
      }
    }
  });

  it("UPS·전압강하 검색 의도 구분 메타", () => {
    expect(getToolBySlug("voltage-drop")?.metaTitle).toMatch(/한 구간/);
    expect(getToolBySlug("path-voltage-drop")?.metaTitle).toMatch(/경로|누적/);
    expect(getToolBySlug("ups-backup-time")?.metaTitle).toBeTruthy();
    expect(getToolBySlug("ups-capacity")?.metaTitle).toBeTruthy();
    expect(getToolBySlug("ups-backup-time")?.metaDescription).toContain("84.79");
    expect(getToolBySlug("ups-capacity")?.metaDescription).toContain("62.5");
    expect(getToolBySlug("motor-starting")?.metaTitle).toMatch(/기동/);
    expect(getToolBySlug("motor-current")?.metaDescription).toMatch(/58\.29/);
  });

  it("formula.example 기존 수치 유지", () => {
    expect(JSON.stringify(getFormulaById("formula-ups-backup")?.example)).toContain("84.79");
    const cap = getFormulaById("formula-ups-capacity")?.example;
    expect(cap?.result).toBe("53.33 kVA");
    const vd = calculateVoltageDrop(
      { phase: "3", current: "80", length: "80", voltage: "380", rMode: "ohm", resistance: "0.727" },
      2,
    );
    expect(metricNum(vd, "dv")).toBe(8.06);
    expect(JSON.stringify(getFormulaById("formula-voltage-drop")?.example)).toContain("8.06");
  });
});