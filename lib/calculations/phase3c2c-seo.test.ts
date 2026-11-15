/**
 * Phase 3C-2C — published 계산기 메타·SEO 정합성
 */
import { describe, expect, it } from "vitest";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getPublishedTools, getToolBySlug } from "@/lib/data/tools";
import { sitemapEntries, toolMetadata } from "@/lib/seo";
import { phase3c2cUsesMetaFallback } from "@/lib/calculations/phase3c3-seo-shared";

/** Phase 3C-1 감사 시 metaTitle·metaDescription 이 없던 18종 */
const PHASE3C1_NO_META_SLUGS = [
  "cable-resistance",
  "monthly-energy",
  "thd",
  "transformer-current",
  "battery-capacity",
  "energy-intensity",
  "pm-interval",
  "yoy-energy",
  "cable-schedule",
  "panel-schedule",
  "lightning-risk",
  "sld",
  "phase-unbalance",
  "generator-load-test",
  "duty-cycle",
  "sensor-calibration",
  "trend-analysis",
  "retrofit-compare",
] as const;

const PHASE3C2A_SLUGS = [
  "cable-schedule",
  "panel-schedule",
  "lightning-risk",
  "generator-load-test",
  "duty-cycle",
  "retrofit-compare",
] as const;

const PHASE3C2B_SLUGS = [
  "energy-intensity",
  "pm-interval",
  "yoy-energy",
  "sld",
  "sensor-calibration",
  "trend-analysis",
] as const;

/** 3C-2C에서 신규로 meta만 추가한 6종 (3C-2A/2B 제외) */
const PHASE3C2C_META_ONLY = [
  "cable-resistance",
  "monthly-energy",
  "thd",
  "transformer-current",
  "battery-capacity",
  "phase-unbalance",
] as const;

/** 가이드·엔진 예제와 메타에 같이 실리는 대표 수치 (허구 금지) */
const META_ENGINE_MARKERS: Record<string, string[]> = {
  "cable-resistance": ["0.4029", "Ω/km"],
  "monthly-energy": ["8.14"],
  "thd": ["17.01"],
  "transformer-current": ["1139.51", "65.61"],
  "battery-capacity": ["163.4", "7.84"],
  "phase-unbalance": ["2.73"],
  "energy-intensity": ["4.00"],
  "generator-load-test": ["276.44"],
  "duty-cycle": ["33.3"],
  "retrofit-compare": ["28000"],
  "yoy-energy": ["+20%"],
  "sensor-calibration": ["0.8"],
  "trend-analysis": ["40"],
};

describe("Phase 3C-2C SEO — 전체 published", () => {
  const published = getPublishedTools();
  const paths = new Set(sitemapEntries());

  it("모든 published에 고유 metaTitle·metaDescription이 있다", () => {
    const fallback: string[] = [];
    for (const tool of published) {
      if (phase3c2cUsesMetaFallback(tool)) fallback.push(tool.slug);
      expect(tool.metaTitle?.trim(), tool.slug).toBeTruthy();
      expect(tool.metaDescription?.trim(), tool.slug).toBeTruthy();
      expect(tool.metaTitle).not.toContain("|");
    }
    expect(fallback, `fallback: ${fallback.join(", ")}`).toEqual([]);
  });

  it("metaTitle·metaDescription 중복 없음", () => {
    const titles = published.map((t) => t.metaTitle!.trim());
    const descs = published.map((t) => t.metaDescription!.trim());
    const dupTitle = titles.filter((v, i, a) => a.indexOf(v) !== i);
    const dupDesc = descs.filter((v, i, a) => a.indexOf(v) !== i);
    expect([...new Set(dupTitle)]).toEqual([]);
    expect([...new Set(dupDesc)]).toEqual([]);
  });

  it("toolMetadata canonical·title·description 정합", () => {
    for (const tool of published) {
      const meta = toolMetadata(tool);
      expect(meta.title).toBe(tool.metaTitle);
      expect(meta.description).toBe(tool.metaDescription);
      expect(meta.alternates?.canonical).toBe(tool.href);
      if (tool.status === "published") {
        expect(meta.robots).toBeUndefined();
      }
      expect(paths.has(tool.href), tool.slug).toBe(true);
    }
  });
});

describe("Phase 3C-1 18종 현재 상태", () => {
  it("전원 meta 보유·fallback 없음", () => {
    for (const slug of PHASE3C1_NO_META_SLUGS) {
      const tool = getToolBySlug(slug);
      expect(tool?.status).toBe("published");
      expect(phase3c2cUsesMetaFallback(tool!), slug).toBe(false);
    }
  });
});

describe("Phase 3C-2C 신규 meta 6종", () => {
  it.each(PHASE3C2C_META_ONLY)("%s 가이드 존재·메타에 예제 수치", (slug) => {
    const tool = getToolBySlug(slug)!;
    const guide = getCalculatorGuide(slug);
    expect(guide).toBeTruthy();
    const blob = `${tool.metaTitle} ${tool.metaDescription}`;
    for (const marker of META_ENGINE_MARKERS[slug] ?? []) {
      expect(blob, slug).toContain(marker);
    }
    expect(tool.metaDescription!.length).toBeGreaterThan(40);
  });
});

describe("Phase 3C-2A/2B 메타 회귀", () => {
  it("12종 meta·가이드·예제 마커 유지", () => {
    const slugs = [...PHASE3C2A_SLUGS, ...PHASE3C2B_SLUGS];
    for (const slug of slugs) {
      const tool = getToolBySlug(slug);
      expect(tool?.metaTitle, slug).toBeTruthy();
      expect(tool?.metaDescription, slug).toBeTruthy();
      expect(getCalculatorGuide(slug), slug).toBeTruthy();
      expect(phase3c2cUsesMetaFallback(tool!), slug).toBe(false);
      const blob = `${tool!.metaTitle} ${tool!.metaDescription}`;
      for (const marker of META_ENGINE_MARKERS[slug] ?? []) {
        expect(blob, slug).toContain(marker);
      }
    }
  });
});