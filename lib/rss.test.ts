import { describe, expect, it } from "vitest";
import { buildArticleRss } from "@/lib/rss";
import { sitemapEntries } from "@/lib/seo";

describe("사이트맵", () => {
  it("즐겨찾기와 설정은 제외한다", () => {
    const paths = sitemapEntries();
    expect(paths).not.toContain("/favorites");
    expect(paths).not.toContain("/settings");
    expect(paths).toContain("/");
    expect(paths).toContain("/references");
  });
});

describe("RSS", () => {
  it("참고문서 제목과 self 링크를 포함한다", () => {
    const xml = buildArticleRss();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<rss version=\"2.0\"");
    expect(xml).toContain("kW와 kVA의 차이");
    expect(xml).toContain("https://ampory.app/feed.xml");
    expect(xml).toContain("https://ampory.app/references/kw-vs-kva");
  });
});
