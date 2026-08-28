import type { Metadata } from "next";
import { ArticleCard } from "@/components/ui/article-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { articles } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: "실무 엔지니어링 참고자료",
  description: "kW와 kVA, CT 100/5A, MCCB와 ELB, ATS와 CTTS, 전압강하 원리 등 검색에 잘 걸리는 전기·시설 실무 설명.",
  alternates: { canonical: "/references" },
};

export default function ReferencesPage() {
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "실무 참고" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">실무 엔지니어링 참고자료</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">
        계산기만으로 부족한 개념, 공식의 의미, 현장 한계를 짧게 정리합니다. 각 글 끝에서 관련 계산기로 바로 이동할 수 있습니다.
      </p>
      <div className="mt-6 max-w-3xl">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
