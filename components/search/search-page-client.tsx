"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchResultItem } from "@/components/ui/search-result-item";
import { searchCatalog, SEARCH_EXAMPLES } from "@/lib/search";
import { pushRecentSearch } from "@/lib/storage/local";

export function SearchPageClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const results = useMemo(() => searchCatalog(query, 40), [query]);

  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          pushRecentSearch(query);
          router.replace(`/search?q=${encodeURIComponent(query.trim())}`);
        }}
      >
        <label className="relative flex-1">
          <span className="sr-only">검색어</span>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-3"
            placeholder="도구, 문서, 약어"
          />
        </label>
        <button type="submit" className="h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-white dark:text-ink">
          검색
        </button>
      </form>
      <p className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted">
        <span>예:</span>
        {SEARCH_EXAMPLES.map((example, index) => (
          <span key={example} className="inline-flex items-center gap-1">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                setQuery(example);
                pushRecentSearch(example);
                router.replace(`/search?q=${encodeURIComponent(example)}`);
              }}
            >
              {example}
            </button>
            {index < SEARCH_EXAMPLES.length - 1 ? <span aria-hidden>·</span> : null}
          </span>
        ))}
      </p>
      <div className="mt-6 divide-y divide-border rounded-[22px] border border-border bg-card p-2">
        {query.trim() && results.length === 0 ? (
          <EmptyState icon={Search} title="결과가 없습니다" description="다른 한글 키워드, 영문 용어, 약어를 시도해 보세요." />
        ) : (
          results.map((hit) => <SearchResultItem key={hit.id} hit={hit} />)
        )}
        {!query.trim() ? <p className="px-4 py-8 text-center text-sm text-muted">검색어를 입력하면 계산기와 참고자료가 함께 나타납니다.</p> : null}
      </div>
    </div>
  );
}
