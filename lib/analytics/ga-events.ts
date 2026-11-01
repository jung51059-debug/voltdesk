/**
 * Ampory GA4 이벤트 헬퍼.
 * Production 호스트에서만 gtag로 전송하며, 계산 입력값(전압·전류 등)은 절대 넣지 않습니다.
 */

import { SITE } from "@/lib/types";

export const GA_MEASUREMENT_ID = "G-JZD2J26DV2";

export const GA_EVENT = {
  calculatorView: "calculator_view",
  calculationRun: "calculation_run",
  resultCopy: "result_copy",
  relatedToolClick: "related_tool_click",
  articleToToolClick: "article_to_tool_click",
} as const;

export type GaEventName = (typeof GA_EVENT)[keyof typeof GA_EVENT];

/** 이벤트에 허용하는 비민감 파라미터만. */
export type GaEventParams = {
  tool_slug?: string;
  category?: string;
  article_slug?: string;
  target_tool_slug?: string;
  source?: string;
};

const ALLOWED_PARAM_KEYS = new Set([
  "tool_slug",
  "category",
  "article_slug",
  "target_tool_slug",
  "source",
]);

export function productionHostname(): string {
  try {
    return new URL(SITE.url).hostname;
  } catch {
    return "ampory.vercel.app";
  }
}

/** 테스트·런타임에서 금지 키가 섞이지 않았는지 검사합니다. */
export function sanitizeGaParams(params: Record<string, unknown> = {}): GaEventParams {
  const out: GaEventParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_PARAM_KEYS.has(key)) continue;
    if (typeof value !== "string") continue;
    if (value.length === 0 || value.length > 120) continue;
    (out as Record<string, string>)[key] = value;
  }
  return out;
}

/**
 * GA 전송 허용 여부.
 * - 로컬 development/test: 차단
 * - Vercel Preview/Development: 차단 (NEXT_PUBLIC_VERCEL_ENV)
 * - 브라우저: Production 호스트(ampory.vercel.app)만 허용
 * - SSR(스크립트 삽입): Vercel Production 빌드만 허용
 */
export function isGaEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return false;

  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || "";
  if (vercelEnv === "preview" || vercelEnv === "development") return false;

  if (typeof window !== "undefined") {
    return window.location.hostname === productionHostname();
  }

  // 스크립트 SSR/빌드: Vercel Production에서만 true. 로컬 next start는 env 비어 있어 차단.
  return vercelEnv === "production";
}

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

/**
 * GA4 커스텀 이벤트 전송.
 * Preview·개발·비프로덕션 호스트에서는 호출해도 네트워크로 보내지 않습니다.
 */
export function trackGaEvent(name: GaEventName, params: GaEventParams = {}): boolean {
  if (!isGaEnabled()) return false;
  if (typeof window === "undefined") return false;
  const safe = sanitizeGaParams(params);
  window.gtag?.("event", name, safe);
  return true;
}
