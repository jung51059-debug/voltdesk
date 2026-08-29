import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { getPublishedTools } from "@/lib/data/tools";

export const metadata: Metadata = {
  title: "전체 엔지니어링 도구",
  description: "Ampory의 전기 계산기와 시설 관리 도구를 한곳에서 살펴봅니다.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  const tools = getPublishedTools();
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "전체 도구" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">전체 도구</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">
        로그인 없이 모든 무료 계산기를 사용할 수 있습니다. 즐겨찾기와 최근 사용 기록은 이 브라우저에만 저장됩니다.
      </p>
      <div className="mt-8">
        <ToolGrid>
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </ToolGrid>
      </div>
    </div>
  );
}
