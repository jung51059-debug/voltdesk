import { describe, expect, it } from "vitest";
import { sitemapEntries } from "@/lib/seo";
import { getPublishedTools } from "@/lib/data/tools";
import { regionFromPathname, regionalPath } from "@/lib/region/config";
import { getRegionalSwitchTarget } from "@/lib/region/switch";
import { isKecReviewAllowed } from "@/lib/region/regulation";
import { US_CALCULATOR_CATALOG, countUsCatalogByGroup, US_NEW_CALCULATOR_CANDIDATES } from "@/lib/us/calculator-catalog";
import { isUsNavPublic } from "@/lib/region/feature-flags";
import { allContentMappings } from "@/lib/us/content-mapping";

describe("Phase US-1 architecture", () => {
  it("한국 sitemap은 132 URL이며 /us 경로를 포함하지 않는다", () => {
    const paths = sitemapEntries();
    expect(paths).toHaveLength(132);
    expect(paths.every((p) => !p.startsWith("/us"))).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("발행 계산기 71개와 US 카탈로그 행이 일치한다", () => {
    expect(getPublishedTools()).toHaveLength(71);
    expect(US_CALCULATOR_CATALOG).toHaveLength(71);
    const g = countUsCatalogByGroup();
    expect(g.A + g.B + g.C + g.D).toBe(71);
  });

  it("미국 신규 후보는 KR 71 카탈로그와 분리된다", () => {
    expect(US_NEW_CALCULATOR_CANDIDATES.length).toBeGreaterThan(0);
    for (const c of US_NEW_CALCULATOR_CANDIDATES) {
      expect(US_CALCULATOR_CATALOG.some((e) => e.usSlug === c.usSlug)).toBe(false);
    }
  });

  it("경로에서 region 판별과 prefix가 일관된다", () => {
    expect(regionFromPathname("/")).toBe("KR");
    expect(regionFromPathname("/tools/electrical/voltage-drop")).toBe("KR");
    expect(regionFromPathname("/us")).toBe("US");
    expect(regionFromPathname("/us/tools")).toBe("US");
    expect(regionalPath("US", "/tools/electrical")).toBe("/us/tools/electrical");
    expect(regionalPath("KR", "/tools")).toBe("/tools");
  });

  it("KEC 검토는 KR에서만 허용된다", () => {
    expect(isKecReviewAllowed("KR")).toBe(true);
    expect(isKecReviewAllowed("US")).toBe(false);
  });

  it("미발행 계산기는 국가 전환 시 허브로만 연결된다", () => {
    expect(getRegionalSwitchTarget("/tools/electrical/arc-flash", "US")).toBe("/us/tools/electrical");
    expect(getRegionalSwitchTarget("/tools/electrical/transformer-current", "US")).toBe(
      "/us/tools/electrical/transformer-current",
    );
  });

  it("Group B blocked workspace tools fall back to US hub, not 404 slug", () => {
    for (const slug of ["load-flow", "sld", "load-schedule", "cable-schedule"]) {
      expect(getRegionalSwitchTarget(`/tools/electrical/${slug}`, "US")).toBe("/us/tools/electrical");
    }
  });

  it("US-3 로컬 routable Group B/케이블 계산기는 대응 US 경로로 전환된다", () => {
    expect(getRegionalSwitchTarget("/tools/electrical/voltage-drop", "US")).toBe("/us/tools/electrical/voltage-drop");
    expect(getRegionalSwitchTarget("/us/tools/electrical/voltage-drop", "KR")).toBe("/tools/electrical/voltage-drop");
  });

  it("KR 헤더 미국 링크는 기본 비공개", () => {
    if (process.env.NEXT_PUBLIC_AMPORY_US_PUBLIC !== "true") {
      expect(isUsNavPublic()).toBe(false);
    }
  });

  it("콘텐츠 매핑은 발행 전 hreflang 대상이 없다", () => {
    const published = allContentMappings().filter((m) => m.publicationStatus === "published" && m.indexable);
    expect(published).toHaveLength(0);
  });
});