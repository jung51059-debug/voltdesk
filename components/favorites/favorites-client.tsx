"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { ArticleCard } from "@/components/ui/article-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { getArticleById } from "@/lib/data/articles";
import { getToolById } from "@/lib/data/tools";
import { loadFavorites, loadRecentArticles, loadRecentTools, subscribeStorage } from "@/lib/storage/local";

function getSnapshot() {
  return JSON.stringify({
    fav: loadFavorites(),
    tools: loadRecentTools(),
    articles: loadRecentArticles(),
  });
}

function getServerSnapshot() {
  return JSON.stringify({ fav: [], tools: [], articles: [] });
}

export function FavoritesClient() {
  const raw = useSyncExternalStore(subscribeStorage, getSnapshot, getServerSnapshot);
  const data = useMemo(() => JSON.parse(raw) as { fav: string[]; tools: string[]; articles: string[] }, [raw]);

  const favs = data.fav.map((id) => getToolById(id)).filter((item) => Boolean(item));
  const recents = data.tools.map((id) => getToolById(id)).filter((item) => Boolean(item));
  const articles = data.articles.map((id) => getArticleById(id)).filter((item) => Boolean(item));

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-xl font-semibold">즐겨찾는 계산기</h2>
        {favs.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Star}
              title="아직 즐겨찾기가 없습니다"
              description="계산기 카드의 별 아이콘으로 자주 쓰는 도구를 고정하세요."
              action={
                <Link href="/tools" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white dark:text-ink">
                  도구 둘러보기
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4">
            <ToolGrid>
              {favs.map((tool) => (
                <ToolCard key={tool!.id} tool={tool!} />
              ))}
            </ToolGrid>
          </div>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold">최근 사용한 계산기</h2>
        {recents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">계산기를 실행하면 여기에 나타납니다.</p>
        ) : (
          <div className="mt-4">
            <ToolGrid>
              {recents.map((tool) => (
                <ToolCard key={tool!.id} tool={tool!} />
              ))}
            </ToolGrid>
          </div>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold">최근 본 참고자료</h2>
        {articles.length === 0 ? (
          <p className="mt-3 text-sm text-muted">참고 글을 열면 여기에 기록이 남습니다.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article!.id} article={article!} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
