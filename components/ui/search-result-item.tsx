import Link from "next/link";
import { Calculator, FileText, Folder } from "lucide-react";
import type { SearchHit } from "@/lib/types";

const ICONS = {
  calculator: Calculator,
  article: FileText,
  category: Folder,
};

export function SearchResultItem({ hit }: { hit: SearchHit }) {
  const Icon = ICONS[hit.type];
  return (
    <Link
      href={hit.href}
      className="flex gap-3 rounded-2xl border border-transparent px-3 py-3 transition-colors duration-150 hover:border-border hover:bg-info"
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-info text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ink">{hit.title}</span>
          {hit.badges.map((badge) => (
            <span key={badge} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">
              {badge}
            </span>
          ))}
        </span>
        <span className="mt-1 line-clamp-2 block text-sm text-muted">{hit.description}</span>
      </span>
    </Link>
  );
}
