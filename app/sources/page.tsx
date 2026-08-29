import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { formulas } from "@/lib/data/formulas";

export const metadata: Metadata = {
  title: "참고 문헌·출처",
  description: "Ampory 계산기와 문서가 인용하는 규격·공학 참고 자료 목록.",
  alternates: { canonical: "/sources" },
};

export default function SourcesPage() {
  const sources = formulas.flatMap((formula) => formula.referenceSources.map((source) => ({ ...source, formula: formula.title })));

  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "참고 문헌·출처" }]} />
      <h1 className="text-3xl font-semibold">참고 문헌·출처</h1>
      <p className="mt-4 leading-7 text-muted">
        아래 문헌은 공식의 공학적 배경을 안내합니다. 사이트 계산이 해당 규격의 인증 구현임을 의미하지 않습니다.
      </p>
      <ul className="mt-8 space-y-4">
        {sources.map((source) => (
          <li key={`${source.id}-${source.formula}`} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted">{source.formula}</p>
            <p className="mt-1 font-medium">{source.title}</p>
            <p className="text-sm text-muted">
              {source.publisher} — {source.note}
            </p>
            {source.url ? (
              <a className="mt-1 inline-block text-sm text-primary" href={source.url} rel="noreferrer">
                {source.url}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
