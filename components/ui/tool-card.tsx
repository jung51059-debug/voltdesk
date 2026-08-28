import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryById } from "@/lib/data/categories";
import type { CalculatorTool } from "@/lib/types";
import { FavoriteButton } from "@/components/ui/favorite-button";

const COMPLEXITY: Record<CalculatorTool["complexity"], string> = {
  basic: "기초",
  intermediate: "중급",
  advanced: "고급",
};

export function ToolCard({
  tool,
  variant = "dashboard",
}: {
  tool: CalculatorTool;
  variant?: "dashboard" | "landing";
}) {
  const category = getCategoryById(tool.categoryId);
  const landing = variant === "landing";

  return (
    <article
      className={`group relative flex h-full flex-col border border-border bg-card transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow)] ${
        landing ? "rounded-[20px] p-5" : "rounded-[16px] p-4"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-[12px] bg-info text-primary">
          <CategoryIcon name={category?.icon ?? "Zap"} className="size-5" />
        </div>
        <FavoriteButton toolId={tool.id} toolName={tool.name} />
      </div>
      {category ? (
        <p className="mb-1.5 inline-flex w-fit rounded-full bg-info px-2 py-0.5 text-[11px] font-medium text-primary">
          {category.name}
        </p>
      ) : null}
      <h3 className={`font-semibold tracking-tight text-ink ${landing ? "text-lg" : "text-[15px] leading-snug"}`}>
        <Link href={tool.href} className="after:absolute after:inset-0">
          {tool.name}
        </Link>
      </h3>
      <p className={`mt-1.5 flex-1 text-sm text-muted ${landing ? "leading-6" : "line-clamp-1 leading-5"}`}>
        {tool.description}
      </p>
      <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
        {landing ? "계산기 열기" : "열기"}
        <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
        <span className="sr-only">
          {COMPLEXITY[tool.complexity]}
        </span>
      </p>
    </article>
  );
}

export function ToolGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
