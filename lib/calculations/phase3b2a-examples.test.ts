/**
 * Phase 3B-2A — 8개 계산기 formula.example · 가이드 수치 ↔ 엔진 정합.
 * 독립적인 3상 손실 수식과 엔진·콘텐츠의 정합성을 검사합니다.
 */
import { describe, expect, it } from "vitest";
import {
  calculateEquipmentUtilization,
  calculateEstimatedEnergyCost,
  calculateGeneratorFuel,
  calculateGenStartVoltageDrop,
} from "@/lib/calculations/facility-extra";
import { radialLoadFlow } from "@/lib/calculations/schedules";
import {
  calculateLightingPowerDensity,
  calculateSoilResistivity,
  calculateSolarPv,
} from "@/lib/calculations/site-tools";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getFormulaById } from "@/lib/data/formulas";
import { getArticleById } from "@/lib/data/articles";
import { getToolBySlug } from "@/lib/data/tools";
import { calculatorGuides } from "@/lib/data/calculator-guides";
import { sitemapEntries } from "@/lib/seo";
import type { CalcInput } from "@/lib/calculations/parse";

const numbersIn = (text: string) => (text.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

describe("24개 lookup 행·walkthrough 결과 직접 대조", () => {
  const cases = [
    { slug: "soil-resistivity", engine: calculateSoilResistivity, inputs: [
      { spacing: "5", resistance: "3.2" }, { spacing: "2", resistance: "4" }, { spacing: "10", resistance: "2" },
    ], metrics: ["rho"], walkthroughRows: [0, 1, 2] },
    { slug: "solar-pv", engine: calculateSolarPv, inputs: [12, 24, 36].map((dailyKwh) => ({
      mode: "grid", dailyKwh: String(dailyKwh), psh: "3.8", efficiency: "0.78", panelW: "450",
    })), metrics: ["kwp", "n", "gen"], walkthroughRows: [1, 0, 2] },
    { slug: "lighting-density", engine: calculateLightingPowerDensity, inputs: [480, 960, 1920].map((watts) => ({
      watts: String(watts), area: "96",
    })), metrics: ["lpd"], walkthroughRows: [1, 0, 2] },
    { slug: "generator-fuel", engine: calculateGeneratorFuel, inputs: [160, 320, 480].map((loadKw) => ({
      mode: "estimate", loadKw: String(loadKw), hours: "8", litersPerKwh: "0.28",
    })), metrics: ["lph", "total"], walkthroughRows: [1, 0, 2] },
    { slug: "generator-start-vd", engine: calculateGenStartVoltageDrop, inputs: [100, 180, 250].map((motorKva) => ({
      genKva: "500", xd: "0.2", motorKva: String(motorKva),
    })), metrics: ["dv"], walkthroughRows: [1, 0, 2] },
    { slug: "equipment-load", engine: calculateEquipmentUtilization, inputs: [30, 42, 60].map((avgKw) => ({
      ratedKw: "75", avgKw: String(avgKw), runHours: "420", periodHours: "730",
    })), metrics: ["lf", "uf"], walkthroughRows: [1, 0, 2] },
    { slug: "energy-cost", engine: calculateEstimatedEnergyCost, inputs: [10000, 15000, 20000].map((kwh) => ({
      mode: "bill", kwh: String(kwh), demandKw: "92", energyPrice: "140", demandPrice: "7000",
    })), metrics: ["e", "d", "total"], walkthroughRows: [1, 0, 2] },
  ];
  for (const entry of cases) {
    entry.inputs.forEach((input, row) => {
      it(`${entry.slug} lookup ${row + 1}행과 대응 walkthrough`, () => {
        const guide = getCalculatorGuide(entry.slug)!;
        const result = entry.engine(input as CalcInput, 2);
        const table = guide.lookup!.rows[row].slice(1).map((cell) => numbersIn(cell)[0]);
        expect(table).toEqual(entry.metrics.map((id) => metricNum(result, id)));
        const walkthrough = guide.walkthroughs![entry.walkthroughRows[row]];
        const values = numbersIn(walkthrough.lines.join(" "));
        for (const id of entry.metrics) expect(values, `${entry.slug}: ${id}`).toContain(metricNum(result, id));
      });
    });
  }
  [25, 50, 100].forEach((p, row) => {
    it(`load-flow lookup ${row + 1}행과 대응 walkthrough`, () => {
      const result = radialLoadFlow(
        [{ id: "B1", loadKw: 0, loadKvar: 0 }, { id: "B2", loadKw: p, loadKvar: p * 0.4 }],
        [{ from: "B1", to: "B2", r: 0.08, x: 0.04 }], 380,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error);
      // P/Q는 3상 합산값. 독립식: S²=3V_LL²I², 따라서 3I²R=R(P²+Q²)/V_LL².
      const pW = p * 1000;
      const qVar = pW * 0.4;
      const voltagePct = Math.sqrt(380 ** 2 - 2 * (0.08 * pW + 0.04 * qVar)) / 380 * 100;
      const currentA = Math.hypot(pW, qVar) / (Math.sqrt(3) * 380);
      const lossKw = 0.08 * (pW ** 2 + qVar ** 2) / 380 ** 2 / 1000;
      expect(result.totalLossKw).toBeCloseTo(lossKw, 10);
      const expected = [Number(voltagePct.toFixed(2)), Number(currentA.toFixed(2)), Number(lossKw.toFixed(3))];
      const guide = getCalculatorGuide("load-flow")!;
      expect(guide.lookup!.rows[row].slice(1).map((cell) => numbersIn(cell)[0])).toEqual(expected);
      const values = numbersIn(guide.walkthroughs![[1, 0, 2][row]].lines.join(" "));
      for (const value of expected) expect(values).toContain(value);
    });
  });
});

function metricNum(outcome: { ok: boolean; metrics?: { id: string; value: string | number }[] }, id: string): number {
  if (!outcome.ok || !outcome.metrics) throw new Error(`engine fail for ${id}`);
  const raw = outcome.metrics.find((m) => m.id === id)?.value;
  return Number(String(raw).replace(/,/g, ""));
}

function exampleBlob(formulaId: string): string {
  const ex = getFormulaById(formulaId)?.example;
  return JSON.stringify(ex ?? {});
}

function guideBlob(slug: string): string {
  return JSON.stringify(getCalculatorGuide(slug) ?? {});
}

const phase3b2a = [
  "soil-resistivity",
  "solar-pv",
  "lighting-density",
  "generator-fuel",
  "generator-start-vd",
  "equipment-load",
  "energy-cost",
  "load-flow",
] as const;

describe("Phase 3B-2A 실무 예제 ↔ 엔진", () => {
  it("soil-resistivity a=5·R=3.2 → 100.53 (lookup 3행)", () => {
    expect(metricNum(calculateSoilResistivity({ spacing: "5", resistance: "3.2" }, 2), "rho")).toBe(100.53);
    expect(metricNum(calculateSoilResistivity({ spacing: "2", resistance: "4" }, 2), "rho")).toBe(50.27);
    expect(metricNum(calculateSoilResistivity({ spacing: "10", resistance: "2" }, 2), "rho")).toBe(125.66);
    expect(exampleBlob("formula-soil")).toContain("100.53");
    expect(guideBlob("soil-resistivity")).toContain("100.53");
    expect(guideBlob("soil-resistivity")).toContain("50.27");
    expect(guideBlob("soil-resistivity")).toContain("125.66");
  });

  it("solar-pv 24kWh·PSH3.8·η0.78·450W → 8.1·18·24.01", () => {
    const out = calculateSolarPv(
      { mode: "grid", dailyKwh: "24", psh: "3.8", panelW: "450", efficiency: "0.78" },
      2,
    );
    expect(metricNum(out, "kwp")).toBe(8.1);
    expect(metricNum(out, "n")).toBe(18);
    expect(metricNum(out, "gen")).toBe(24.01);
    expect(metricNum(out, "inv")).toBe(8.91);

    const a = calculateSolarPv(
      { mode: "grid", dailyKwh: "12", psh: "3.8", panelW: "450", efficiency: "0.78" },
      2,
    );
    expect(metricNum(a, "kwp")).toBe(4.05);
    expect(metricNum(a, "n")).toBe(9);
    expect(metricNum(a, "gen")).toBe(12);

    const b = calculateSolarPv(
      { mode: "grid", dailyKwh: "36", psh: "3.8", panelW: "450", efficiency: "0.78" },
      2,
    );
    expect(metricNum(b, "kwp")).toBe(12.15);
    expect(metricNum(b, "n")).toBe(27);
    expect(metricNum(b, "gen")).toBe(36.01);

    expect(exampleBlob("formula-solar")).toContain("8.1");
    expect(exampleBlob("formula-solar")).toContain("18");
    expect(guideBlob("solar-pv")).toContain("8.1 kWp");
    expect(guideBlob("solar-pv")).toContain("24.01");
  });

  it("lighting-density 960/96 → 10 W/m² · 604,800원", () => {
    const out = calculateLightingPowerDensity(
      { watts: "960", area: "96", oldWatts: "2400", hours: "3000", price: "140" },
      2,
    );
    expect(metricNum(out, "lpd")).toBe(10);
    expect(metricNum(out, "save")).toBe(1440);
    expect(metricNum(out, "kwh")).toBe(4320);
    expect(metricNum(out, "won")).toBe(604800);
    expect(metricNum(calculateLightingPowerDensity({ watts: "480", area: "96" }, 2), "lpd")).toBe(5);
    expect(metricNum(calculateLightingPowerDensity({ watts: "1920", area: "96" }, 2), "lpd")).toBe(20);
    expect(exampleBlob("formula-lpd")).toContain("10");
    expect(exampleBlob("formula-lpd")).toContain("604,800");
    expect(guideBlob("lighting-density")).toContain("604,800");
  });

  it("generator-fuel 320·8·0.28 → 716.8 L", () => {
    const out = calculateGeneratorFuel(
      { mode: "estimate", loadKw: "320", hours: "8", litersPerKwh: "0.28" },
      2,
    );
    expect(metricNum(out, "lph")).toBe(89.6);
    expect(metricNum(out, "total")).toBe(716.8);
    expect(metricNum(calculateGeneratorFuel({ mode: "estimate", loadKw: "160", hours: "8", litersPerKwh: "0.28" }, 2), "total")).toBe(358.4);
    expect(metricNum(calculateGeneratorFuel({ mode: "estimate", loadKw: "480", hours: "8", litersPerKwh: "0.28" }, 2), "total")).toBe(1075.2);
    expect(exampleBlob("formula-generator-fuel")).toContain("716.8");
    expect(guideBlob("generator-fuel")).toContain("716.8");
  });

  it("generator-start-vd 500·0.2·180 → 7.2%", () => {
    expect(metricNum(calculateGenStartVoltageDrop({ genKva: "500", xd: "0.2", motorKva: "180" }, 2), "dv")).toBe(7.2);
    expect(metricNum(calculateGenStartVoltageDrop({ genKva: "500", xd: "0.2", motorKva: "100" }, 2), "dv")).toBe(4);
    expect(metricNum(calculateGenStartVoltageDrop({ genKva: "500", xd: "0.2", motorKva: "250" }, 2), "dv")).toBe(10);
    expect(exampleBlob("formula-generator-start-vd")).toContain("7.2");
    expect(guideBlob("generator-start-vd")).toContain("7.2");
  });

  it("equipment-load 75·42·420/730 → 56% · 57.53%", () => {
    const out = calculateEquipmentUtilization(
      { ratedKw: "75", avgKw: "42", runHours: "420", periodHours: "730" },
      2,
    );
    expect(metricNum(out, "lf")).toBe(56);
    expect(metricNum(out, "uf")).toBe(57.53);
    expect(metricNum(calculateEquipmentUtilization({ ratedKw: "75", avgKw: "30", runHours: "420", periodHours: "730" }, 2), "lf")).toBe(40);
    expect(metricNum(calculateEquipmentUtilization({ ratedKw: "75", avgKw: "60", runHours: "420", periodHours: "730" }, 2), "lf")).toBe(80);
    expect(exampleBlob("formula-equipment-load")).toContain("57.53");
    expect(guideBlob("equipment-load")).toContain("57.53");
    expect(exampleBlob("formula-equipment-load")).not.toMatch(/57\.5%/);
  });

  it("energy-cost 15000·92·140·7000 → 2,744,000원", () => {
    const out = calculateEstimatedEnergyCost(
      { mode: "bill", kwh: "15000", demandKw: "92", energyPrice: "140", demandPrice: "7000" },
      2,
    );
    expect(metricNum(out, "total")).toBe(2744000);
    expect(metricNum(out, "e")).toBe(2100000);
    expect(metricNum(out, "d")).toBe(644000);
    expect(
      metricNum(
        calculateEstimatedEnergyCost(
          { mode: "bill", kwh: "10000", demandKw: "92", energyPrice: "140", demandPrice: "7000" },
          2,
        ),
        "total",
      ),
    ).toBe(2044000);
    expect(
      metricNum(
        calculateEstimatedEnergyCost(
          { mode: "bill", kwh: "20000", demandKw: "92", energyPrice: "140", demandPrice: "7000" },
          2,
        ),
        "total",
      ),
    ).toBe(3444000);
    expect(exampleBlob("formula-energy-cost")).toContain("2,744,000");
    expect(guideBlob("energy-cost")).toContain("2,744,000");
  });

  it("load-flow 50kW/20kvar · R0.08 X0.04 → 96.62% · 81.82A · 1.607kW", () => {
    const base = (p: number, q: number) =>
      radialLoadFlow(
        [
          { id: "B1", loadKw: 0, loadKvar: 0 },
          { id: "B2", loadKw: p, loadKvar: q },
        ],
        [{ from: "B1", to: "B2", r: 0.08, x: 0.04 }],
        380,
      );

    const mid = base(50, 20);
    expect(mid.ok).toBe(true);
    if (mid.ok) {
      const b2 = mid.buses.find((b) => b.id === "B2")!;
      expect(Number(b2.vPct.toFixed(2))).toBe(96.62);
      expect(Number(mid.branches[0].iA.toFixed(2))).toBe(81.82);
      expect(Number(mid.totalLossKw.toFixed(3))).toBe(1.607);
    }

    const lo = base(25, 10);
    expect(lo.ok).toBe(true);
    if (lo.ok) {
      expect(Number(lo.buses.find((b) => b.id === "B2")!.vPct.toFixed(2))).toBe(98.32);
      expect(Number(lo.branches[0].iA.toFixed(2))).toBe(40.91);
      expect(Number(lo.totalLossKw.toFixed(3))).toBe(0.402);
    }

    const hi = base(100, 40);
    expect(hi.ok).toBe(true);
    if (hi.ok) {
      expect(Number(hi.buses.find((b) => b.id === "B2")!.vPct.toFixed(2))).toBe(93.11);
      expect(Number(hi.branches[0].iA.toFixed(2))).toBe(163.64);
      expect(Number(hi.totalLossKw.toFixed(3))).toBe(6.427);
    }

    expect(exampleBlob("formula-load-flow")).toContain("96.62");
    expect(exampleBlob("formula-load-flow")).toContain("81.82");
    expect(exampleBlob("formula-load-flow")).toContain("1.607");
    expect(guideBlob("load-flow")).toContain("96.62");
    expect(guideBlob("load-flow")).toContain("1.607");
  });
});

describe("Phase 3B-2A 메타·콘텐츠 무결성", () => {
  it("조류 가이드·예제·FAQ가 3상 전체 손실과 동일한 근사 한계를 설명한다", () => {
    const guide = guideBlob("load-flow");
    const faqs = JSON.stringify(getToolBySlug("load-flow")!.faqs);
    for (const content of [guide, faqs]) {
      expect(content).toContain("3I²R/1000");
      expect(content).toContain("3상 전체");
      expect(content).toContain("한 상 도체");
      expect(content).toContain("반올림 전");
      expect(content).toContain("반복 수렴");
      expect(content).toContain("상위 부하 되먹임");
      expect(content).toContain("물리적 해를 보장하지");
    }
    for (const content of [guide, faqs, exampleBlob("formula-load-flow")]) {
      expect(content).toContain("1.607");
      expect(content).not.toMatch(/0\.134|0\.536|2\.142/);
    }
  });
  it("8개 도구에 고유 가이드·메타·FAQ·링크가 있다", () => {
    const paths = new Set(sitemapEntries());
    const firstLines = new Set(calculatorGuides.map((g) => g.whenToUse[0]));
    expect(firstLines.size).toBe(calculatorGuides.length);

    for (const slug of phase3b2a) {
      const guide = getCalculatorGuide(slug);
      const tool = getToolBySlug(slug);
      expect(guide, slug).toBeTruthy();
      expect(tool?.metaTitle, slug).toBeTruthy();
      expect(tool?.metaDescription, slug).toBeTruthy();
      expect(tool?.metaTitle).not.toContain("|");
      expect(tool?.faqs.length).toBeGreaterThanOrEqual(3);
      expect(tool?.faqs.length).toBeLessThanOrEqual(5);
      expect(guide?.walkthroughs?.length).toBeGreaterThanOrEqual(3);
      for (const example of guide?.walkthroughs ?? []) {
        expect(example.lines.length).toBeGreaterThanOrEqual(3);
      }
      expect(guide?.lookup?.rows.length).toBeGreaterThanOrEqual(3);
      expect(guide?.links?.length).toBeGreaterThanOrEqual(3);
      expect(guide?.topics?.length).toBeGreaterThanOrEqual(2);
      expect(guide?.inputMeaning.length).toBeGreaterThanOrEqual(2);
      expect(guide?.interpretation.length).toBeGreaterThanOrEqual(2);
      expect(guide?.cautions.length).toBeGreaterThanOrEqual(3);
      for (const link of guide?.links ?? []) {
        expect(paths.has(link.href), `${slug} → ${link.href}`).toBe(true);
      }
      for (const id of tool?.relatedArticleIds ?? []) {
        expect(getArticleById(id), `${slug} article ${id}`).toBeTruthy();
      }
      for (const id of tool?.relatedToolIds ?? []) {
        expect(getToolBySlug(id.replace(/^tool-/, "")), `${slug} related ${id}`).toBeTruthy();
      }
    }
  });

  it("검색 의도를 유사 도구와 구분한다", () => {
    expect(getToolBySlug("lighting-density")?.metaDescription).toMatch(/W\/m²|LPD|조도/);
    expect(getToolBySlug("lux")?.metaTitle).toMatch(/조도|루멘/);
    expect(getToolBySlug("generator-fuel")?.metaTitle).toMatch(/연료/);
    expect(getToolBySlug("generator-start-vd")?.metaDescription).toMatch(/기동|Xpu|ΔV/);
    expect(getToolBySlug("voltage-drop")?.metaTitle).toMatch(/한 구간|전압강하/);
    expect(getToolBySlug("equipment-load")?.metaDescription).toMatch(/부하율|가동률/);
    expect(getToolBySlug("energy-cost")?.metaDescription).toMatch(/한전|청구|보증|단가/);
    expect(getToolBySlug("load-flow")?.metaDescription).toMatch(/방사형|DistFlow|KEC|보호/);
    expect(getToolBySlug("soil-resistivity")?.metaDescription).toMatch(/Wenner|100\.53|겉보기/);
    expect(getToolBySlug("solar-pv")?.metaDescription).toMatch(/8\.1|수익|요금/);
  });

  it("canonical(href)이 유지된다", () => {
    expect(getToolBySlug("soil-resistivity")?.href).toBe("/tools/electrical/soil-resistivity");
    expect(getToolBySlug("solar-pv")?.href).toBe("/tools/electrical/solar-pv");
    expect(getToolBySlug("lighting-density")?.href).toBe("/tools/electrical/lighting-density");
    expect(getToolBySlug("generator-fuel")?.href).toBe("/tools/facility/generator-fuel");
    expect(getToolBySlug("generator-start-vd")?.href).toBe("/tools/facility/generator-start-vd");
    expect(getToolBySlug("equipment-load")?.href).toBe("/tools/facility/equipment-load");
    expect(getToolBySlug("energy-cost")?.href).toBe("/tools/facility/energy-cost");
    expect(getToolBySlug("load-flow")?.href).toBe("/tools/electrical/load-flow");
  });
});
