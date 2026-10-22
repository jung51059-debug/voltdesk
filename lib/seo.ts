import type { Metadata } from "next";
import { articles } from "@/lib/data/articles";
import { getCategoryById, getCategoryBySlug, getHubCategories } from "@/lib/data/categories";
import { getFeaturedTools, getPublishedTools, getRecentlyAddedTools, getToolsByCategory, getToolsByDomain } from "@/lib/data/tools";
import { SITE, type CalculatorTool, type ReferenceArticle } from "@/lib/types";

export function absoluteUrl(path: string): string {
  if (path === "/" || path === "") return SITE.url;
  return new URL(path, SITE.url).toString();
}

/** 계산기 공개 페이지의 title, description, canonical, Open Graph. */
export function toolMetadata(tool: CalculatorTool): Metadata {
  const title = tool.metaTitle ?? tool.name;
  const description = tool.metaDescription ?? tool.longDescription;
  return {
    title,
    description,
    alternates: { canonical: tool.href },
    openGraph: { title, description },
    robots: tool.status === "published" ? undefined : { index: false, follow: true },
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** 홈페이지 전용. 사이트 검색창은 noindex라 SearchAction을 넣지 않습니다. */
export function websiteJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description,
    inLanguage: "ko",
  };
}

/** 계산기 화면의 제목·설명으로 만드는 웹 도구. 별점·리뷰는 넣지 않습니다. */
export function calculatorJsonLd(
  tool: CalculatorTool,
  options?: { name?: string; description?: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: options?.name ?? tool.pageHeading ?? tool.name,
    description: options?.description ?? tool.metaDescription ?? tool.longDescription,
    url: absoluteUrl(tool.href),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: 0, priceCurrency: "KRW" },
    inLanguage: "ko",
  };
}

/** 계산기 화면 breadcrumb(홈 → 전기/시설 → 카테고리 → 계산기)와 같은 단계. */
export function calculatorBreadcrumbItems(tool: CalculatorTool) {
  const category = getCategoryById(tool.categoryId);
  return [
    { name: "홈", href: "/" },
    {
      name: tool.domain === "facility" ? "시설" : "전기",
      href: tool.domain === "facility" ? "/tools/facility" : "/tools/electrical",
    },
    ...(category ? [{ name: category.name, href: `/tools/categories/${category.slug}` }] : []),
    { name: tool.pageHeading ?? tool.name, href: tool.href },
  ];
}

/** 실무 가이드. 화면에 없는 작성자·발행일·이미지는 만들지 않습니다. */
export function articleJsonLd(article: ReferenceArticle) {
  const url = absoluteUrl(article.href);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    url,
    mainEntityOfPage: url,
    dateModified: article.updatedAt,
    inLanguage: "ko",
  };
}

/** 가이드 화면 breadcrumb와 같은 단계. 카테고리는 목록의 앵커입니다. */
export function articleBreadcrumbItems(article: ReferenceArticle) {
  const category = getCategoryById(article.categoryId);
  return [
    { name: "홈", href: "/" },
    { name: "실무 참고", href: "/references" },
    ...(category ? [{ name: category.name, href: `/references#${category.slug}` }] : []),
    { name: article.title, href: article.href },
  ];
}

export function sitemapEntries() {
  // 즐겨찾기·설정은 robots에서 차단하므로 사이트맵에 넣지 않습니다.
  const staticPaths = [
    "/",
    "/about",
    "/tools",
    "/tools/electrical",
    "/tools/facility",
    "/references",
    "/privacy",
    "/terms",
    "/contact",
    "/sources",
    "/resources/electrical-qr-card",
  ];
  const categoryPaths = getHubCategories().map((category) => `/tools/categories/${category.slug}`);
  const toolPaths = getPublishedTools().map((tool) => tool.href);
  const articlePaths = articles.map((article) => article.href);
  return [...staticPaths, ...categoryPaths, ...toolPaths, ...articlePaths];
}

/** 페이지에 적힌 날짜만 씁니다. 출처가 없으면 기존 사이트맵 기준일인 2026-08-20을 유지합니다. */
const SITEMAP_FALLBACK_DATE = "2026-08-20";

const STATIC_SITEMAP_DATES: Record<string, string> = {
  "/privacy": "2026-10-08",
  "/terms": "2026-10-08",
};

function latestConfirmedDate(dates: string[]): string {
  const confirmed = dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));
  if (confirmed.length === 0) return SITEMAP_FALLBACK_DATE;
  return confirmed.sort().at(-1) ?? SITEMAP_FALLBACK_DATE;
}

/** 사이트맵 lastmod. 도구·글의 updatedAt, 목록은 그 목록에 나오는 항목의 최신일, 약관은 화면에 적힌 최종 수정일입니다. */
export function sitemapLastModified(path: string): string {
  const tool = getPublishedTools().find((item) => item.href === path);
  if (tool) return tool.updatedAt;
  const article = articles.find((item) => item.href === path);
  if (article) return article.updatedAt;
  if (STATIC_SITEMAP_DATES[path]) return STATIC_SITEMAP_DATES[path];
  if (path.startsWith("/tools/categories/")) {
    const category = getCategoryBySlug(path.slice("/tools/categories/".length));
    return latestConfirmedDate(category ? getToolsByCategory(category.id).map((item) => item.updatedAt) : []);
  }
  if (path === "/tools/electrical") return latestConfirmedDate(getToolsByDomain("electrical").map((item) => item.updatedAt));
  if (path === "/tools/facility") return latestConfirmedDate(getToolsByDomain("facility").map((item) => item.updatedAt));
  if (path === "/tools") return latestConfirmedDate(getPublishedTools().map((item) => item.updatedAt));
  if (path === "/references") return latestConfirmedDate(articles.map((item) => item.updatedAt));
  if (path === "/") {
    return latestConfirmedDate([
      ...getFeaturedTools().slice(0, 9).map((item) => item.updatedAt),
      ...getRecentlyAddedTools().slice(0, 4).map((item) => item.updatedAt),
      ...articles.slice(0, 6).map((item) => item.updatedAt),
    ]);
  }
  return SITEMAP_FALLBACK_DATE;
}
