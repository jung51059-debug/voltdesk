import { describe, expect, it } from "vitest";
import {
  calculateBreakerReference,
  calculateCableResistance,
  calculateGeneratorLoad,
  calculateKwKvaHp,
  calculateMonthlyEnergy,
  calculatePowerFactor,
  calculateSinglePhaseCurrent,
  calculateThreePhaseCurrent,
  calculateTransformerLoad,
  calculateUpsBackup,
  calculateUpsCapacity,
  calculateVoltageDrop,
} from "@/lib/calculations/engines";
import { SQRT_3, WATTS_PER_HP } from "@/lib/math/units";
import { searchCatalog } from "@/lib/search";

function primaryNumber(outcome: ReturnType<typeof calculateSinglePhaseCurrent>): number {
  if (!outcome.ok) throw new Error(outcome.formError ?? "fail");
  const primary = outcome.metrics.find((m) => m.primary);
  return Number(String(primary?.value).replace(/,/g, ""));
}

describe("단상 부하전류", () => {
  it("3 kW / 220 V / PF1 은 약 13.64 A", () => {
    const out = calculateSinglePhaseCurrent(
      { power: "3", powerUnit: "kW", voltage: "220", voltageUnit: "V", pf: "1", efficiency: "1" },
      2,
    );
    expect(out.ok).toBe(true);
    expect(primaryNumber(out)).toBeCloseTo(3000 / 220, 2);
  });

  it("빈 입력은 필드 오류", () => {
    const out = calculateSinglePhaseCurrent({ power: "", voltage: "220" }, 2);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.fieldErrors.power).toBeTruthy();
  });

  it("역률 0은 거부", () => {
    const out = calculateSinglePhaseCurrent(
      { power: "3", powerUnit: "kW", voltage: "220", voltageUnit: "V", pf: "0", efficiency: "1" },
      2,
    );
    expect(out.ok).toBe(false);
  });
});

describe("3상 부하전류", () => {
  it("공식 예제와 일치", () => {
    const P = 45000;
    const V = 380;
    const pf = 0.85;
    const eta = 0.92;
    const expected = P / (SQRT_3 * V * pf * eta);
    const out = calculateThreePhaseCurrent(
      { power: "45", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.85", efficiency: "0.92" },
      2,
    );
    expect(primaryNumber(out)).toBeCloseTo(expected, 2);
  });
});

describe("kW/kVA/HP", () => {
  it("30 kW PF 0.8 = 37.5 kVA", () => {
    const out = calculateKwKvaHp({ mode: "from-kw", power: "30", powerUnit: "kW", pf: "0.8" }, 2);
    expect(out.ok).toBe(true);
    if (out.ok) {
      const kva = out.metrics.find((m) => m.id === "kva");
      expect(Number(kva?.value)).toBeCloseTo(37.5, 2);
      const hp = out.metrics.find((m) => m.id === "hp");
      expect(Number(hp?.value)).toBeCloseTo(30000 / WATTS_PER_HP, 2);
    }
  });
});

describe("역률", () => {
  it("80 kW / 100 kVA = 0.8, Q=60", () => {
    const out = calculatePowerFactor({ mode: "from-power", kw: "80", kva: "100" }, 2);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(Number(out.metrics.find((m) => m.id === "pf")?.value)).toBeCloseTo(0.8, 3);
      expect(Number(out.metrics.find((m) => m.id === "q")?.value)).toBeCloseTo(60, 2);
    }
  });

  it("P > S 거부", () => {
    const out = calculatePowerFactor({ mode: "from-power", kw: "120", kva: "100" }, 2);
    expect(out.ok).toBe(false);
  });
});

describe("변압기 부하율", () => {
  it("800/1000 = 80%", () => {
    const out = calculateTransformerLoad({ ratedKva: "1000", loadMode: "kw", loadKw: "720", pf: "0.9" }, 2);
    expect(primaryNumber(out)).toBeCloseTo(80, 2);
  });

  it("과부하는 error 경고", () => {
    const out = calculateTransformerLoad({ ratedKva: "100", loadMode: "kva", loadKva: "120" }, 2);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.warnings.some((w) => w.level === "error")).toBe(true);
  });
});

describe("전압강하", () => {
  it("3상 저항 근사 예제", () => {
    const expected = (SQRT_3 * 80 * 80 * 0.727) / 1000;
    const out = calculateVoltageDrop(
      {
        phase: "3",
        current: "80",
        length: "80",
        lengthUnit: "m",
        voltage: "380",
        voltageUnit: "V",
        rMode: "ohm",
        resistance: "0.727",
        resistanceUnit: "ohm/km",
      },
      2,
    );
    expect(primaryNumber(out)).toBeCloseTo(expected, 2);
  });
});

describe("도체 저항", () => {
  it("구리 10 mm² 1 km ≈ 1.75 Ω", () => {
    const out = calculateCableResistance({ material: "cu", area: "10", length: "1", lengthUnit: "km" }, 4);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(Number(out.metrics.find((m) => m.id === "R")?.value)).toBeCloseTo(1.75, 2);
    }
  });
});

describe("차단기 참고", () => {
  it("여유율 적용", () => {
    const out = calculateBreakerReference({ current: "80", margin: "1.25" }, 2);
    expect(primaryNumber(out)).toBeCloseTo(100, 2);
  });
});

describe("UPS 백업시간", () => {
  it("에너지 수지 예제", () => {
    const minutes = ((384 * 100 * 0.92 * 0.8) / 20000) * 60;
    const out = calculateUpsBackup(
      {
        mode: "battery",
        batteryV: "384",
        ah: "100",
        load: "20",
        loadUnit: "kW",
        efficiency: "0.92",
        dod: "0.8",
      },
      1,
    );
    expect(primaryNumber(out)).toBeCloseTo(minutes, 1);
  });
});

describe("UPS 용량", () => {
  it("여유와 역률을 반영", () => {
    const out = calculateUpsCapacity({ loadKw: "40", pf: "0.8", growth: "0.25", outputPf: "0.9" }, 2);
    expect(out.ok).toBe(true);
    const designKw = 40 * 1.25;
    const expected = Math.max(designKw / 0.8, designKw / 0.9);
    expect(primaryNumber(out)).toBeCloseTo(expected, 2);
  });
});

describe("발전기 부하율", () => {
  it("320/500 = 64%", () => {
    const out = calculateGeneratorLoad({
      ratingType: "prime",
      ratedMode: "kw",
      ratedKw: "500",
      pf: "0.8",
      loadKw: "320",
    }, 2);
    expect(primaryNumber(out)).toBeCloseTo(64, 2);
  });
});

describe("월간 사용량", () => {
  it("일수 보정 비교", () => {
    const out = calculateMonthlyEnergy(
      {
        energy1: "12000",
        days1: "31",
        energy2: "15000",
        days2: "28",
        price: "140",
        demand1: "0",
        demand2: "0",
        normalize: "yes",
      },
      1,
    );
    expect(out.ok).toBe(true);
    const n1 = (12000 / 31) * 30;
    const n2 = (15000 / 28) * 30;
    if (out.ok) {
      expect(Number(String(out.metrics.find((m) => m.id === "delta")?.value).replace(/,/g, ""))).toBeCloseTo(n2 - n1, 0);
    }
  });
});

describe("검색", () => {
  it("한글·영문·약어를 찾는다", () => {
    expect(searchCatalog("전압강하").some((h) => h.href.includes("voltage-drop"))).toBe(true);
    expect(searchCatalog("voltage drop").some((h) => h.href.includes("voltage-drop"))).toBe(true);
    expect(searchCatalog("UPS").length).toBeGreaterThan(0);
    expect(searchCatalog("변압기").length).toBeGreaterThan(0);
    expect(searchCatalog("kVA").length).toBeGreaterThan(0);
    expect(searchCatalog("역률").length).toBeGreaterThan(0);
  });
});
