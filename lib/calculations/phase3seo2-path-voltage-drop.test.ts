/**
 * Phase SEO-2 — 경로 전압강하 전용 페이지 서버 HTML 핵심 본문
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CalculatorExplain } from "@/components/calculators/calculator-explain";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import {
  PathVoltageDropPageShell,
  PathVoltageDropPanelFallback,
} from "@/components/calculators/path-voltage-drop-page-shell";
import { getFormulaById } from "@/lib/data/formulas";
import { getToolBySlug } from "@/lib/data/tools";
import { sitemapEntries, toolMetadata } from "@/lib/seo";

const SLUG = "path-voltage-drop";
const CANONICAL = "/tools/electrical/path-voltage-drop";

describe("Phase SEO-2 path-voltage-drop", () => {
  const tool = getToolBySlug(SLUG)!;
  const formula = getFormulaById("formula-path-voltage-drop")!;

  it("메타·사이트맵 URL 유지", () => {
    const meta = toolMetadata(tool);
    expect(meta.alternates?.canonical).toBe(CANONICAL);
    expect(sitemapEntries()).toContain(CANONICAL);
    expect(meta.robots).toBeUndefined();
    expect(meta.title).toMatch(/경로|누적/);
  });

  it("서버 프라이머에 H1·가이드·공식·주의가 포함된다", () => {
    const html =
      renderToStaticMarkup(createElement(PathVoltageDropPageShell)) +
      renderToStaticMarkup(createElement(PathVoltageDropPanelFallback)) +
      renderToStaticMarkup(createElement(CalculatorExplain, { slug: SLUG, formula })) +
      renderToStaticMarkup(createElement(TechnicalDisclosure, { slug: SLUG, formula, variant: "compact" }));

    expect(html).toContain("<h1");
    expect(html).toContain("경로 전압강하 계산기");
    expect(html).toContain("이 계산기는 언제 사용하는가");
    expect(html).toContain("입력값 의미");
    expect(html).toContain("결과 해석");
    expect(html).toContain("주의사항");
    expect(html).toMatch(/ΣΔV|√3/);
    expect(html).toContain("8.06 V");
    expect(html).toContain("11.58 V");
    expect(html).not.toMatch(/경로 계산기를 불러오는 중입니다/);
  });
});