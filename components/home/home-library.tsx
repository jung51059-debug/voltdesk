"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { getToolById } from "@/lib/data/tools";
import { loadFavorites, loadRecentTools, subscribeStorage } from "@/lib/storage/local";

export function HomeLibrary() {
  const favRaw = useSyncExternalStore(subscribeStorage, () => JSON.stringify(loadFavorites()), () => "[]");
  const recentRaw = useSyncExternalStore(subscribeStorage, () => JSON.stringify(loadRecentTools()), () => "[]");
  const favs = (JSON.parse(favRaw) as string[]).map((id) => getToolById(id)).filter(Boolean).slice(0, 6);
  const recents = (JSON.parse(recentRaw) as string[]).map((id) => getToolById(id)).filter(Boolean).slice(0, 6);

  if (favs.length === 0 && recents.length === 0) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {recents.length > 0 ? (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">최근 사용</h2>
            <Link href="/tools" className="text-sm text-primary">
              전체 도구
            </Link>
          </div>
          <ToolGrid>
            {recents.map((tool) => (
              <ToolCard key={tool!.id} tool={tool!} />
            ))}
          </ToolGrid>
        </section>
      ) : null}
      {favs.length > 0 ? (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">즐겨찾기</h2>
            <Link href="/favorites" className="text-sm text-primary">
              관리
            </Link>
          </div>
          <ToolGrid>
            {favs.map((tool) => (
              <ToolCard key={tool!.id} tool={tool!} />
            ))}
          </ToolGrid>
        </section>
      ) : null}
    </div>
  );
}
