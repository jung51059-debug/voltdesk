import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CategoryTabs } from "@/components/ui/category-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { getElectricalCategories } from "@/lib/data/categories";
import { getToolsByCategory } from "@/lib/data/tools";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "전기 공학 계산기",
  description:
    "전류, 케이블, 변압기, 모터, 단락, 역률, 조명, 태양광, 스케줄 등 한국 전기 실무 계산기를 분류별로 찾습니다.",
  alternates: { canonical: "/tools/electrical" },
};

export default function ElectricalDirectoryPage() {
  const categories = getElectricalCategories();
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools", label: "전체 도구" }, { label: "전기 계산기" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">전기 공학 계산기</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">
        기본 전류부터 케이블 검토, 변압기, 모터, 단락, 보호, 조명, 태양광, 부하 스케줄까지 현장 1차 검토용 도구입니다.
        각 분류 허브에서 검색·즐겨찾기·관련 자료를 함께 볼 수 있습니다.
      </p>
      <div className="mt-8">
        <CategoryTabs items={categories} />
        <div className="space-y-12">
          {categories.map((category) => {
            const tools = getToolsByCategory(category.id);
            return (
              <section key={category.id} id={category.slug} className="scroll-mt-24">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold">{category.name}</h2>
                    <p className="mt-1 text-sm text-muted">{category.description}</p>
                  </div>
                  <Link href={`/tools/categories/${category.slug}`} className="text-sm font-medium text-primary">
                    분류 허브
                  </Link>
                </div>
                {tools.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState icon={Wrench} title="이 분류의 계산기가 아직 없습니다" description="아키텍처는 준비되어 있으며, 이후 HVAC·소방·기계 도구와 함께 확장됩니다." />
                  </div>
                ) : (
                  <div className="mt-4">
                    <ToolGrid>
                      {tools.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                      ))}
                    </ToolGrid>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
