import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GA_EVENT,
  isGaEnabled,
  productionHostname,
  sanitizeGaParams,
  trackGaEvent,
} from "@/lib/analytics/ga-events";

describe("GA4 이벤트 헬퍼", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("민감·허용 외 키를 제거한다", () => {
    const safe = sanitizeGaParams({
      tool_slug: "voltage-drop",
      category: "cable",
      voltage: "380",
      current: "80",
      power: "30",
      site: "공장A",
      article_slug: "kw-vs-kva",
      target_tool_slug: "three-phase-current",
      source: "related_resources",
      nested: { a: 1 },
      empty: "",
    });
    expect(safe).toEqual({
      tool_slug: "voltage-drop",
      category: "cable",
      article_slug: "kw-vs-kva",
      target_tool_slug: "three-phase-current",
      source: "related_resources",
    });
    expect(safe).not.toHaveProperty("voltage");
    expect(safe).not.toHaveProperty("current");
    expect(safe).not.toHaveProperty("power");
    expect(safe).not.toHaveProperty("site");
  });

  it("개발 환경에서는 gtag를 호출하지 않는다", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    expect(isGaEnabled()).toBe(false);
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag, location: { hostname: productionHostname() } });
    expect(trackGaEvent(GA_EVENT.calculatorView, { tool_slug: "voltage-drop" })).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("Vercel Preview에서는 전송하지 않는다", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    expect(isGaEnabled()).toBe(false);
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag, location: { hostname: productionHostname() } });
    expect(trackGaEvent(GA_EVENT.calculationRun, { tool_slug: "motor-current" })).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("Production 호스트에서만 event를 보낸다", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag, location: { hostname: productionHostname() } });
    expect(isGaEnabled()).toBe(true);
    expect(
      trackGaEvent(GA_EVENT.calculationRun, {
        tool_slug: "motor-current",
        category: "motor",
        voltage: "380",
      } as never),
    ).toBe(true);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", GA_EVENT.calculationRun, {
      tool_slug: "motor-current",
      category: "motor",
    });
  });

  it("localhost Production 빌드에서는 전송하지 않는다", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag, location: { hostname: "localhost" } });
    expect(isGaEnabled()).toBe(false);
    expect(trackGaEvent(GA_EVENT.resultCopy, { tool_slug: "voltage-drop" })).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("이벤트 이름 5종이 서로 다르고 page_view와 겹치지 않는다", () => {
    const names = Object.values(GA_EVENT);
    expect(new Set(names).size).toBe(5);
    expect(names).not.toContain("page_view");
    expect(names).toEqual(
      expect.arrayContaining([
        "calculator_view",
        "calculation_run",
        "result_copy",
        "related_tool_click",
        "article_to_tool_click",
      ]),
    );
  });
});
