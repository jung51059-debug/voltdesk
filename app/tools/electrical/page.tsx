import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CategoryTabs } from "@/components/ui/category-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { getElectricalCategories } from "@/lib/data/categories";
import { getToolsByCategory } from "@/lib/data/tools";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "전기 공학 계산기",
  description: "부하전류, 전압강하, 변압기, 역률, 케이블, 단위 환산 등 전기 실무 계산기를 분류별로 찾습니다.",
  alternates: { canonical: "/tools/electrical" },
};

export default function ElectricalDirectoryPage() {
  const categories = getElectricalCategories();
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools", label: "전체 도구" }, { label: "전기 계산기" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">전기 공학 계산기</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">
        부하·전류부터 전압강하, 변압기, 역률, 케이블, 차단기 참고, 단위 환산까지 실무 계산을 모았습니다.
      </p>
      <div className="mt-8">
        <CategoryTabs items={categories} />
        <div className="space-y-12">
          {categories.map((category) => {
            const tools = getToolsByCategory(category.id);
            return (
              <section key={category.id} id={category.slug} className="scroll-mt-24">
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <p className="mt-1 text-sm text-muted">{category.description}</p>
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
