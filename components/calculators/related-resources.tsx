import type { ReactNode } from "react";
import Link from "next/link";
import type { CalculatorTool, ReferenceArticle } from "@/lib/types";

export function RelatedResources({
  related,
  articles,
  share,
}: {
  related: CalculatorTool[];
  articles: ReferenceArticle[];
  share?: ReactNode;
}) {
  if (related.length === 0 && articles.length === 0 && !share) return null;

  return (
    <nav className="mt-8 border-t border-border pt-6" aria-label="관련 자료">
      <h2 className="text-lg font-semibold">관련 계산기·참고자료</h2>
      {related.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium">계산기</h3>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {related.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="text-muted hover:text-primary">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {articles.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium">참고자료</h3>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {articles.map((article) => (
              <li key={article.id}>
                <Link href={article.href} className="text-muted hover:text-primary">
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {share ? <div className="mt-4 text-sm">{share}</div> : null}
    </nav>
  );
}
