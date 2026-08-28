"use client";

import Link from "next/link";

export function CategoryTabs({
  items,
}: {
  items: { id: string; slug: string; name: string }[];
}) {
  return (
    <div className="mb-8 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="분류">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.slug}`}
          className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-border-strong"
        >
          {item.name}
        </a>
      ))}
      <Link href="/tools" className="shrink-0 rounded-full bg-info px-4 py-2 text-sm text-primary">
        전체
      </Link>
    </div>
  );
}
