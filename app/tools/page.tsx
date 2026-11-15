import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CategoryIcon } from "@/components/ui/category-icon";
import { ToolCard, ToolGrid } from "@/components/ui/tool-card";
import { getHubCategories } from "@/lib/data/categories";
import { getPublishedTools } from "@/lib/data/tools";

export const metadata: Metadata = {
  title: "전체 엔지니어링 도구",
  description: "Ampory의 전기 계산기와 시설 관리 도구를 분류별로 살펴봅니다.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  const tools = getPublishedTools();
  const hubs = getHubCategories();
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "전체 도구" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">전체 도구</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">
        로그인 없이 모든 무료 계산기를 사용할 수 있습니다. 즐겨찾기와 최근 사용 기록은 이 브라우저에만 저장됩니다.{" "}
        <Link href="/tools/electrical" className="font-medium text-primary hover:underline">
          전기
        </Link>
        ·
        <Link href="/tools/facility" className="font-medium text-primary hover:underline">
          시설
        </Link>
        목록이나 분류 허브에서 주제별로 좁혀 볼 수 있습니다.{" "}
        <Link href="/tools/categories/schedule" className="font-medium text-primary hover:underline">
          Schedule
        </Link>
        는 집계·목록,
        <Link href="/tools/categories/advanced" className="font-medium text-primary hover:underline">
          고급 검토
        </Link>
        는 위험 점검 목록(에너지·점수 자동 계산 없음)입니다.
      </p>
      <h2 className="mt-10 text-xl font-semibold">분류</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hubs.map((category) => (
          <li key={category.id}>
            <Link
              href={`/tools/categories/${category.slug}`}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:border-border-strong"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info text-primary">
                <CategoryIcon name={category.icon} className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-medium">{category.name}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{category.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 text-xl font-semibold">모든 계산기</h2>
      <div className="mt-4">
        <ToolGrid>
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </ToolGrid>
      </div>
    </div>
  );
}
