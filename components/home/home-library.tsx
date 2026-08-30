"use client";

import { useSyncExternalStore } from "react";
import { SectionHeading } from "@/components/home/section-heading";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { getToolById } from "@/lib/data/tools";
import { loadFavorites, subscribeStorage } from "@/lib/storage/local";

export function HomeLibrary() {
  const favRaw = useSyncExternalStore(subscribeStorage, () => JSON.stringify(loadFavorites()), () => "[]");
  const favs = (JSON.parse(favRaw) as string[]).map((id) => getToolById(id)).filter(Boolean).slice(0, 6);

  if (favs.length === 0) return null;

  return (
    <section>
      <SectionHeading title="즐겨찾기" href="/favorites" linkLabel="관리" />
      <ToolGrid>
        {favs.map((tool) => (
          <ToolCard key={tool!.id} tool={tool!} />
        ))}
      </ToolGrid>
    </section>
  );
}
