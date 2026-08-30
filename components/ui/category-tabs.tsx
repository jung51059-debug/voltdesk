"use client";

import Link from "next/link";

export function CategoryTabs({
  items,
}: {
  items: { id: string; slug: string; name: string }[];
}) {
  return (
    <div
      className="mb-8 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="분류"
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.slug}`}
          className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1.5 text-xs hover:border-border-strong"
        >
          {item.name}
        </a>
      ))}
      <Link href="/tools" className="shrink-0 rounded-full bg-info px-3 py-1.5 text-sm font-medium text-primary">
        전체
      </Link>
    </div>
  );
}
