import Link from "next/link";
import type { ReferenceArticle } from "@/lib/types";

export function ArticleCard({
  article,
  variant = "doc",
}: {
  article: ReferenceArticle;
  variant?: "doc" | "teaser";
}) {
  if (variant === "teaser") {
    return (
      <article className="group relative rounded-[16px] border border-border bg-card p-5 transition-[border-color] duration-150 hover:border-border-strong">
        <h3 className="text-base font-semibold text-ink">
          <Link href={article.href} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{article.summary}</p>
      </article>
    );
  }

  return (
    <article className="group relative border-b border-border py-5">
      <h3 className="text-base font-semibold text-ink">
        <Link href={article.href} className="after:absolute after:inset-0 hover:text-primary">
          {article.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted">{article.summary}</p>
    </article>
  );
}
