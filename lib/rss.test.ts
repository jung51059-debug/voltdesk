import { describe, expect, it } from "vitest";
import { buildArticleRss } from "@/lib/rss";
import { sitemapEntries, sitemapLastModified } from "@/lib/seo";

describe("사이트맵", () => {
  it("즐겨찾기와 설정은 제외한다", () => {
    const paths = sitemapEntries();
    expect(paths).not.toContain("/favorites");
    expect(paths).not.toContain("/settings");
    expect(paths).not.toContain("/search");
    expect(paths).toContain("/");
    expect(paths).toContain("/about");
    expect(paths).toContain("/references");
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toHaveLength(128);
    expect(paths).toContain("/tools/electrical/contract-power-current");
    expect(paths).not.toContain("/tools/electrical/motor-start-vd");
    expect(paths.every((path) => path.startsWith("/"))).toBe(true);
  });

  it("lastmod는 데이터에 있는 날짜만 쓰고 오늘로 채우지 않는다", () => {
    expect(sitemapLastModified("/tools/electrical/contract-power-current")).toBe("2026-10-04");
    expect(sitemapLastModified("/privacy")).toBe("2026-10-08");
    expect(sitemapLastModified("/terms")).toBe("2026-10-08");
    expect(sitemapLastModified("/about")).toBe("2026-08-20");
    expect(sitemapLastModified("/contact")).toBe("2026-08-20");
    const dates = sitemapEntries().map((path) => sitemapLastModified(path));
    expect(dates).not.toContain("2026-10-22");
    expect(dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(true);
  });
});

describe("RSS", () => {
  it("참고문서 제목과 self 링크를 포함한다", () => {
    const xml = buildArticleRss();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<rss version=\"2.0\"");
    expect(xml).toContain("kW와 kVA의 차이");
    expect(xml).toContain("https://ampory.vercel.app/feed.xml");
    expect(xml).toContain("https://ampory.vercel.app/references/kw-vs-kva");
  });
});
