import { articles } from "@/lib/data/articles";
import { SITE } from "@/lib/types";
import { absoluteUrl } from "@/lib/seo";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toRfc822(date: string) {
  return new Date(`${date}T00:00:00+09:00`).toUTCString();
}

/** 실무 참고문서 RSS 2.0. 계산기는 사이트맵이 더 적합합니다. */
export function buildArticleRss(): string {
  const items = [...articles].sort((a, b) => {
    if (a.updatedAt === b.updatedAt) return a.title.localeCompare(b.title, "ko");
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });

  const latest = items[0]?.updatedAt ?? "2026-08-20";
  const channelLink = absoluteUrl("/references");
  const feedUrl = absoluteUrl("/feed.xml");

  const itemXml = items
    .map((article) => {
      const url = absoluteUrl(article.href);
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${toRfc822(article.updatedAt)}</pubDate>
      <description>${escapeXml(article.summary)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE.name} 실무 참고`)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(`${SITE.name} 전기·시설 실무 참고자료 업데이트.`)}</description>
    <language>ko</language>
    <lastBuildDate>${toRfc822(latest)}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${itemXml}
  </channel>
</rss>
`;
}
