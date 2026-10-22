import { describe, expect, it } from "vitest";
import { getArticleBySlug } from "@/lib/data/articles";
import { getToolBySlug } from "@/lib/data/tools";
import { articleJsonLd, calculatorBreadcrumbItems, calculatorJsonLd, toolMetadata, websiteJsonLd } from "@/lib/seo";
import { metadata as aboutMetadata } from "@/app/about/page";

const homeDescription =
  "현장에서 바로 쓰는 전기 계산과 실무 참고. 케이블, 변압기, 모터, 역률, UPS, 발전기, 부하 스케줄을 로그인 없이 계산합니다.";

describe("json-ld", () => {
  it("홈 WebSite는 홈 설명과 공개 URL만 가진다", () => {
    const data = websiteJsonLd(homeDescription);
    expect(data["@type"]).toBe("WebSite");
    expect(data.name).toBe("Ampory");
    expect(data.url).toBe("https://ampory.vercel.app");
    expect(data.description).toBe(homeDescription);
    expect(data).not.toHaveProperty("potentialAction");
  });

  it("계산기 WebApplication은 그 도구의 주소와 무료 표시만 가진다", () => {
    const tool = getToolBySlug("three-phase-current");
    expect(tool).toBeTruthy();
    const data = calculatorJsonLd(tool!);
    expect(data["@type"]).toBe("WebApplication");
    expect(data.name).toBe(tool!.pageHeading ?? tool!.name);
    expect(data.url).toBe("https://ampory.vercel.app/tools/electrical/three-phase-current");
    expect(data.applicationCategory).toBe("UtilitiesApplication");
    expect(data.operatingSystem).toBe("Web");
    expect(data.offers).toEqual({ "@type": "Offer", price: 0, priceCurrency: "KRW" });
    expect(data).not.toHaveProperty("aggregateRating");
    expect(data).not.toHaveProperty("review");

    const crumbs = calculatorBreadcrumbItems(tool!);
    expect(crumbs.map((item) => item.name)).toEqual(["홈", "전기", "전기 기본 계산", data.name]);
    expect(crumbs[0]?.href).toBe("/");
  });

  it("실무 가이드 Article은 제목·요약·수정일만 가진다", () => {
    const article = getArticleBySlug("motor-kw-input-or-output");
    expect(article).toBeTruthy();
    const data = articleJsonLd(article!);
    expect(data["@type"]).toBe("Article");
    expect(data.headline).toBe(article!.title);
    expect(data.description).toBe(article!.summary);
    expect(data.dateModified).toBe(article!.updatedAt);
    expect(data.url).toBe("https://ampory.vercel.app/references/motor-kw-input-or-output");
    expect(data.mainEntityOfPage).toBe(data.url);
    expect(data).not.toHaveProperty("author");
    expect(data).not.toHaveProperty("datePublished");
    expect(data).not.toHaveProperty("image");
  });
});

describe("문서 title", () => {
  const suffix = " | Ampory";

  it("지정한 계산기 제목은 템플릿과 합쳐도 구분자가 한 번이다", () => {
    const slugs = ["three-phase-current", "kw-kva-hp", "transformer-load", "voltage-drop"] as const;
    for (const slug of slugs) {
      const tool = getToolBySlug(slug);
      const pageTitle = tool?.metaTitle ?? "";
      const metadata = tool ? toolMetadata(tool) : {};
      expect(pageTitle).not.toContain("|");
      expect(metadata.title).toBe(pageTitle);
      const documentTitle = `${pageTitle}${suffix}`;
      expect(documentTitle.split("|")).toHaveLength(2);
      expect(documentTitle.endsWith(suffix)).toBe(true);
      expect(documentTitle.split("Ampory")).toHaveLength(2);
    }
    const unchanged = getToolBySlug("contract-power-current");
    expect(unchanged?.metaTitle).toBe("계약전력 5kW·10kW는 몇 A? 예상 전류 계산");
    expect(`${unchanged?.metaTitle}${suffix}`.split("|")).toHaveLength(2);
  });

  it("소개 제목은 템플릿을 건너뛰어 Ampory가 한 번이다", () => {
    expect(aboutMetadata.title).toEqual({ absolute: "Ampory 소개" });
    expect(aboutMetadata.openGraph && "title" in aboutMetadata.openGraph ? aboutMetadata.openGraph.title : "").toBe("Ampory 소개");
  });
});
