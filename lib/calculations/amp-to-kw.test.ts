import { describe, expect, it } from "vitest";
import { calculateAmpToKw, ampToWatts, formatFixedKw, AMP_TO_KW_NOTICE } from "@/lib/calculations/amp-to-kw";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getToolBySlug } from "@/lib/data/tools";
import { faqJsonLd, sitemapEntries } from "@/lib/seo";
import { SQRT_3 } from "@/lib/math/units";

const base = { phase: "1", voltage: "220", voltageUnit: "V", current: "20", pf: "1" };

function kwOf(out: ReturnType<typeof calculateAmpToKw>) {
  if (!out.ok) throw new Error(out.formError ?? "fail");
  return out.metrics.find((item) => item.id === "kw");
}

describe("전류에서 전력", () => {
  it("단상 220V 20A PF 1은 4,400W와 4.40kW다", () => {
    expect(ampToWatts("1", 220, 20, 1)).toBe(4400);
    const out = calculateAmpToKw(base, 2);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(kwOf(out)).toMatchObject({ value: "4.40", unit: "kW" });
    expect(out.metrics.find((item) => item.id === "power")).toMatchObject({ value: "4,400", unit: "W" });
    expect(out.steps?.join(" ")).toContain("220 × 20 × 1.0 = 4,400 W");
    expect(out.warnings.some((item) => item.message === AMP_TO_KW_NOTICE)).toBe(true);
    expect(out.reviewStatus).toBeUndefined();
  });

  it("단상 220V 30A는 6,600W, 16A는 3,520W다", () => {
    const thirty = calculateAmpToKw({ ...base, current: "30" }, 2);
    const sixteen = calculateAmpToKw({ ...base, current: "16" }, 2);
    expect(thirty.ok && kwOf(thirty)?.value).toBe("6.60");
    expect(thirty.ok && thirty.metrics.find((item) => item.id === "power")?.value).toBe("6,600");
    expect(sixteen.ok && kwOf(sixteen)?.value).toBe("3.52");
    expect(sixteen.ok && sixteen.metrics.find((item) => item.id === "power")?.value).toBe("3,520");
  });

  it("3상 380V PF 0.9의 20·30·40A는 11.85·17.77·23.69kW다", () => {
    const input = { phase: "3", voltage: "380", voltageUnit: "V", pf: "0.9" };
    expect(kwOf(calculateAmpToKw({ ...input, current: "20" }, 2))?.value).toBe("11.85");
    expect(kwOf(calculateAmpToKw({ ...input, current: "30" }, 2))?.value).toBe("17.77");
    expect(kwOf(calculateAmpToKw({ ...input, current: "40" }, 2))?.value).toBe("23.69");
    expect(ampToWatts("3", 380, 20, 0.9)).toBeCloseTo((SQRT_3 * 380 * 20 * 0.9), 6);
  });

  it("빈 값·0·음수·역률 범위·너무 큰 값은 숫자가 되지 않는다", () => {
    expect(calculateAmpToKw({ ...base, voltage: "" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, voltage: "0" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, voltage: "-220" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, voltage: "abc" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, current: "" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, current: "0" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, current: "-20" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, current: "abc" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, pf: "" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, pf: "0" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, pf: "-0.5" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, pf: "1.2" }, 2).ok).toBe(false);
    expect(calculateAmpToKw({ ...base, pf: "abc" }, 2).ok).toBe(false);
    const huge = calculateAmpToKw({ ...base, current: "1e20" }, 2);
    expect(huge.ok).toBe(false);
    const text = JSON.stringify(huge);
    expect(text).not.toContain("Infinity");
    expect(text).not.toContain("NaN");
    const shown = JSON.stringify(calculateAmpToKw(base, 2));
    expect(shown).not.toMatch(/안전합니다|사용 가능합니다|최대 안전|80%/);
  });

  it("안내 표는 같은 계산의 반올림과 같다", () => {
    const tables = getCalculatorGuide("amp-to-kw")?.lookups ?? [];
    const single = tables.find((table) => table.title.includes("단상"));
    const three = tables.find((table) => table.title.includes("3상"));
    for (const amps of [10, 15, 16, 20, 30, 40, 50]) {
      expect(single?.rows).toContainEqual([`${amps} A`, `${formatFixedKw(ampToWatts("1", 220, amps, 1) / 1000)} kW`]);
    }
    for (const amps of [10, 20, 30, 40]) {
      expect(three?.rows).toContainEqual([`${amps} A`, `${formatFixedKw(ampToWatts("3", 380, amps, 0.9) / 1000)} kW`]);
    }
    expect(single?.rows.find((row) => row[0] === "20 A")?.[1]).toBe("4.40 kW");
    expect(three?.rows.find((row) => row[0] === "20 A")?.[1]).toBe("11.85 kW");
  });

  it("화면 FAQ와 JSON-LD가 같고 사이트맵에 들어간다", () => {
    const tool = getToolBySlug("amp-to-kw");
    expect(tool?.href).toBe("/tools/electrical/amp-to-kw");
    expect(tool?.categoryId).toBe("cat-electrical-basics");
    expect(tool?.metaTitle).toBe("20A는 몇 kW? 220V·380V 전력 계산");
    const questions = tool?.faqs.map((faq) => faq.question) ?? [];
    expect(questions).toEqual([
      "20A는 몇 kW인가요?",
      "220V 20A는 몇 W인가요?",
      "30A는 몇 kW인가요?",
      "220V 30A는 몇 W인가요?",
      "380V 20A는 몇 kW인가요?",
      "차단기 20A면 4.4kW까지 사용할 수 있나요?",
      "A를 kW로 바꾸려면 무엇을 알아야 하나요?",
      "단상과 3상은 계산식이 왜 다른가요?",
    ]);
    expect(faqJsonLd(tool?.faqs ?? [])?.mainEntity.map((item) => item.name)).toEqual(questions);
    expect(sitemapEntries()).toContain("/tools/electrical/amp-to-kw");
  });
});
