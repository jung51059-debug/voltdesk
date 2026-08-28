import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CategoryTabs } from "@/components/ui/category-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { getFacilityCategories } from "@/lib/data/categories";
import { getToolsByCategory } from "@/lib/data/tools";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "시설 관리 도구",
  description: "UPS 백업시간·용량, 발전기 부하율, 월간 전력사용량 비교 등 시설 운영 계산기.",
  alternates: { canonical: "/tools/facility" },
};

export default function FacilityDirectoryPage() {
  const categories = getFacilityCategories();
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools", label: "전체 도구" }, { label: "시설 관리" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">시설 관리 도구</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">
        UPS, 비상발전기, 수전 사용량 비교 등 운전·유지 업무용 계산기입니다. HVAC, 소방, 에너지 관리 도구는 이후 같은 구조로 추가됩니다.
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
