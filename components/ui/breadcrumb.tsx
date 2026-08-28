import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { href?: string; label: string };

export function Breadcrumb({ items, compact = false }: { items: Crumb[]; compact?: boolean }) {
  return (
    <nav aria-label="경로" className={compact ? "mb-4" : "mb-6"}>
      <ol className={`flex flex-wrap items-center gap-1 text-muted ${compact ? "text-xs" : "text-sm"}`}>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3.5 opacity-70" aria-hidden /> : null}
              {last || !item.href ? (
                <span className="text-ink/80" aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="rounded-sm hover:text-primary">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
