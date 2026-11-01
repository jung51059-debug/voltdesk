"use client";

import Link from "next/link";
import { GA_EVENT, trackGaEvent } from "@/lib/analytics/ga-events";
import type { CalculatorTool } from "@/lib/types";

/** 참고글 → 계산기 클릭만 article_to_tool_click으로 기록합니다. */
export function ArticleToolLinks({
  articleSlug,
  tools,
}: {
  articleSlug: string;
  tools: CalculatorTool[];
}) {
  if (tools.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold">관련 Ampory 계산기</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
        {tools.map((tool) => (
          <li key={tool.id}>
            <Link
              href={tool.href}
              className="text-primary hover:underline"
              onClick={() => {
                trackGaEvent(GA_EVENT.articleToToolClick, {
                  article_slug: articleSlug,
                  target_tool_slug: tool.slug,
                  tool_slug: tool.slug,
                });
              }}
            >
              {tool.pageHeading ?? tool.name}
            </Link>
            <span className="text-muted"> — {tool.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
