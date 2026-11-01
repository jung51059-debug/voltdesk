"use client";

import { useEffect, useRef } from "react";
import { GA_EVENT, trackGaEvent } from "@/lib/analytics/ga-events";

/**
 * 계산기 화면 진입 시 calculator_view를 도구(slug)당 한 번 보냅니다.
 * page_view(경로)와 분리된 도구 단위 조회 이벤트입니다.
 * SPA로 다른 계산기로 바뀌면 slug가 달라질 때만 다시 보냅니다.
 */
export function TrackCalculatorView({
  toolSlug,
  category,
}: {
  toolSlug: string;
  category?: string;
}) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${toolSlug}\0${category ?? ""}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    trackGaEvent(GA_EVENT.calculatorView, {
      tool_slug: toolSlug,
      ...(category ? { category } : {}),
    });
  }, [toolSlug, category]);

  return null;
}
