import { describe, expect, it } from "vitest";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getToolBySlug } from "@/lib/data/tools";
import { faqJsonLd, sitemapEntries } from "@/lib/seo";
import {
  POWER_STRIP_EMPTY_LOADS,
  POWER_STRIP_OVER_MESSAGE,
  POWER_STRIP_UNDER_MESSAGE,
  calculatePowerStripCapacity,
  powerStripLookupWatts,
  powerStripWatts,
} from "@/lib/calculations/power-strip";

const base = { voltage: "220", voltageUnit: "V", current: "16", loads: POWER_STRIP_EMPTY_LOADS };

function loads(items: { name: string; watts: string }[]) {
  return JSON.stringify(items.map((item, index) => ({ id: String(index + 1), ...item })));
}

describe("멀티탭·콘센트 용량", () => {
  it("220V 16A는 3,520W와 3.52kW다", () => {
    expect(powerStripWatts(220, 16)).toBe(3520);
    const out = calculatePowerStripCapacity(base, 2);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.metrics.find((item) => item.id === "power")).toMatchObject({ value: "3,520", unit: "W" });
    expect(out.metrics.find((item) => item.id === "kw")).toMatchObject({ value: "3.52", unit: "kW" });
    expect(out.steps?.join(" ")).toContain("220 × 16 = 3,520 W");
    expect(out.interpretation).toContain("안전한 연속 사용전력을 보장하는 값은 아닙니다");
  });

  it("220V 10A는 2,200W, 15A는 3,300W다", () => {
    const ten = calculatePowerStripCapacity({ ...base, current: "10" }, 2);
    const fifteen = calculatePowerStripCapacity({ ...base, current: "15" }, 2);
    expect(ten.ok && ten.metrics.find((item) => item.primary)?.value).toBe("2,200");
    expect(fifteen.ok && fifteen.metrics.find((item) => item.primary)?.value).toBe("3,300");
  });

  it("1,500·1,200·700W 합계는 3,400W이고 16A와 120W 차이다", () => {
    const out = calculatePowerStripCapacity(
      { ...base, loads: loads([{ name: "전기포트", watts: "1500" }, { name: "전자레인지", watts: "1200" }, { name: "밥솥", watts: "700" }]) },
      2,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.metrics.find((item) => item.id === "sum")).toMatchObject({ value: "3,400", unit: "W" });
    expect(out.metrics.find((item) => item.id === "difference")).toMatchObject({ value: "120", unit: "W" });
    expect(out.metrics.find((item) => item.id === "ratio")?.value).toBe("96.59");
    expect(out.warnings.some((item) => item.message === POWER_STRIP_UNDER_MESSAGE)).toBe(true);
    expect(out.warnings.some((item) => item.message === POWER_STRIP_OVER_MESSAGE)).toBe(false);
  });

  it("100·50·15W 합계는 165W이고 안전하다고 말하지 않는다", () => {
    const out = calculatePowerStripCapacity(
      { ...base, loads: loads([{ name: "", watts: "100" }, { name: "", watts: "50" }, { name: "", watts: "15" }]) },
      2,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.metrics.find((item) => item.id === "sum")?.value).toBe("165");
    expect(out.warnings.some((item) => item.message === POWER_STRIP_UNDER_MESSAGE)).toBe(true);
    const text = `${out.interpretation} ${out.warnings.map((item) => item.message).join(" ")}`;
    expect(text).not.toMatch(/안전합니다|사용 불가|절대 안전|2,816|80%/);
  });

  it("정격을 넘으면 초과 안내만 하고 위험 판정을 하지 않는다", () => {
    const out = calculatePowerStripCapacity({ ...base, loads: loads([{ name: "", watts: "4000" }]) }, 2);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.warnings.some((item) => item.message === POWER_STRIP_OVER_MESSAGE)).toBe(true);
    expect(out.reviewStatus).toBeUndefined();
    expect(out.warnings.map((item) => item.message).join(" ")).not.toMatch(/위험|사용 불가/);
  });

  it("빈 값·0·음수·숫자가 아닌 값·무한대에 가까운 값은 결과가 되지 않는다", () => {
    expect(calculatePowerStripCapacity({ ...base, voltage: "" }, 2).ok).toBe(false);
    expect(calculatePowerStripCapacity({ ...base, voltage: "0" }, 2).ok).toBe(false);
    expect(calculatePowerStripCapacity({ ...base, voltage: "-220" }, 2).ok).toBe(false);
    expect(calculatePowerStripCapacity({ ...base, current: "" }, 2).ok).toBe(false);
    expect(calculatePowerStripCapacity({ ...base, current: "0" }, 2).ok).toBe(false);
    expect(calculatePowerStripCapacity({ ...base, current: "-16" }, 2).ok).toBe(false);
    expect(calculatePowerStripCapacity({ ...base, voltage: "1e20" }, 2).ok).toBe(false);
    expect(calculatePowerStripCapacity({ ...base, loads: loads([{ name: "포트", watts: "" }]) }, 2).ok).toBe(false);
    expect(calculatePowerStripCapacity({ ...base, loads: loads([{ name: "", watts: "-5" }]) }, 2).ok).toBe(false);
    expect(calculatePowerStripCapacity({ ...base, loads: loads([{ name: "", watts: "abc" }]) }, 2).ok).toBe(false);
    const huge = calculatePowerStripCapacity({ ...base, loads: loads([{ name: "", watts: "1e20" }]) }, 2);
    expect(huge.ok).toBe(false);
    const text = JSON.stringify(huge);
    expect(text).not.toContain("Infinity");
    expect(text).not.toContain("NaN");
  });

  it("안내 표는 같은 계산 함수의 220V 결과다", () => {
    const rows = getCalculatorGuide("power-strip-capacity")?.lookup?.rows ?? [];
    for (const amps of [10, 12, 15, 16]) {
      expect(rows).toContainEqual([`${amps} A`, powerStripLookupWatts(amps)]);
    }
    expect(rows.find((row) => row[0] === "16 A")?.[1]).toBe("3,520 W");
  });

  it("화면 FAQ와 JSON-LD가 같고 사이트맵에 들어간다", () => {
    const tool = getToolBySlug("power-strip-capacity");
    expect(tool?.href).toBe("/tools/electrical/power-strip-capacity");
    expect(tool?.categoryId).toBe("cat-electrical-basics");
    expect(tool?.metaTitle).toBe("멀티탭 16A는 몇 W? 220V 최대용량 계산");
    const questions = tool?.faqs.map((faq) => faq.question) ?? [];
    expect(questions).toEqual([
      "멀티탭 16A는 몇 W인가요?",
      "220V 16A는 몇 W인가요?",
      "멀티탭에 3,520W까지 연결해도 되나요?",
      "전기포트와 전자레인지를 같은 멀티탭에 연결해도 되나요?",
      "멀티탭을 여러 개 이어서 사용해도 되나요?",
      "멀티탭 정격은 어디에서 확인하나요?",
      "소비전력은 어디에서 확인하나요?",
    ]);
    const jsonLd = faqJsonLd(tool?.faqs ?? []);
    expect(jsonLd?.mainEntity.map((item) => item.name)).toEqual(questions);
    expect(sitemapEntries()).toContain("/tools/electrical/power-strip-capacity");
  });
});
