import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArticleCard } from "@/components/ui/article-card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ToolCard } from "@/components/ui/tool-card";
import { QuickCurrentPreview } from "@/components/home/quick-current-preview";
import { HomeSearch } from "@/components/home/home-search";
import { HomeLibrary } from "@/components/home/home-library";
import { articles } from "@/lib/data/articles";
import { getElectricalCategories, getFacilityCategories } from "@/lib/data/categories";
import { getFeaturedTools, getRecentlyAddedTools } from "@/lib/data/tools";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "전기·시설관리 엔지니어링 유틸리티",
  description:
    "현장에서 바로 쓰는 전기 계산과 실무 참고. 케이블, 변압기, 모터, 역률, UPS, 발전기, 부하 스케줄을 로그인 없이 계산합니다.",
};

export default function HomePage() {
  const featured = getFeaturedTools();
  const recent = getRecentlyAddedTools().slice(0, 4);
  const design = getElectricalCategories();
  const facilityFocus = getFacilityCategories();

  return (
    <div className="space-y-11">
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div>
          <p className="text-sm font-medium text-primary">전기 · 시설관리 엔지니어링 유틸리티</p>
          <h1 className="mt-2 text-[2.125rem] font-semibold leading-[1.2] tracking-tight sm:text-[2.75rem]">
            현장에서 바로 쓰는
            <br />
            전기 계산과 실무 참고
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted">
            한국 전기·시설관리 실무자를 위한 독립 도구입니다. 가입 없이 계산하고, 공식·가정·한계를 함께 확인하세요.
          </p>
          <HomeSearch />
        </div>
        <QuickCurrentPreview />
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">빠른 계산 · 자주 쓰는 계산기</h2>
          <Link href="/tools" className="text-sm font-medium text-primary">
            전체 보기
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 9).map((tool) => (
            <ToolCard key={tool.id} tool={tool} variant="landing" />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[22px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">전기 설계</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {design.map((category) => (
              <li key={category.id}>
                <Link href={`/tools/categories/${category.slug}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-info">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-info text-primary">
                    <CategoryIcon name={category.icon} className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{category.name}</span>
                    <span className="block text-xs text-muted">{category.nameEn}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[22px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">시설관리</h2>
          <ul className="mt-4 space-y-2">
            {facilityFocus.map((category) => (
              <li key={category.id}>
                <Link href={`/tools/categories/${category.slug}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-info">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-info text-primary">
                    <CategoryIcon name={category.icon} className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{category.name}</span>
                    <span className="block text-xs text-muted">{category.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">새로 추가된 도구</h2>
          <Link href="/tools" className="text-sm font-medium text-primary">
            전체 계산기 보기 →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((tool) => (
            <ToolCard key={tool.id} tool={tool} variant="landing" />
          ))}
        </div>
      </section>

      <HomeLibrary />

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">실무 참고자료</h2>
          <Link href="/references" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            라이브러리 <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((article) => (
            <ArticleCard key={article.id} article={article} variant="teaser" />
          ))}
        </div>
      </section>
    </div>
  );
}
