/**
 * Phase 3D-2 — 공통 출처·가정·템플릿 정합성
 */
import { describe, expect, it } from "vitest";
import { getPublishedTools, getToolBySlug } from "@/lib/data/tools";
import { getFormulaById } from "@/lib/data/formulas";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { toolMetadata } from "@/lib/seo";
import {
  DEPRECATED_GENERIC_AC_ASSUMPTION,
  DEPRECATED_GENERIC_POWER_SOURCE_TITLE,
  formulaHasDeprecatedFallback,
  getToolContentProfile,
  shouldShowFormulaBlock,
} from "@/lib/data/tool-content-profile";
import { extraFormulas } from "@/lib/calculations/formulas-extra";

const PHASE3D1_P1_SLUGS = [
  "generator-sizing",
  "generator-fuel",
  "generator-start-vd",
  "battery-capacity",
  "equipment-load",
  "energy-intensity",
  "energy-cost",
  "pm-interval",
  "yoy-energy",
  "load-schedule",
  "cable-schedule",
  "panel-schedule",
  "arc-flash",
  "lightning-risk",
  "sld",
  "field-compare",
  "phase-unbalance",
  "generator-load-test",
  "duty-cycle",
  "sensor-calibration",
  "trend-analysis",
  "retrofit-compare",
] as const;

describe("Phase 3D-2 — f() fallback 제거", () => {
  it("extraFormulas에 deprecated 자동 주입 문구가 없다", () => {
    const bad = extraFormulas.filter((f) => formulaHasDeprecatedFallback(f));
    expect(bad.map((f) => f.id), bad.map((f) => f.id).join(", ")).toEqual([]);
  });

  it("명시적 referenceSources는 유지된다", () => {
    const motor = extraFormulas.find((f) => f.id === "formula-motor-current");
    expect(motor?.referenceSources.some((s) => s.title.includes("모터") || s.title.includes("전력"))).toBe(true);
  });
});

describe("Phase 3D-2 — 유형별 공식 표시", () => {
  it("체크리스트형은 공식 블록 숨김", () => {
    for (const slug of ["lightning-risk", "arc-flash"] as const) {
      const tool = getToolBySlug(slug)!;
      const formula = getFormulaById(tool.formulaId)!;
      expect(shouldShowFormulaBlock(getToolContentProfile(slug), formula), slug).toBe(false);
    }
  });

  it("도면·목록 전용은 공식 블록 숨김", () => {
    expect(shouldShowFormulaBlock(getToolContentProfile("sld"), getFormulaById("formula-sld")!)).toBe(false);
    expect(shouldShowFormulaBlock(getToolContentProfile("cable-schedule"), getFormulaById("formula-cable-schedule")!)).toBe(
      false,
    );
  });

  it("수치형 energy-intensity는 공식 블록 표시", () => {
    const formula = getFormulaById("formula-energy-intensity")!;
    expect(shouldShowFormulaBlock(getToolContentProfile("energy-intensity"), formula)).toBe(true);
    expect(formula.formula).toContain("kWh");
    expect(formula.assumptions).not.toContain(DEPRECATED_GENERIC_AC_ASSUMPTION);
    expect(formula.referenceSources.every((s) => s.title !== DEPRECATED_GENERIC_POWER_SOURCE_TITLE)).toBe(true);
  });

  it("스케줄 panel은 집계 공식 표시", () => {
    expect(shouldShowFormulaBlock(getToolContentProfile("panel-schedule"), getFormulaById("formula-panel-schedule")!)).toBe(
      true,
    );
  });
});

describe("Phase 3D-2 — published 68종 메타", () => {
  const published = getPublishedTools();

  it("68종", () => {
    expect(published).toHaveLength(68);
  });

  it("무관 fallback 없음 (3D-1 P1 22종)", () => {
    const offenders: string[] = [];
    for (const slug of PHASE3D1_P1_SLUGS) {
      const tool = getToolBySlug(slug);
      expect(tool?.status, slug).toBe("published");
      const formula = getFormulaById(tool!.formulaId)!;
      if (formulaHasDeprecatedFallback(formula)) offenders.push(slug);
      if (formula.assumptions.includes(DEPRECATED_GENERIC_AC_ASSUMPTION)) offenders.push(`${slug}:assumption`);
      if (formula.referenceSources.some((s) => s.title === DEPRECATED_GENERIC_POWER_SOURCE_TITLE)) offenders.push(`${slug}:src`);
    }
    expect(offenders, offenders.join(", ")).toEqual([]);
  });

  it("SEO meta·FAQ 유지", () => {
    for (const tool of published) {
      expect(tool.metaTitle?.trim(), tool.slug).toBeTruthy();
      expect(tool.metaDescription?.trim(), tool.slug).toBeTruthy();
      const meta = toolMetadata(tool);
      expect(meta.title).toBe(tool.metaTitle);
      expect(meta.alternates?.canonical).toBe(tool.href);
    }
  });

  it("가이드 등록 유지 (3C 이후 18종 포함)", () => {
    for (const slug of [...PHASE3D1_P1_SLUGS]) {
      expect(getCalculatorGuide(slug), slug).toBeTruthy();
    }
  });
});