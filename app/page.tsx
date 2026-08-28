import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { ArticleCard } from "@/components/ui/article-card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ToolCard } from "@/components/ui/tool-card";
import { QuickCurrentPreview } from "@/components/home/quick-current-preview";
import { articles } from "@/lib/data/articles";
import { getElectricalCategories, getFacilityCategories } from "@/lib/data/categories";
import { getFeaturedTools, getRecentlyAddedTools } from "@/lib/data/tools";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "전기·시설 엔지니어링 계산 도구",
  description:
    "단상·3상 부하전류, 전압강하, 변압기 부하율, 역률, UPS 백업시간, 발전기 부하율, 월간 전력사용량 비교를 로그인 없이 바로 계산합니다.",
};

export default function HomePage() {
  const featured = getFeaturedTools();
  const recent = getRecentlyAddedTools();
  const electrical = getElectricalCategories();
  const facility = getFacilityCategories();

  return (
    <div className="space-y-14">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="text-sm font-medium text-primary">전기 · 시설관리 엔지니어링 유틸리티</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            현장에서 바로 쓰는
            <br />
            전기 계산과 실무 참고
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
            부하전류, 전압강하, 변압기·발전기 부하율, UPS 백업시간까지. 가입 없이 계산하고, 가정과 한계를 함께 확인하세요.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/tools/electrical/three-phase-current" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white dark:text-ink">
              3상 전류 계산
            </Link>
            <Link href="/search" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-medium">
              <Search className="size-4" />
              도구 검색
            </Link>
          </div>
        </div>
        <QuickCurrentPreview />
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">자주 쓰는 계산기</h2>
          <Link href="/tools" className="text-sm font-medium text-primary">
            전체 보기
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tool) => (
            <ToolCard key={tool.id} tool={tool} variant="landing" />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[22px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">전기 공학 도구</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {electrical.map((category) => (
              <li key={category.id}>
                <Link href={`/tools/electrical#${category.slug}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-info">
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
          <h2 className="text-xl font-semibold">시설 관리 도구</h2>
          <ul className="mt-4 space-y-2">
            {facility.map((category) => (
              <li key={category.id}>
                <Link href={`/tools/facility#${category.slug}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-info">
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

      <section>
        <h2 className="text-2xl font-semibold">최근 추가된 도구</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((tool) => (
            <ToolCard key={tool.id} tool={tool} variant="landing" />
          ))}
        </div>
      </section>
    </div>
  );
}
