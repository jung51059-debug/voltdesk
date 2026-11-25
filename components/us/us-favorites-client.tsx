"use client";

import Link from "next/link";
import {isUsNavigationVisible} from '@/lib/us/release-gate';
import { useMemo } from "react";
import { useFavorites } from "@/components/providers/favorite-provider";
import { US_SEARCH_INDEX } from "@/lib/us/search-index";
import { buildUsToolPresentation } from "@/lib/us/tool-presentation";
import { US_ROUTABLE_SLUGS } from "@/lib/us/us-routable-slugs";

const ID_MAP = new Map(
  US_SEARCH_INDEX.map((item) => [
    item.id,
    { title: item.title, href: item.href },
  ]),
);

for (const slug of US_ROUTABLE_SLUGS) {
  const p = buildUsToolPresentation(slug);
  if (p && isUsNavigationVisible(p.href)) ID_MAP.set(p.id, { title: p.name, href: p.href });
}

export function UsFavoritesClient() {
  const { favorites, toggle } = useFavorites();
  const rows = useMemo(
    () =>
      favorites
        .map((id) => ({ id, ...(ID_MAP.get(id) ?? { title: id, href: "#" }) }))
        .filter((r) => r.href !== "#"&&isUsNavigationVisible(r.href)),
    [favorites],
  );

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No favorites yet. Star a calculator or workspace to save it here (this browser only).</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <Link href={row.href} className="font-medium text-primary hover:underline">
                {row.title}
              </Link>
              <button type="button" className="text-sm text-muted hover:text-error" onClick={() => toggle(row.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">Storage key: voltdesk:favorites:us (separate from Korea).</p>
    </div>
  );
}
