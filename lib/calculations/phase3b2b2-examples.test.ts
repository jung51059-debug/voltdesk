/**
 * Phase 3B-2B-2 — grounding-rod, spd-helper, short-circuit
 * 3B-2B-1 회귀 포함 전체와 함께 실행됩니다.
 */
import { describe, expect, it } from "vitest";
import { calculateGroundingRod } from "@/lib/calculations/site-tools";
import { calculateShortCircuit } from "@/lib/calculations/short-circuit";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getToolBySlug } from "@/lib/data/tools";
import { sitemapEntries } from "@/lib/seo";
import type { CalcInput } from "@/lib/calculations/parse";

const numbersIn = (text: string) => (text.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

function metricNum(outcome: { ok: boolean; metrics?: { id: string; value: string | number }[] }, id: string): number {
  if (!outcome.ok || !outcome.metrics) throw new Error(`engine fail for ${id}`);
  const raw = outcome.metrics.find((m) => m.id === id)?.value;
  return Number(String(raw).replace(/,/g, ""));
}

describe("Phase 3B-2B-2 수치 가이드 ↔ 엔진", () => {
  const groundingCases = [
    { rho: "100", length: "2.4", diameter: "0.014", rods: "1", spaceFactor: "1", metrics: ["r", "r1"] as const },
    { rho: "100", length: "2.4", diameter: "0.014", rods: "2", spaceFactor: "1.2", metrics: ["r", "r1"] as const },
    { rho: "50", length: "3", diameter: "0.016", rods: "1", spaceFactor: "1", metrics: ["r", "r1"] as const },
  ];

  groundingCases.forEach((entry, row) => {
    it(`grounding-rod lookup ${row + 1}행`, () => {
      const guide = getCalculatorGuide("grounding-rod")!;
      const { metrics, ...input } = entry;
      const result = calculateGroundingRod(input as CalcInput, 2);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const table = guide.lookup!.rows[row].slice(1).flatMap((cell) => numbersIn(cell));
      const expected = metrics.map((id) => metricNum(result, id));
      expected.forEach((value, i) => expect(table[i]).toBeCloseTo(value, 2));
      const walk = guide.walkthroughs![row];
      for (const value of expected) {
        expect(numbersIn(walk.lines.join(" "))).toContain(value);
      }
    });
  });

  const shortCommon = {
    voltage: "380",
    voltageUnit: "V",
    cFactor: "1.05",
    includeTr: "yes",
    trXr: "8",
    includeSource: "no",
    includeGen: "no",
    includeMotor: "no",
  };
  const shortCases = [
    { trKva: "500", trZpct: "4.5", includeCable: "no", metrics: ["ik", "ip"] as const },
    {
      trKva: "500",
      trZpct: "4.5",
      includeCable: "yes",
      cableM: "40",
      cableR: "0.193",
      cableX: "0.075",
      metrics: ["ik", "ip"] as const,
    },
    { trKva: "200", trZpct: "4", includeCable: "no", metrics: ["ik", "ip"] as const },
  ];

  shortCases.forEach((item, row) => {
    it(`short-circuit lookup ${row + 1}행`, () => {
      const guide = getCalculatorGuide("short-circuit")!;
      const { metrics, ...rest } = item;
      const input = { ...shortCommon, ...rest } as CalcInput;
      const result = calculateShortCircuit(input, 2);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const table = guide.lookup!.rows[row].slice(1).flatMap((cell) => numbersIn(cell));
      const expected = metrics.map((id) => metricNum(result, id));
      expected.forEach((value, i) => expect(table[i]).toBeCloseTo(value, 2));
    });
  });
});

describe("Phase 3B-2B-2 메타·FAQ·가이드", () => {
  const slugs = ["grounding-rod", "spd-helper", "short-circuit"] as const;

  it("3종 FAQ 4·가이드·링크", () => {
    const paths = new Set(sitemapEntries());
    for (const slug of slugs) {
      const guide = getCalculatorGuide(slug);
      const tool = getToolBySlug(slug);
      expect(guide, slug).toBeTruthy();
      expect(tool?.faqs.length, slug).toBe(4);
      expect(tool?.metaTitle, slug).toBeTruthy();
      expect(tool?.metaDescription, slug).toBeTruthy();
      expect(guide?.links?.length ?? 0, slug).toBeGreaterThanOrEqual(3);
      for (const link of guide?.links ?? []) {
        expect(paths.has(link.href), `${slug} → ${link.href}`).toBe(true);
      }
    }
  });

  it("spd-helper는 선정 수치·lookup 허구 kA 없음", () => {
    const guide = getCalculatorGuide("spd-helper")!;
    expect(guide.lookup?.note).toMatch(/산출|자동/i);
    const body = JSON.stringify(guide);
    expect(body).toMatch(/체크리스트|간이/i);
    expect(body).not.toMatch(/Ik″/);
  });

  it("short-circuit 가이드 자동 선정 부정", () => {
    expect(getCalculatorGuide("short-circuit")?.interpretation.some((p) => p.includes("자동 선정"))).toBe(true);
  });

  it("grounding-rod 메타 예시 25.98", () => {
    expect(getToolBySlug("grounding-rod")?.metaDescription).toContain("25.98");
  });
});