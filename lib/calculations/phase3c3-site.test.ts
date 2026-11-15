/**
 * Phase 3C-3 — 허브·내부 링크·신뢰·안전 문구·SEO 유지
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getArticleById } from "@/lib/data/articles";
import { calculatorGuides, getCalculatorGuide } from "@/lib/data/calculator-guides";
import { hubWorkflows } from "@/lib/data/hub-workflows";
import { getHubCategories } from "@/lib/data/categories";
import { getPublishedTools, getToolById, getToolBySlug } from "@/lib/data/tools";
import { sitemapEntries } from "@/lib/seo";
import { phase3c2cUsesMetaFallback } from "@/lib/calculations/phase3c3-seo-shared";

const SAFETY_SLUGS = [
  "arc-flash",
  "lightning-risk",
  "short-circuit",
  "spd-helper",
  "grounding-rod",
  "earth-conductor",
  "breaker-current",
  "generator-load-test",
  "ups-capacity",
  "ups-backup-time",
] as const;

const WORKFLOW_CATEGORIES = [
  "schedule",
  "motor",
  "ups",
  "grounding",
  "generator",
  "facility-ops",
  "field-verify",
  "advanced",
] as const;

function readAppFile(relativePath: string) {
  return readFileSync(join(process.cwd(), "app", relativePath), "utf8");
}

describe("Phase 3C-3 — 카테고리 허브", () => {
  const paths = new Set(sitemapEntries());

  it("허브 분류·워크플로우 링크가 sitemap에 있다", () => {
    for (const slug of WORKFLOW_CATEGORIES) {
      expect(paths.has(`/tools/categories/${slug}`), slug).toBe(true);
      const steps = hubWorkflows[slug];
      expect(steps?.length, slug).toBeGreaterThanOrEqual(3);
      for (const step of steps ?? []) {
        expect(paths.has(step.href), `${slug} → ${step.href}`).toBe(true);
      }
    }
    for (const cat of getHubCategories()) {
      expect(cat.description.trim().length, cat.slug).toBeGreaterThan(20);
    }
  });
});

describe("Phase 3C-3 — 내부 링크 감사", () => {
  const paths = new Set(sitemapEntries());
  const hrefToSlug = new Map(getPublishedTools().map((t) => [t.href, t.slug]));

  it("가이드 links·relatedTool·relatedArticle 무결성", () => {
    const dupHrefOnTool = new Set<string>();
    for (const guide of calculatorGuides) {
      const links = guide.links ?? [];
      const seen = new Set<string>();
      for (const link of links) {
        expect(paths.has(link.href), `${guide.slug} → ${link.href}`).toBe(true);
        expect(seen.has(link.href), `${guide.slug} dup ${link.href}`).toBe(false);
        seen.add(link.href);
        if (hrefToSlug.get(link.href) === guide.slug) {
          dupHrefOnTool.add(`${guide.slug} self ${link.href}`);
        }
      }
    }
    expect([...dupHrefOnTool]).toEqual([]);
    for (const tool of getPublishedTools()) {
      for (const id of tool.relatedToolIds) {
        expect(getToolById(id), `${tool.slug} related ${id}`).toBeTruthy();
      }
      for (const id of tool.relatedArticleIds) {
        expect(getArticleById(id), `${tool.slug} article ${id}`).toBeTruthy();
      }
    }
  });

  it("탐색 흐름 핵심 연결이 가이드에 있다", () => {
    const load = getCalculatorGuide("load-schedule")!;
    const hrefs = (load.links ?? []).map((l) => l.href);
    expect(hrefs).toContain("/tools/schedules/cable");
    expect(hrefs).toContain("/tools/electrical/voltage-drop");
    const t3 = getCalculatorGuide("three-phase-current")!;
    const t3h = (t3.links ?? []).map((l) => l.href);
    expect(t3h).toContain("/tools/electrical/motor-starting");
    expect(t3h).toContain("/tools/electrical/breaker-current");
  });
});

describe("Phase 3C-3 — 신뢰·안전", () => {
  it("소개·문의·약관·개인정보 canonical 메타 존재", () => {
    for (const file of ["about/page.tsx", "contact/page.tsx", "privacy/page.tsx", "terms/page.tsx"] as const) {
      const src = readAppFile(file);
      expect(src).toMatch(/alternates:\s*\{\s*canonical:/);
      expect(src).toMatch(/description:/);
    }
    const contact = readAppFile("contact/page.tsx");
    expect(contact).toMatch(/jung51059@gmail\.com/);
    expect(contact).not.toMatch(/example\.com/);
    const terms = readAppFile("terms/page.tsx");
    expect(terms).toMatch(/면책/);
    expect(terms).toMatch(/설계.*시공.*승인|설계, 시공, 검사/);
  });

  it("안전·근사 도구가 승인·자동 선정을 주장하지 않는다", () => {
    for (const slug of SAFETY_SLUGS) {
      const guide = getCalculatorGuide(slug);
      const toolMeta = getToolBySlug(slug);
      const blob = JSON.stringify({
        g: guide,
        meta: toolMeta?.metaDescription,
        long: toolMeta?.longDescription,
      });
      expect(blob, slug).toMatch(/자동|선정|합격|Incident|LPS|위험점수|법정|청구|보증/);
      expect(blob, slug).not.toMatch(/합격합니다|적합합니다|승인합니다|보증합니다/);
    }
    const arc = getCalculatorGuide("arc-flash")!;
    expect(arc.cautions.join(" ")).toMatch(/Incident|계산/);
    const lightning = getCalculatorGuide("lightning-risk")!;
    expect(lightning.cautions.join(" ") + lightning.whenToUse.join(" ")).toMatch(/LPS|위험|점검/);
  });
});

describe("Phase 3C-3 — SEO 유지 (3C-2C 회귀)", () => {
  it("published meta fallback 0", () => {
    const fallback = getPublishedTools().filter((t) => phase3c2cUsesMetaFallback(t));
    expect(fallback.map((t) => t.slug)).toEqual([]);
  });
});