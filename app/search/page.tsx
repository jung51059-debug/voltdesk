import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/search-page-client";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "검색",
  description: "전기 계산기, 시설 관리 도구, 실무 참고자료를 한글·영문·약어로 검색합니다.",
  alternates: { canonical: "/search" },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "검색" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">검색</h1>
      <p className="mt-3 text-muted">전압강하, voltage drop, UPS, 변압기, kVA, 역률처럼 현장 용어로 찾으세요.</p>
      <div className="mt-8">
        <SearchPageClient initialQuery={q} />
      </div>
    </div>
  );
}
