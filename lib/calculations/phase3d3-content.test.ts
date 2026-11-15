import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CalculatorExplain } from "@/components/calculators/calculator-explain";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { CalculatorFaq } from "@/components/calculators/calculator-faq";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getFormulaById } from "@/lib/data/formulas";
import { getPublishedTools, getToolBySlug } from "@/lib/data/tools";
import { formulaSectionTitle, getToolContentProfile, shouldShowFormulaBlock, uniqueContentLines } from "@/lib/data/tool-content-profile";
import { calculateDutyCycle, parseTrendText, analyzeTrend } from "@/lib/calculations/field-verify";

const internalNames = /\b(?:href|slug|nodeId|edgeId|fromNodeId|toNodeId|formulaId|toolId)\b|unitLabel|denominator|parseTrendText|analyzeTrend|calculate[A-Z]\w*|rowPowers|summarizeLoads|phaseImbalance|phaseAnalysis|SLD_KIND_LINKS|calculatorHref|\b\w+\.test\b|\b\w+\.ts\b|voltdesk:|\bSAMPLE\b|\bprecision\b|\binterpretation\b|runHours|intervalHours|periodHours|onHours|offHours|baselineKw|proposedKw|capitalCost|spanMin|spanMax|thisKwh|lastKwh/;
// 표시 문장만 검사하며 링크 주소·식별자·HTML 속성·JSON-LD 키는 제외합니다.
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") {
    return Object.entries(value).filter(([key]) => key !== "href" && key !== "slug").flatMap(([, item]) => strings(item));
  }
  return [];
}
const withoutAddresses = (text: string) => text.replace(/https?:\/\/[^\s<>"']+|\/(?:tools|references)\/[^\s<>"']+/g, "");
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("Phase 3D-3 공개 도구 68종 콘텐츠 렌더링", () => {
  it.each(getPublishedTools())("$slug: 유형·내부 코드명·출처·빈 블록", (tool) => {
    const guide = getCalculatorGuide(tool.slug)!;
    const formula = getFormulaById(tool.formulaId)!;
    expect(guide, tool.slug).toBeTruthy();
    const content = strings(guide).concat(strings(tool.faqs));
    for (const value of content) expect(withoutAddresses(value), tool.slug).not.toMatch(internalNames);
    const explain = renderToStaticMarkup(createElement(CalculatorExplain, { slug: tool.slug, formula }));
    const disclosure = renderToStaticMarkup(createElement(TechnicalDisclosure, { slug: tool.slug, formula, variant: "compact" }));
    const html = explain + disclosure;
    expect(html).not.toMatch(/<(?:p|ul|dl|section)\b[^>]*>\s*<\/(?:p|ul|dl|section)>/);
    const showFormula = shouldShowFormulaBlock(getToolContentProfile(tool.slug), formula);
    expect(explain.includes(`>${formulaSectionTitle(getToolContentProfile(tool.slug))}</h2>`)).toBe(showFormula);
    if (getToolContentProfile(tool.slug) === "checklist") expect(html).not.toContain(">사용 공식</");
    if (!formula.referenceSources.length) expect(html).not.toContain(">출처</h2>");
    for (const source of formula.referenceSources) {
      expect(html.split(escapeHtml(source.title)).length - 1, `${tool.slug}: ${source.title}`).toBe(1);
    }
    for (const caution of guide.cautions) expect(html).toContain(escapeHtml(caution));
    for (const limitation of formula.limitations) expect(html).toContain(escapeHtml(limitation));
    const faqHtml = renderToStaticMarkup(createElement(CalculatorFaq, { faqs: tool.faqs }));
    for (const faq of tool.faqs) {
      expect(faqHtml).toContain(escapeHtml(faq.question));
      expect(faqHtml).toContain(escapeHtml(faq.answer));
    }
  });
});

describe("Phase 3D-3 개별 콘텐츠 회귀", () => {
  it("SLD 저장 범위의 두 문장을 사용자 용어로 표시한다", () => {
    const guide = getCalculatorGuide("sld")!;
    expect(guide.inputMeaning.some((item) => item.text === "전원·변압기·모선 등 설비 종류와 이름, 연결할 계산기 주소.")).toBe(true);
    expect(getToolBySlug("sld")!.faqs.some((faq) => faq.answer === "지원하지 않습니다. 설비와 연결 관계 목록, 관련 계산기 주소만 저장합니다. 캔버스에서 직접 편집하는 기능은 제공하지 않습니다.")).toBe(true);
    expect(strings(guide).concat(strings(getToolBySlug("sld")!.faqs)).join(" ")).not.toContain("계산기 href");
  });
  it("설명 문장의 단순 필드명과 구현 식별자를 검출한다", () => {
    for (const name of ["href", "slug", "nodeId", "edgeId", "fromNodeId", "toNodeId", "calculatorHref", "formulaId", "toolId"]) {
      expect(`연결할 계산기 ${name}를 저장합니다.`).toMatch(internalNames);
    }
  });
  it("링크 주소와 구조화 데이터의 정상 키를 설명 문장으로 검사하지 않는다", () => {
    const text = strings({ slug: "slug", links: [{ href: "/tools/nodeId", label: "계산기 주소", text: "연결할 도구입니다." }], jsonLd: { "@type": "WebApplication", href: "https://example.com/edgeId", slug: "slug" } });
    for (const line of text) expect(withoutAddresses(line)).not.toMatch(internalNames);
    expect(withoutAddresses("참고: https://example.com/nodeId?slug=sld 및 /tools/edgeId")).not.toMatch(internalNames);
  });
  it("정상 기술 용어와 단위 및 렌더링된 HTML 속성은 유지한다", () => {
    expect("노드·엣지, CSV, JSON, IEC, kW, kVA, r/min").not.toMatch(internalNames);
    const html = renderToStaticMarkup(createElement(CalculatorExplain, { slug: "sld", formula: getFormulaById("formula-sld")! }));
    expect(html).toContain('href="/');
    expect(strings(getCalculatorGuide("sld")).join(" ")).not.toMatch(internalNames);
  });
  it("회전수의 분 단위를 통계 최솟값과 혼동해 치환하지 않는다", () => {
    const faqs = JSON.stringify(getToolBySlug("motor-slip")!.faqs);
    expect(faqs).toContain("1800 r/min");
    expect(faqs).toContain("1750 r/min");
    expect(faqs).not.toContain("r/최솟값");
  });
  it("FAQ가 없으면 빈 설명 섹션을 만들지 않는다", () => {
    expect(renderToStaticMarkup(createElement(CalculatorFaq, { faqs: [] }))).toBe("");
  });
  it("같은 문장만 정리하고 서로 다른 안전 경고는 보존한다", () => {
    expect(uniqueContentLines([" 감전 위험을 확인하세요. ", "감전 위험을 확인하세요.", "아크플래시 위험을 확인하세요.", "보호협조를 검토하세요.", ""])).toEqual([" 감전 위험을 확인하세요. ", "아크플래시 위험을 확인하세요.", "보호협조를 검토하세요."]);
    expect(uniqueContentLines(["감전 위험을 확인하세요.", "접지 연속성을 확인하세요."], ["감전 위험을 확인하세요."])).toEqual(["접지 연속성을 확인하세요."]);
  });
  it("완전한 상세 표시에서는 공식·출처·한계를 유지한다", () => {
    const formula = getFormulaById("formula-single-phase-current")!;
    const html = renderToStaticMarkup(createElement(TechnicalDisclosure, { slug: "single-phase-current", formula }));
    expect(html).toContain("사용 공식");
    for (const source of formula.referenceSources) expect(html).toContain(source.title);
    for (const limitation of formula.limitations) expect(html).toContain(limitation);
  });
  it("시설·에너지·발전기 14종의 단위와 적용 한계가 명시되어 있다", () => {
    for (const slug of ["generator-sizing", "generator-fuel", "generator-start-vd", "battery-capacity", "equipment-load", "energy-intensity", "energy-cost", "pm-interval", "yoy-energy", "generator-load-test", "duty-cycle", "sensor-calibration", "trend-analysis", "retrofit-compare"]) {
      const formula = getFormulaById(getToolBySlug(slug)!.formulaId)!;
      expect(formula.units.length, slug).toBeGreaterThan(0);
      expect(formula.limitations.length, slug).toBeGreaterThan(0);
    }
  });
  it("임의 차단기 배율을 외부 교과서 출처로 주장하지 않는다", () => {
    const formula = getFormulaById("formula-breaker-ref")!;
    expect(formula.referenceSources).toEqual([]);
    expect(formula.assumptions.join(" ")).toContain("단순 배율");
    expect(formula.limitations.join(" ")).toContain("KEC 적합 판정이 아닙니다");
  });
  it("마력은 확인한 NIST 환산표와 엔진의 746 W 근사를 구분한다", () => {
    const source = getFormulaById("formula-kw-kva-hp")!.referenceSources[0];
    expect(source.url).toContain("appendix-b8");
    expect(source.note).toContain("745.6999");
    expect(source.note).toContain("746 W/HP");
  });
  it("SPD 가이드를 체크리스트로 표시하고 수치 선정 기능을 추가하지 않는다", () => {
    const guide = getCalculatorGuide("spd-helper")!;
    expect(guide.walkthroughs).toHaveLength(3);
    expect(getToolContentProfile("spd-helper")).toBe("checklist");
    const html = renderToStaticMarkup(createElement(CalculatorExplain, { slug: "spd-helper", formula: getFormulaById("formula-spd")! }));
    expect(html).toContain("이 계산기는 언제 사용하는가");
    expect(html).toContain("SPD 용량·In·Iimp 자동 산정");
    expect(html).not.toContain(">사용 공식</");
    expect(html).not.toContain(">실무 예제</");
  });
  it("추세 예제는 5개 시료·4시간이며 표본통계는 기존 결과를 유지한다", () => {
    const parsed = parseTrendText("2026-08-29T08:00:00,218\n2026-08-29T09:00:00,221\n2026-08-29T10:00:00,215\n2026-08-29T11:00:00,219\n2026-08-29T12:00:00,224");
    const stats = analyzeTrend(parsed.points);
    expect(stats.count).toBe(5);
    expect(stats.durationH).toBe(4);
    expect(stats.peak.value).toBe(224);
    expect(stats.roc).toBe(1.5);
    expect(JSON.stringify(getCalculatorGuide("trend-analysis"))).toContain("4시간");
    expect(analyzeTrend([{ value: 10 }, { value: 12 }, { value: 14 }]).stdev).toBe(2);
  });
  it("운전+정지=관찰기간이면 같은 비율을 중복 출력한다고 설명하지 않는다", () => {
    const out = calculateDutyCycle({ periodHours: "24", onHours: "10", offHours: "14", starts: "12" }, 2);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(Number(out.metrics.find((m) => m.id === "rt")?.value)).toBe(41.67);
      expect(out.metrics.some((m) => m.id === "onoff")).toBe(false);
    }
    expect(JSON.stringify(getCalculatorGuide("duty-cycle"))).toContain("별도 표시하지 않습니다");
  });
});
