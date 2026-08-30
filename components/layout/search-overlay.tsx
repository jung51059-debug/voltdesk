"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SearchResultItem } from "@/components/ui/search-result-item";
import { searchCatalog, SEARCH_EXAMPLES } from "@/lib/search";
import { loadRecentSearches, pushRecentSearch, subscribeStorage } from "@/lib/storage/local";
import { getFeaturedTools } from "@/lib/data/tools";

function getRecentSnapshot() {
  return JSON.stringify(loadRecentSearches());
}

function getRecentServerSnapshot() {
  return "[]";
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const recent = JSON.parse(useSyncExternalStore(subscribeStorage, getRecentSnapshot, getRecentServerSnapshot)) as string[];
  const router = useRouter();
  const results = useMemo(() => searchCatalog(query, 12), [query]);
  const suggestions = getFeaturedTools().slice(0, 5);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="전체 검색">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="검색 닫기" onClick={onClose} />
      <div className="relative mx-auto mt-16 w-[min(720px,calc(100%-1.5rem))] rounded-2xl border border-border bg-card shadow-[var(--shadow)] transition-transform duration-200">
        <form
          className="flex items-center gap-3 border-b border-border px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            const q = query.trim();
            if (!q) return;
            pushRecentSearch(q);
            onClose();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <Search className="size-5 text-muted" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="계산기, 약어, 한글·영문 키워드"
            className="h-11 w-full bg-transparent text-base outline-none placeholder:text-muted"
            aria-label="검색어"
          />
          <button
            type="button"
            onClick={onClose}
            className="hidden rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted hover:bg-info sm:inline"
            aria-label="검색 닫기"
          >
            ESC
          </button>
        </form>
        <div className="max-h-[min(70vh,480px)] overflow-y-auto p-3">
          {query.trim() ? (
            results.length > 0 ? (
              results.map((hit) => <SearchResultItem key={hit.id} hit={hit} />)
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted">일치하는 도구 또는 문서가 없습니다.</p>
            )
          ) : (
            <div className="space-y-5 px-2 py-2">
              {recent.length > 0 ? (
                <section>
                  <h3 className="px-1 text-xs font-semibold tracking-wide text-muted uppercase">최근 검색</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recent.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="rounded-full bg-info px-3 py-1 text-sm text-primary"
                        onClick={() => setQuery(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <section>
                <h3 className="px-1 text-xs font-semibold tracking-wide text-muted uppercase">추천 도구</h3>
                <ul className="mt-2">
                  {suggestions.map((tool) => (
                    <li key={tool.id}>
                      <SearchResultItem
                        hit={{
                          id: tool.id,
                          type: "calculator",
                          title: tool.name,
                          description: tool.description,
                          href: tool.href,
                          badges: ["계산기"],
                          score: 0,
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
              <p className="px-1 text-xs text-muted">예: {SEARCH_EXAMPLES.join(" · ")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
