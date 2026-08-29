import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CategoryTabs } from "@/components/ui/category-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { getFacilityCategories } from "@/lib/data/categories";
import { getToolsByCategory } from "@/lib/data/tools";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "시설 관리 도구",
  description: "UPS, 배터리, 비상발전기, 현장 검증, 운전·에너지 등 시설 관리 계산기.",
  alternates: { canonical: "/tools/facility" },
};

export default function FacilityDirectoryPage() {
  const categories = getFacilityCategories();
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools", label: "전체 도구" }, { label: "시설 관리" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">시설 관리 도구</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">
        UPS·배터리, 비상발전기, 현장 측정·성능 검증, 설비 운전, 에너지 분석 등 시설 관리 계산기입니다.
        설계 용량 산정과 현장 실측 검토를 구분해 제공합니다.
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
                    <EmptyState icon={Wrench} title="이 분류는 확장 예정입니다" description="설비 용량·유지보수 주기 참고 도구를 같은 카드 구조로 추가할 수 있습니다." />
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
