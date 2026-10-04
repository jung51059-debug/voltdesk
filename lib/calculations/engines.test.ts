import { describe, expect, it } from "vitest";
import {
  calculateBreakerReference,
  calculateCableResistance,
  calculateContractPowerCurrent,
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
  contractPowerVoltageSuggestion,
} from "@/lib/calculations/engines";
import { SQRT_3, WATTS_PER_HP } from "@/lib/math/units";
import { searchCatalog } from "@/lib/search";
import { calculateMotorCurrent } from "@/lib/calculations/motor";
import { calculatePowerFactorCorrection } from "@/lib/calculations/power-quality";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";

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

describe("계약전력 예상 부하전류", () => {
  function amps(input: Record<string, string>) {
    return primaryNumber(calculateContractPowerCurrent(input, 2));
  }

  it("5 kW 단상 220 V PF 1은 22.73 A이고 단상 계산기와 같다", () => {
    const input = { power: "5", powerUnit: "kW", voltage: "220", voltageUnit: "V", pf: "1", efficiency: "1", phase: "1" };
    expect(amps(input)).toBeCloseTo(5000 / 220, 2);
    expect(amps(input)).toBeCloseTo(22.73, 2);
    expect(amps(input)).toBe(primaryNumber(calculateSinglePhaseCurrent(input, 2)));
    const out = calculateContractPowerCurrent(input, 2);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.warnings.some((item) => item.message.includes("역률과 효율을 1.0으로 가정한 단순 환산값"))).toBe(true);
    expect(out.metrics.find((item) => item.primary)?.hint).toContain("역률과 효율을 1.0으로 가정");
  });

  it("10 kW 단상 220 V PF 1은 45.45 A", () => {
    expect(amps({ power: "10", powerUnit: "kW", voltage: "220", voltageUnit: "V", pf: "1", efficiency: "1", phase: "1" })).toBeCloseTo(45.45, 2);
  });

  it("5·10·20 kW 3상 380 V PF 0.9 효율 1은 3상 계산기와 같다", () => {
    for (const power of ["5", "10", "20"]) {
      const input = { power, powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.9", efficiency: "1", phase: "3" };
      const current = amps(input);
      expect(current).toBe(primaryNumber(calculateThreePhaseCurrent(input, 2)));
      expect(Number.isFinite(current)).toBe(true);
    }
    expect(amps({ power: "5", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.9", efficiency: "1", phase: "3" })).toBeCloseTo(8.44, 2);
    expect(amps({ power: "10", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.9", efficiency: "1", phase: "3" })).toBeCloseTo(16.88, 2);
    expect(amps({ power: "20", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.9", efficiency: "1", phase: "3" })).toBeCloseTo(33.76, 2);
    const adjusted = calculateContractPowerCurrent(
      { power: "10", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.9", efficiency: "1", phase: "3" },
      2,
    );
    expect(adjusted.ok).toBe(true);
    if (!adjusted.ok) return;
    expect(adjusted.warnings.some((item) => item.message.includes("1.0으로 가정"))).toBe(false);
  });

  it("0·음수·빈 값·역률 범위·전압 0은 숫자가 되지 않는다", () => {
    const base = { powerUnit: "kW", voltage: "220", voltageUnit: "V", pf: "1", efficiency: "1", phase: "1" };
    for (const power of ["0", "-5", ""]) {
      const out = calculateContractPowerCurrent({ ...base, power }, 2);
      expect(out.ok).toBe(false);
    }
    expect(calculateContractPowerCurrent({ ...base, power: "5", pf: "0" }, 2).ok).toBe(false);
    expect(calculateContractPowerCurrent({ ...base, power: "5", pf: "1.2" }, 2).ok).toBe(false);
    expect(calculateContractPowerCurrent({ ...base, power: "5", voltage: "0" }, 2).ok).toBe(false);
    const huge = calculateContractPowerCurrent({ ...base, power: "1000000" }, 2);
    expect(huge.ok).toBe(true);
    if (huge.ok) {
      const value = primaryNumber(huge);
      expect(Number.isFinite(value)).toBe(true);
      expect(value).not.toBe(Infinity);
    }
  });

  it("안내 표의 암페어는 계산 결과와 같다", () => {
    const guide = getCalculatorGuide("contract-power-current");
    const rows = guide?.lookup?.rows ?? [];
    const cases = [
      { row: "3 kW", phase: "1", voltage: "220", pf: "1" },
      { row: "5 kW", phase: "1", voltage: "220", pf: "1" },
      { row: "10 kW", phase: "1", voltage: "220", pf: "1" },
      { row: "5 kW", phase: "3", voltage: "380", pf: "0.9" },
      { row: "10 kW", phase: "3", voltage: "380", pf: "0.9" },
      { row: "20 kW", phase: "3", voltage: "380", pf: "0.9" },
    ];
    for (const item of cases) {
      const shown = rows.find((row) => row[1] === item.row && row[0].includes(item.phase === "1" ? "단상" : "3상"));
      const out = calculateContractPowerCurrent(
        { power: item.row.replace(" kW", ""), powerUnit: "kW", phase: item.phase, voltage: item.voltage, voltageUnit: "V", pf: item.pf, efficiency: "1" },
        2,
      );
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      const primary = out.metrics.find((metric) => metric.primary);
      expect(shown?.[2]).toBe(`${primary?.value} A`);
      expect(primary?.label).toBe("예상 부하전류");
    }
  });

  it("기본 전압만 단상 220 V와 3상 380 V로 바꾼다", () => {
    expect(contractPowerVoltageSuggestion("3", "220", "V")).toBe("380");
    expect(contractPowerVoltageSuggestion("1", "380", "V")).toBe("220");
    expect(contractPowerVoltageSuggestion("3", "400", "V")).toBeUndefined();
    expect(contractPowerVoltageSuggestion("1", "230", "V")).toBeUndefined();
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

  it("380V 30kW 역률 0.9 효율 1은 50.64A", () => {
    const out = calculateThreePhaseCurrent(
      { power: "30", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.9", efficiency: "1" },
      2,
    );
    expect(primaryNumber(out)).toBeCloseTo(50.64, 2);
  });

  it("효율 0.92면 같은 30kW는 55.05A", () => {
    const out = calculateThreePhaseCurrent(
      { power: "30", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.9", efficiency: "0.92" },
      2,
    );
    expect(primaryNumber(out)).toBeCloseTo(55.05, 2);
  });

  it("380V 역률 0.9 효율 1 표가 계산기와 같다", () => {
    const rows = getCalculatorGuide("three-phase-current")?.lookup?.rows ?? [];
    expect(rows.map((row) => row[0])).toEqual(["10 kW", "20 kW", "30 kW", "50 kW", "100 kW"]);
    for (const [power, amps] of rows) {
      const out = calculateThreePhaseCurrent(
        { power: power.replace(" kW", ""), powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.9", efficiency: "1" },
        2,
      );
      expect(`${primaryNumber(out).toFixed(2)} A`).toBe(amps);
    }
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

  it("100kW 역률 0.8은 125kVA, 반대는 100kW", () => {
    const forward = calculateKwKvaHp({ mode: "from-kw", power: "100", powerUnit: "kW", pf: "0.8" }, 2);
    expect(forward.ok).toBe(true);
    if (forward.ok) {
      expect(Number(forward.metrics.find((m) => m.id === "kva")?.value)).toBeCloseTo(125, 2);
    }
    const back = calculateKwKvaHp({ mode: "from-kva", kva: "125", pf: "0.8" }, 2);
    expect(back.ok).toBe(true);
    if (back.ok) {
      expect(Number(back.metrics.find((m) => m.id === "kw")?.value)).toBeCloseTo(100, 2);
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

  it("500kVA에 300kW 역률 0.8은 75%", () => {
    const out = calculateTransformerLoad({ ratedKva: "500", loadMode: "kw", loadKw: "300", pf: "0.8" }, 2);
    expect(primaryNumber(out)).toBeCloseTo(75, 2);
    if (out.ok) {
      expect(Number(out.metrics.find((m) => m.id === "load")?.value)).toBeCloseTo(375, 2);
    }
  });

  it("정격 초과를 자동 과부하 판정하지 않는다", () => {
    const out = calculateTransformerLoad({ ratedKva: "100", loadMode: "kva", loadKva: "120" }, 2);
    expect(out.ok).toBe(true);
    expect(primaryNumber(out)).toBeCloseTo(120, 2);
    if (out.ok) expect(out.warnings.some((w) => w.level === "error" || w.title.includes("높은 부하율"))).toBe(false);
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
    if (out.ok) {
      expect(Number(out.metrics.find((m) => m.id === "dv")?.value)).toBeCloseTo(8.06, 2);
      expect(Number(out.metrics.find((m) => m.id === "pct")?.value)).toBeCloseTo(2.12, 2);
      expect(Number(out.metrics.find((m) => m.id === "vend")?.value)).toBeCloseTo(371.94, 2);
    }
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
    expect(searchCatalog("전선").some((h) => h.href.includes("cable"))).toBe(true);
    expect(searchCatalog("cable").some((h) => h.href.includes("cable"))).toBe(true);
    expect(searchCatalog("CT").some((h) => h.href.includes("ct-ratio"))).toBe(true);
    expect(searchCatalog("콘덴서").some((h) => h.href.includes("power-factor"))).toBe(true);
    expect(searchCatalog("조명").some((h) => h.href.includes("lux"))).toBe(true);
    expect(searchCatalog("태양광").some((h) => h.href.includes("solar"))).toBe(true);
    expect(searchCatalog("모터").some((h) => h.href.includes("motor"))).toBe(true);
  });
});
