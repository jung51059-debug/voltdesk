"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { pushRecentSearch } from "@/lib/storage/local";
import { searchUsCatalog } from "@/lib/us/search";
import { trackUsGaMock } from "@/lib/us/analytics/us-ga-mock";

export function UsSearchClient() {
  const [query, setQuery] = useState("");
  const hits = useMemo(() => searchUsCatalog(query), [query]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    pushRecentSearch(q, "US");
    trackUsGaMock("search", { queryLength: String(q.length) });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="h-11 flex-1 rounded-lg border border-border px-3"
          placeholder="voltage drop, AWG, motor, load schedule…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search US catalog"
        />
        <button type="submit" className="h-11 rounded-lg bg-primary px-4 font-medium text-white">
          Search
        </button>
      </form>
      {query.trim() === "" ? (
        <p className="text-sm text-muted">Enter a keyword to search calculators, guides, and workspaces.</p>
      ) : hits.length === 0 ? (
        <p className="text-sm text-muted">No results for &ldquo;{query.trim()}&rdquo;.</p>
      ) : (
        <ul className="space-y-3">
          {hits.map((hit) => (
            <li key={hit.id} className="rounded-xl border border-border bg-card p-4">
              <Link
                href={hit.href}
                className="font-medium text-primary hover:underline"
                onClick={() => trackUsGaMock("search_result_click", { tool_slug: hit.id })}
              >
                {hit.title}
              </Link>
              <p className="mt-1 text-sm text-muted">{hit.description}</p>
              <p className="mt-1 text-xs text-muted">{hit.badges.join(" · ")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}