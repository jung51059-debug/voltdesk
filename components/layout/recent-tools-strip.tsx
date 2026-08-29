"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getToolById } from "@/lib/data/tools";
import { loadRecentTools, subscribeStorage } from "@/lib/storage/local";

function getSnapshot() {
  return JSON.stringify(loadRecentTools());
}

function getServerSnapshot() {
  return "[]";
}

export function RecentToolsStrip() {
  const pathname = usePathname();
  const onCalculator = /^\/tools\/(electrical|facility|schedules|advanced|categories)\/[^/]+$/.test(pathname);
  const raw = useSyncExternalStore(subscribeStorage, getSnapshot, getServerSnapshot);
  const ids = JSON.parse(raw) as string[];
  const tools = ids.map((id) => getToolById(id)).filter((tool) => Boolean(tool));
  if (onCalculator || tools.length === 0) return null;

  return (
    <section aria-label="최근 사용 도구" className="border-t border-border bg-card/70">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-4 py-3 sm:px-6">
        <Clock className="size-4 shrink-0 text-muted" aria-hidden />
        <p className="shrink-0 text-xs font-medium text-muted">최근 도구</p>
        {tools.map((tool) => (
          <Link
            key={tool!.id}
            href={tool!.href}
            className="shrink-0 rounded-full bg-info px-3 py-1 text-xs text-primary"
          >
            {tool!.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
