import { articles } from "@/lib/data/articles";
import { getPublishedTools } from "@/lib/data/tools";
import { SITE } from "@/lib/types";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
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

export function softwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    description: SITE.description,
    url: SITE.url,
    inLanguage: "ko",
  };
}

export function sitemapEntries() {
  // 즐겨찾기·설정은 robots에서 차단하므로 사이트맵에 넣지 않습니다.
  const staticPaths = [
    "/",
    "/tools",
    "/tools/electrical",
    "/tools/facility",
    "/references",
    "/search",
    "/privacy",
    "/terms",
    "/contact",
    "/sources",
  ];
  const toolPaths = getPublishedTools().map((tool) => tool.href);
  const articlePaths = articles.map((article) => article.href);
  return [...staticPaths, ...toolPaths, ...articlePaths];
}
