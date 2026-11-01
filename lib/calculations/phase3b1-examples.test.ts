/**
 * Phase 3B-1 — formula.example(실무 예제) · 가이드 수치 ↔ 엔진 정합.
 * 엔진·공식을 바꾸지 않고 콘텐츠 마커만 검사합니다.
 */
import { describe, expect, it } from "vitest";
import { calculateBreakerReference, calculateCableResistance, calculateThreePhaseCurrent } from "@/lib/calculations/engines";
import { calculateMotorCurrent, calculateMotorStartVoltageDrop } from "@/lib/calculations/motor";
import { calculateCableSizing } from "@/lib/calculations/cable-tools";
import { calculateHarmonicFilterReview, calculatePowerFactorCorrection } from "@/lib/calculations/power-quality";
import {
  calculateTransformerCurrents,
  calculateTransformerSizing,
} from "@/lib/calculations/transformer-tools";
import { calculateEarthConductor, calculateLux } from "@/lib/calculations/site-tools";
import { calculatePathVoltageDrop, emptyPathSegment } from "@/lib/calculations/path-voltage-drop";
import { calculatePtRatio, calculateSoftStarter } from "@/lib/calculations/protection";
import { calculateSinglePhaseCurrent } from "@/lib/calculations/engines";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getFormulaById } from "@/lib/data/formulas";
import { getPublishedTools, getToolBySlug } from "@/lib/data/tools";

function metricNum(outcome: { ok: boolean; metrics?: { id: string; value: string | number }[] }, id: string): number {
  if (!outcome.ok || !outcome.metrics) throw new Error(`engine fail for ${id}`);
  const raw = outcome.metrics.find((m) => m.id === id)?.value;
  return Number(String(raw).replace(/,/g, ""));
}

function exampleBlob(formulaId: string): string {
  const ex = getFormulaById(formulaId)?.example;
  return JSON.stringify(ex ?? {});
}

describe("Phase 3B-1 실무 예제 ↔ 엔진", () => {
  it("motor-current 실무 예제는 58.29 A (58.1 금지)", () => {
    const out = calculateMotorCurrent(
      { phase: "3", power: "30", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.85", efficiency: "0.92" },
      2,
    );
    expect(metricNum(out, "flc")).toBe(58.29);
    const blob = exampleBlob("formula-motor-current");
    expect(blob).toContain("58.29");
    expect(blob).not.toMatch(/58\.1\b/);
  });

  it("single-phase / pt / lux / soft / earth / cable-sizing 예제 마커", () => {
    expect(metricNum(calculateSinglePhaseCurrent({ power: "3", powerUnit: "kW", voltage: "220", voltageUnit: "V", pf: "1", efficiency: "1" }, 2), "current")).toBe(13.64);
    expect(exampleBlob("formula-single-phase-current")).toContain("13.64");

    expect(metricNum(calculatePtRatio({ vPrimary: "22900", vPrimaryUnit: "V", vSecondary: "110", vSecondaryUnit: "V" }, 2), "n")).toBe(208.18);
    expect(exampleBlob("formula-pt-ratio")).toContain("208.18");
    expect(exampleBlob("formula-pt-ratio")).not.toMatch(/208\.2\b/);

    expect(metricNum(calculateLux({ length: "12", width: "8", lux: "300", lumens: "3200", uf: "0.55", mf: "0.8" }, 2), "n")).toBe(21);
    expect(exampleBlob("formula-lux")).toContain("21");

    expect(metricNum(calculateSoftStarter({ flc: "60", startMult: "3.5", startSec: "8", startsPerHour: "4" }, 2), "istart")).toBe(210);
    expect(exampleBlob("formula-soft-starter")).toContain("210");

    expect(metricNum(calculateEarthConductor({ faultA: "5000", time: "0.5", kFactor: "143" }, 2), "s")).toBe(24.72);
    expect(exampleBlob("formula-earth-conductor")).toContain("24.72");

    const cable = calculateCableSizing(
      {
        mode: "basic",
        phase: "3",
        power: "45",
        powerUnit: "kW",
        voltage: "380",
        pf: "0.85",
        efficiency: "1",
        demand: "1",
        length: "80",
        allowPct: "3",
        material: "cu",
      },
      2,
    );
    expect(metricNum(cable, "ib")).toBe(80.44);
    expect(metricNum(cable, "amin")).toBe(17.11);
    const cableEx = exampleBlob("formula-cable-sizing");
    expect(cableEx).toContain("80.44");
    expect(cableEx).toContain("17.11");
    expect(cableEx).toMatch(/전압강하|amin|하한/);
  });

  it("transformer-sizing detailed need와 상용 후보를 구분한다", () => {
    const tr = calculateTransformerSizing(
      { demandKw: "720", pf: "0.9", designMargin: "0.1", futureMargin: "0.15", distLoss: "0.03", mode: "detailed" },
      2,
    );
    expect(metricNum(tr, "need")).toBe(1042.36);
    const blob = exampleBlob("formula-transformer-sizing");
    expect(blob).toContain("1,042.36");
    expect(blob).toMatch(/1,?500/);
    expect(blob).toMatch(/필요|≠|상용/);
  });

  it("transformer-current · harmonic-filter · breaker · cable-resistance · motor-start-vd", () => {
    const trc = calculateTransformerCurrents(
      { ratedKva: "1000", vPrimary: "22.9", vPrimaryUnit: "kV", vSecondary: "380", vSecondaryUnit: "V" },
      2,
    );
    expect(metricNum(trc, "i2")).toBe(1519.34);
    expect(metricNum(trc, "i1")).toBe(25.21);
    expect(exampleBlob("formula-transformer-current")).toContain("1,519.34");

    expect(metricNum(calculateHarmonicFilterReview({ qc: "100", voltage: "380", voltageUnit: "V", reactorPct: "7" }, 2), "n")).toBe(3.78);
    expect(exampleBlob("formula-harmonic-filter")).toContain("3.78");
    expect(exampleBlob("formula-harmonic-filter")).not.toMatch(/약 3\.8/);

    const br = calculateBreakerReference({ current: "87", margin: "1.25" }, 2);
    expect(metricNum(br, "min")).toBe(108.75);
    expect(exampleBlob("formula-breaker-ref")).toContain("108.75");

    const cr = calculateCableResistance({ material: "cu", area: "35", length: "100", lengthUnit: "m" }, 2);
    expect(metricNum(cr, "R")).toBe(0.05);
    expect(metricNum(cr, "rkm")).toBe(0.5);
    expect(exampleBlob("formula-cable-resistance")).toContain("0.05");

    const msvd = calculateMotorStartVoltageDrop(
      { flc: "60", multiplier: "6", length: "80", resistance: "0.524", voltage: "380", phase: "3" },
      2,
    );
    expect(metricNum(msvd, "dv")).toBe(26.14);
    expect(metricNum(msvd, "pct")).toBe(6.88);
    expect(exampleBlob("formula-motor-start-vd")).toContain("26.14");
  });

  it("path-voltage-drop 한 구간·3구간 예제가 엔진과 같다", () => {
    const one = calculatePathVoltageDrop(
      {
        startKind: "meter-2nd",
        startLabel: "계량기 2차",
        kecReview: false,
        kecScope: "utility",
        kecSupply: "lv",
        kecLoad: "other",
        kecDuty: "normal",
        segments: [{ ...emptyPathSegment(0), lengthM: 80, currentA: 80, resistanceOhmKm: 0.727, phase: "3", voltageV: 380 }],
      },
      2,
    );
    expect(metricNum(one, "dv")).toBe(8.06);
    expect(metricNum(one, "pct")).toBe(2.12);

    const three = calculatePathVoltageDrop(
      {
        startKind: "meter-2nd",
        startLabel: "계량기 2차",
        kecReview: false,
        kecScope: "utility",
        kecSupply: "lv",
        kecLoad: "other",
        kecDuty: "normal",
        segments: [
          { ...emptyPathSegment(0), lengthM: 40, currentA: 80, resistanceOhmKm: 0.727, phase: "3", voltageV: 380 },
          { ...emptyPathSegment(1), lengthM: 60, currentA: 60, resistanceOhmKm: 0.727, phase: "3", voltageV: 380 },
          { ...emptyPathSegment(2), lengthM: 60, currentA: 40, resistanceOhmKm: 0.727, phase: "3", voltageV: 380 },
        ],
      },
      2,
    );
    expect(metricNum(three, "dv")).toBe(11.58);
    expect(metricNum(three, "pct")).toBe(3.05);

    const blob = exampleBlob("formula-path-voltage-drop");
    expect(blob).toContain("11.58");
    expect(blob).toContain("8.06");
    expect(JSON.stringify(getCalculatorGuide("path-voltage-drop"))).toContain("11.58 V");
  });

  it("three-phase 기본 입력(45 kW)과 FAQ 예(30 kW)를 구분한다", () => {
    const def = calculateThreePhaseCurrent(
      { power: "45", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.85", efficiency: "0.92" },
      2,
    );
    expect(metricNum(def, "current")).toBe(87.43);
    expect(exampleBlob("formula-three-phase-current")).toContain("87.43");

    const faq = calculateThreePhaseCurrent(
      { power: "30", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.9", efficiency: "1" },
      2,
    );
    expect(metricNum(faq, "current")).toBe(50.64);
    expect(JSON.stringify(getCalculatorGuide("three-phase-current"))).toContain("50.64");
    expect(exampleBlob("formula-three-phase-current")).toMatch(/50\.64|조건이 다름/);
  });
});

describe("Phase 3B-1 메타·콘텐츠 무결성", () => {
  it("published 도구는 68개이며 formula.example이 있다", () => {
    const tools = getPublishedTools();
    expect(tools).toHaveLength(68);
    for (const tool of tools) {
      const formula = getFormulaById(tool.formulaId);
      expect(formula, tool.slug).toBeTruthy();
      expect(formula?.example, `${tool.slug} example`).toBeTruthy();
    }
  });

  it("유사 도구 메타가 검색 의도를 구분한다", () => {
    expect(getToolBySlug("voltage-drop")?.metaTitle).toMatch(/한 구간/);
    expect(getToolBySlug("path-voltage-drop")?.metaTitle).toMatch(/경로|누적/);
    expect(getToolBySlug("cable-sizing")?.metaDescription).toMatch(/17\.11|amin|단면/);
    expect(getToolBySlug("cable-ampacity")?.metaTitle).toMatch(/허용전류|Iz/);
    expect(getToolBySlug("motor-current")?.metaDescription).toMatch(/58\.29/);
    expect(getToolBySlug("motor-starting")?.metaTitle).toMatch(/기동/);
    expect(getToolBySlug("transformer-load")?.metaDescription).toMatch(/부하율|용량 산정/);
    expect(getToolBySlug("transformer-sizing")?.metaTitle).toMatch(/용량/);
    expect(getToolBySlug("power-factor")?.relatedToolIds).toContain("tool-pfc");
    expect(getToolBySlug("power-factor-correction")?.metaTitle).toMatch(/kvar|개선/);
    expect(getToolBySlug("generator-load")?.metaTitle).toMatch(/부하율/);
    expect(getToolBySlug("generator-sizing")?.metaTitle).toMatch(/용량/);
  });

  it("금지된 구형 반올림이 실무 예제에 없다", () => {
    const banned: Array<[string, RegExp]> = [
      ["formula-motor-current", /58\.1\b/],
      ["formula-harmonic-filter", /약 3\.8/],
      ["formula-pt-ratio", /약 208\.2/],
      ["formula-earth-conductor", /"result":"mm²"/],
    ];
    for (const [id, re] of banned) {
      expect(exampleBlob(id), id).not.toMatch(re);
    }
  });

  it("power-factor-correction 실무 예제는 151.55 kvar", () => {
    const out = calculatePowerFactorCorrection({ powerKw: "320", pfNow: "0.78", pfTarget: "0.95" }, 2);
    expect(metricNum(out, "qc")).toBe(151.55);
    expect(exampleBlob("formula-pfc")).toContain("151.55");
  });
});
