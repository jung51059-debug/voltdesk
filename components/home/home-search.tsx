"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      className="mt-5"
      onSubmit={(event) => {
        event.preventDefault();
        const query = q.trim();
        router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
      }}
    >
      <label className="sr-only" htmlFor="home-search">
        계산기 검색
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="home-search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="무엇을 계산하시나요? 전압강하, 변압기, UPS, 전류..."
            className="h-12 w-full rounded-2xl border border-border-strong bg-card pl-12 pr-4 text-base shadow-[var(--shadow)]"
          />
        </div>
        <button type="submit" className="h-12 rounded-2xl bg-primary px-6 text-sm font-semibold text-white dark:text-ink">
          검색
        </button>
      </div>
    </form>
  );
}
