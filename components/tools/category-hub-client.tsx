"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getPublishedTools, getToolById } from "@/lib/data/tools";
import { articles } from "@/lib/data/articles";
import { loadFavorites, loadRecentTools, subscribeStorage } from "@/lib/storage/local";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { ArticleCard } from "@/components/ui/article-card";
import { searchCatalog } from "@/lib/search";
import type { ToolCategory } from "@/lib/types";
import { getToolsByCategory } from "@/lib/data/tools";

export function CategoryHubClient({ category }: { category: ToolCategory }) {
  const [q, setQ] = useState("");
  const tools = getToolsByCategory(category.id);
  const relatedArticles = articles.filter((article) => article.categoryId === category.id).slice(0, 6);
  const favRaw = useSyncExternalStore(subscribeStorage, () => JSON.stringify(loadFavorites()), () => "[]");
  const recentRaw = useSyncExternalStore(subscribeStorage, () => JSON.stringify(loadRecentTools()), () => "[]");
  const favs = (JSON.parse(favRaw) as string[])
    .map((id) => getToolById(id))
    .filter((tool) => tool && tool.categoryId === category.id);
  const recents = (JSON.parse(recentRaw) as string[])
    .map((id) => getToolById(id))
    .filter((tool) => tool && tool.categoryId === category.id);

  const filtered = useMemo(() => {
    const needle = q.trim();
    if (!needle) return tools;
    const hits = new Set(searchCatalog(needle, 50).map((h) => h.id));
    return tools.filter((tool) => hits.has(tool.id) || tool.name.includes(needle) || tool.synonyms.some((s) => s.toLowerCase().includes(needle.toLowerCase())));
  }, [q, tools]);

  return (
    <div className="space-y-10">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={`${category.name} 안에서 검색`}
          className="h-12 flex-1 rounded-xl border border-border bg-card px-4"
        />
      </form>

      {favs.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">이 분류 즐겨찾기</h2>
          <div className="mt-3">
            <ToolGrid>
              {favs.map((tool) => (
                <ToolCard key={tool!.id} tool={tool!} />
              ))}
            </ToolGrid>
          </div>
        </section>
      ) : null}

      {recents.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">이 분류 최근 사용</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {recents.map((tool) => (
              <li key={tool!.id}>
                <Link href={tool!.href} className="rounded-full bg-info px-3 py-1 text-sm text-primary">
                  {tool!.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold">관련 계산기</h2>
        <div className="mt-4">
          <ToolGrid>
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </ToolGrid>
        </div>
      </section>

      {relatedArticles.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">관련 실무자료</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {relatedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-sm text-muted">
        전체 {getPublishedTools().length}개 도구 중 이 분류 {tools.length}개.
      </p>
    </div>
  );
}
