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
import { calculateShortCircuit } from "@/lib/calculations/short-circuit";
import { calculateCableAmpacityReview } from "@/lib/calculations/cable-tools";
import { calculateTransformerCurrents, calculateTransformerParallel } from "@/lib/calculations/transformer-tools";
import { calculateBatteryAh } from "@/lib/calculations/facility-extra";
import { calculatePhaseUnbalance } from "@/lib/calculations/field-verify";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { getArticleById, getArticleBySlug } from "@/lib/data/articles";
import { calculateCtRatio } from "@/lib/calculations/protection";
import { getFormulaById } from "@/lib/data/formulas";
import { getToolBySlug } from "@/lib/data/tools";
import { sitemapEntries } from "@/lib/seo";
import type { CalculationResult } from "@/lib/types";

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
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.interpretation).toContain("64%");
    expect(out.interpretation).toContain("제조사 운전 조건");
    expect(out.interpretation).not.toContain("60~80");
    expect(out.interpretation).not.toContain("연속 운전 구간");
    const example = getFormulaById("formula-generator-load")?.example.result ?? "";
    expect(example).toContain("64%");
    expect(example).not.toContain("연속 운전 구간");
    expect(example).not.toContain("60~80");
    const card = getFormulaById("formula-generator-load");
    expect(card?.warnings.join(" ")).toContain("참고 조건");
    expect(card?.warnings.join(" ")).toContain("공통 운전 한계가 아닙니다");
    expect(card?.warnings.join(" ")).not.toContain("대략 30% 미만");
  });

  it("안내 표의 부하율은 계산 결과와 같다", () => {
    const rows = getCalculatorGuide("generator-load")?.lookup?.rows ?? [];
    const cases = [
      { ratedKw: "250", loadKw: "190", ratingType: "prime", label: "프라임 250 kW" },
      { ratedKw: "400", loadKw: "90", ratingType: "standby", label: "스탠바이 400 kW" },
      { ratedKw: "200", loadKw: "40", ratingType: "prime", label: "프라임 200 kW" },
      { ratedKw: "200", loadKw: "230", ratingType: "prime", label: "프라임 200 kW" },
    ];
    for (const item of cases) {
      const out = calculateGeneratorLoad(
        { ratingType: item.ratingType, ratedMode: "kw", ratedKw: item.ratedKw, pf: "0.8", loadKw: item.loadKw },
        2,
      );
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      const primary = out.metrics.find((metric) => metric.primary);
      const shown = rows.find((row) => row[0] === item.label && row[1] === `${item.loadKw} kW`);
      expect(shown?.[2]).toBe(`${primary?.value}%`);
    }
    const fromKva = calculateGeneratorLoad(
      { ratingType: "prime", ratedMode: "kva", ratedKva: "625", pf: "0.8", loadKw: "320" },
      2,
    );
    expect(primaryNumber(fromKva)).toBeCloseTo(64, 2);
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

function shownMetric(outcome: CalculationResult, id: string): string {
  const found = outcome.metrics.find((item) => item.id === id);
  if (!found) throw new Error(id);
  const value = String(found.value);
  const unit = found.unit ?? "";
  if (unit === "" || unit === "—") return value;
  if (unit === "%") return `${value}%`;
  return `${value} ${unit}`;
}

describe("2차 콘텐츠 안내 예제", () => {
  it("단락 안내 표는 변압기만·케이블 포함 결과와 같다", () => {
    const rows = getCalculatorGuide("short-circuit")?.lookup?.rows ?? [];
    const common = {
      voltage: "380",
      voltageUnit: "V",
      cFactor: "1.05",
      includeTr: "yes",
      trXr: "8",
      includeSource: "no",
      includeGen: "no",
      includeMotor: "no",
    };
    const cases = [
      { trKva: "500", trZpct: "4.5", includeCable: "no", label: "500 kVA · %Z 4.5 · 케이블 제외" },
      {
        trKva: "500",
        trZpct: "4.5",
        includeCable: "yes",
        cableM: "40",
        cableR: "0.193",
        cableX: "0.075",
        label: "같은 변압기 · 케이블 40 m",
      },
      { trKva: "200", trZpct: "4", includeCable: "no", label: "200 kVA · %Z 4 · 케이블 제외" },
    ];
    for (const item of cases) {
      const input: Record<string, string> = { ...common, trKva: item.trKva, trZpct: item.trZpct, includeCable: item.includeCable };
      if (item.cableM && item.cableR && item.cableX) {
        input.cableM = item.cableM;
        input.cableR = item.cableR;
        input.cableX = item.cableX;
      }
      const out = calculateShortCircuit(input, 2);
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      const row = rows.find((entry) => entry[0] === item.label);
      expect(row?.[1]).toBe(shownMetric(out, "ik"));
      expect(row?.[2]).toBe(shownMetric(out, "ip"));
    }
  });

  it("허용전류 안내 표는 입력 Iz와 계수의 곱과 같다", () => {
    const rows = getCalculatorGuide("cable-ampacity")?.lookup?.rows ?? [];
    const cases = [
      { designCurrent: "120", iz: "145", kTemp: "0.91", kGroup: "0.7", kOther: "1", label: "Ib 120 A · Iz 145 A · 0.91×0.7×1" },
      { designCurrent: "64", iz: "98", kTemp: "1", kGroup: "0.85", kOther: "0.96", label: "Ib 64 A · Iz 98 A · 1×0.85×0.96" },
    ];
    for (const item of cases) {
      const out = calculateCableAmpacityReview(item, 2);
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      const row = rows.find((entry) => entry[0] === item.label);
      expect(row?.[1]).toBe(shownMetric(out, "izp"));
      expect(row?.[2]).toBe(shownMetric(out, "ratio"));
    }
  });

  it("도체 저항 안내 표는 20°C 근사와 같다", () => {
    const rows = getCalculatorGuide("cable-resistance")?.lookup?.rows ?? [];
    const cases = [
      { material: "al", area: "70", length: "45", lengthUnit: "m", label: "알루미늄 70 mm² · 45 m" },
      { material: "cu", area: "6", length: "25", lengthUnit: "m", label: "구리 6 mm² · 25 m" },
    ];
    for (const item of cases) {
      const out = calculateCableResistance(item, 2);
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      const row = rows.find((entry) => entry[0] === item.label);
      expect(row?.[1]).toBe(shownMetric(out, "R"));
      expect(row?.[2]).toBe(shownMetric(out, "rkm"));
    }
  });

  it("월간 사용량 안내 표는 원시 차이와 30일 환산과 같다", () => {
    const rows = getCalculatorGuide("monthly-energy")?.lookup?.rows ?? [];
    const raw = calculateMonthlyEnergy(
      { energy1: "8600", days1: "30", energy2: "7900", days2: "30", normalize: "no", price: "0", demand1: "0", demand2: "0" },
      2,
    );
    const scaled = calculateMonthlyEnergy(
      { energy1: "22000", days1: "31", energy2: "24100", days2: "28", normalize: "yes", price: "150", demand1: "0", demand2: "0" },
      2,
    );
    expect(raw.ok && scaled.ok).toBe(true);
    if (!raw.ok || !scaled.ok) return;
    expect(rows[0]?.[1]).toBe(shownMetric(raw, "delta"));
    expect(rows[0]?.[2]).toBe(shownMetric(raw, "pct"));
    expect(rows[1]?.[1]).toBe(shownMetric(scaled, "delta"));
    expect(rows[1]?.[2]).toBe(shownMetric(scaled, "pct"));
    expect(shownMetric(scaled, "cost")).toBe("679,666 원");
    expect(getCalculatorGuide("monthly-energy")?.walkthrough?.lines.join(" ")).toContain("679,666원");
  });

  it("변압기 전류 안내 표는 3상 전부하 전류와 같다", () => {
    const rows = getCalculatorGuide("transformer-current")?.lookup?.rows ?? [];
    const cases = [
      { ratedKva: "750", vPrimary: "6600", vSecondary: "380", label: "750 kVA · 6,600 / 380 V" },
      { ratedKva: "300", vPrimary: "22900", vSecondary: "380", label: "300 kVA · 22,900 / 380 V" },
    ];
    for (const item of cases) {
      const out = calculateTransformerCurrents(item, 2);
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      const row = rows.find((entry) => entry[0] === item.label);
      expect(row?.[1]).toBe(shownMetric(out, "i2"));
      expect(row?.[2]).toBe(shownMetric(out, "i1"));
    }
  });

  it("역률 보상 안내 표는 kvar와 전류 감소와 같다", () => {
    const rows = getCalculatorGuide("power-factor-correction")?.lookup?.rows ?? [];
    const cases = [
      { powerKw: "45", pfNow: "0.72", pfTarget: "0.9", phase: "1", voltage: "220", voltageUnit: "V", label: "45 kW · 0.72→0.90 · 단상 220 V" },
      { powerKw: "80", pfNow: "0.85", pfTarget: "0.98", phase: "3", voltage: "380", voltageUnit: "V", label: "80 kW · 0.85→0.98 · 3상 380 V" },
    ];
    for (const item of cases) {
      const out = calculatePowerFactorCorrection(item, 2);
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      const row = rows.find((entry) => entry[0] === item.label);
      expect(row?.[1]).toBe(shownMetric(out, "qc"));
      expect(row?.[2]).toBe(shownMetric(out, "di"));
    }
  });

  it("상 불평형 안내 표는 평균편차와 같다", () => {
    const rows = getCalculatorGuide("phase-unbalance")?.lookup?.rows ?? [];
    const loaded = calculatePhaseUnbalance(
      { unbalanceMethod: "avg-dev", vr: "376", vs: "389", vt: "371", ir: "210", is: "160", it: "95" },
      2,
    );
    const balanced = calculatePhaseUnbalance({ unbalanceMethod: "avg-dev", vr: "400", vs: "400", vt: "400" }, 2);
    expect(loaded.ok && balanced.ok).toBe(true);
    if (!loaded.ok || !balanced.ok) return;
    expect(rows[0]?.[1]).toBe(shownMetric(loaded, "vunb"));
    expect(rows[0]?.[2]).toBe(shownMetric(loaded, "iunb"));
    expect(rows[1]?.[1]).toBe(shownMetric(balanced, "vunb"));
    expect(balanced.metrics.find((item) => item.id === "iunb")).toBeUndefined();
  });

  it("배터리 안내 표는 에너지 수지 Ah와 같다", () => {
    const rows = getCalculatorGuide("battery-capacity")?.lookup?.rows ?? [];
    const control = calculateBatteryAh(
      { loadW: "1200", dcV: "48", hours: "2", etaInv: "0.9", etaBatt: "0.85", aging: "0.8", dod: "0.5", cellV: "12", moduleAh: "100" },
      2,
    );
    const plain = calculateBatteryAh(
      { loadW: "800", dcV: "24", hours: "4", etaInv: "1", etaBatt: "1", aging: "1", dod: "1" },
      2,
    );
    expect(control.ok && plain.ok).toBe(true);
    if (!control.ok || !plain.ok) return;
    expect(rows[0]?.[1]).toBe(shownMetric(control, "ah"));
    expect(rows[0]?.[2]).toBe(shownMetric(control, "e"));
    expect(shownMetric(control, "series")).toBe("4 셀");
    expect(shownMetric(control, "parallel")).toBe("2 회");
    expect(rows[1]?.[1]).toBe(shownMetric(plain, "ah"));
    expect(rows[1]?.[2]).toBe(shownMetric(plain, "e"));
  });

  it("안내 문장과 링크는 해당 계산기에만 있고 실제 경로다", () => {
    const markers = [
      ["short-circuit", "17,726 A"],
      ["cable-ampacity", "92.37 A"],
      ["cable-resistance", "0.4029 Ω/km"],
      ["monthly-energy", "4,531.11 kWh"],
      ["transformer-current", "1,139.51 A"],
      ["power-factor-correction", "21.58 kvar"],
      ["phase-unbalance", "38.71%"],
      ["battery-capacity", "163.4 Ah"],
    ] as const;
    const paths = new Set(sitemapEntries());
    const others = ["generator-load", "thd", "three-phase-current", "single-phase-current"];
    for (const [slug, marker] of markers) {
      const guide = getCalculatorGuide(slug);
      expect(JSON.stringify(guide)).toContain(marker);
      for (const other of [...markers.map((item) => item[0]).filter((item) => item !== slug), ...others]) {
        expect(JSON.stringify(getCalculatorGuide(other) ?? {})).not.toContain(marker);
      }
      expect(guide?.links?.length).toBeGreaterThanOrEqual(3);
      for (const link of guide?.links ?? []) {
        expect(paths.has(link.href)).toBe(true);
      }
      const tool = getToolBySlug(slug);
      expect(tool?.faqs.length).toBeGreaterThanOrEqual(2);
      expect(tool?.faqs.length).toBeLessThanOrEqual(3);
    }
  });
});

function articleText(slug: string): string {
  const article = getArticleBySlug(slug);
  if (!article) throw new Error(slug);
  return JSON.stringify(article);
}

describe("참고자료 3차 예제", () => {
  it("케이블 기초의 Ib와 Iz'는 계산기와 같고 굵기 순서 글을 반복하지 않는다", () => {
    const current = calculateThreePhaseCurrent(
      { power: "12", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.95", efficiency: "1" },
      2,
    );
    const ampacity = calculateCableAmpacityReview(
      { designCurrent: "19.19", iz: "25", kTemp: "1", kGroup: "0.8", kOther: "1" },
      2,
    );
    expect(current.ok && ampacity.ok).toBe(true);
    if (!current.ok || !ampacity.ok) return;
    const text = articleText("cable-sizing-basics");
    expect(text).toContain(shownMetric(current, "current"));
    expect(text).toContain(shownMetric(ampacity, "izp"));
    expect(text).toContain(shownMetric(ampacity, "ratio"));
    const basics = getArticleBySlug("cable-sizing-basics");
    expect(basics?.relatedToolIds).toContain("tool-cable-sizing");
    expect(getToolBySlug("cable-sizing")?.href).toBe("/tools/electrical/cable-sizing");
    expect(text).not.toContain("보정된 허용전류가 설계 전류보다");
    expect(text).not.toContain("80.44");
    expect(articleText("cable-sizing")).toContain("80.44");
  });

  it("CT 글의 200/5A와 400/5A는 계산기와 같고 80A→4A 예제를 반복하지 않는다", () => {
    const ct200 = calculateCtRatio({ loadCurrent: "150", primary: "200", secondary: "5" }, 2);
    const ct400 = calculateCtRatio({ loadCurrent: "150", primary: "400", secondary: "5" }, 2);
    expect(ct200.ok && ct400.ok).toBe(true);
    if (!ct200.ok || !ct400.ok) return;
    const text = articleText("ct-ratio");
    expect(text).toContain(shownMetric(ct200, "i2"));
    expect(text).toContain(shownMetric(ct400, "i2"));
    expect(getArticleBySlug("ct-ratio")?.relatedArticleIds).toContain("art-ct-100-5");
    expect(getArticleById("art-ct-100-5")?.href).toBe("/references/ct-100-5a");
    expect(text).not.toContain("80 / 20");
    expect(text).not.toContain("이상 2차 전류는 4 A");
    expect(articleText("ct-100-5a")).toContain("4 A");
  });

  it("UPS 용량 글의 kVA와 84.79분은 서로 다른 계산기와 같다", () => {
    const capacity = calculateUpsCapacity(
      { mode: "basic", loadKw: "40", pf: "0.9", growth: "0.2", outputPf: "0.9" },
      2,
    );
    const backup = calculateUpsBackup(
      {
        mode: "battery",
        batteryV: "384",
        ah: "100",
        load: "20",
        loadUnit: "kW",
        efficiency: "0.92",
        dod: "0.8",
        aging: "1",
      },
      2,
    );
    expect(capacity.ok && backup.ok).toBe(true);
    if (!capacity.ok || !backup.ok) return;
    const text = articleText("ups-sizing");
    expect(text).toContain(shownMetric(capacity, "kva"));
    expect(text).toContain(`${backup.metrics.find((item) => item.id === "min")?.value}분`);
    expect(text).toContain(shownMetric(backup, "usable"));
    expect(text).toContain("38.4 kWh");
    const ups = getArticleBySlug("ups-sizing");
    expect(ups?.relatedToolIds).toEqual(expect.arrayContaining(["tool-ups-capacity", "tool-ups-backup-time"]));
    expect(getToolBySlug("ups-capacity")?.href).toBe("/tools/facility/ups-capacity");
    expect(getToolBySlug("ups-backup-time")?.href).toBe("/tools/facility/ups-backup-time");
  });

  it("낮은 역률 글은 100kVA·60kW와 전류가 맞고 설치 위치 절차를 다른 글에 둔다", () => {
    const pf = calculatePowerFactor({ mode: "from-power", kw: "60", kva: "100" }, 2);
    const atLoad = calculateThreePhaseCurrent(
      { power: "60", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.6", efficiency: "1" },
      2,
    );
    const atUnity = calculateThreePhaseCurrent(
      { power: "60", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "1", efficiency: "1" },
      2,
    );
    expect(pf.ok && atLoad.ok && atUnity.ok).toBe(true);
    if (!pf.ok || !atLoad.ok || !atUnity.ok) return;
    const text = articleText("poor-power-factor");
    expect(text).toContain(shownMetric(pf, "q"));
    expect(text).toContain(shownMetric(atLoad, "current"));
    expect(text).toContain(shownMetric(atUnity, "current"));
    expect(getArticleBySlug("poor-power-factor")?.relatedArticleIds).toContain("art-pfc-location");
    expect(getArticleById("art-pfc-location")?.href).toBe("/references/power-factor-correction-location");
    expect(text).not.toContain("부하 근처 또는 수전반");
  });

  it("전압강하 원리 글은 8.06V 예제를 유지하고 출처 없는 한도 문장을 빼었다", () => {
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
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const text = articleText("voltage-drop-principles");
    expect(text).toContain(`${out.metrics.find((item) => item.id === "dv")?.value} V`);
    expect(text).toContain(`${out.metrics.find((item) => item.id === "pct")?.value}%`);
    expect(text).toContain(`${out.metrics.find((item) => item.id === "vend")?.value} V`);
    expect(text).not.toContain("많은 프로젝트");
    expect(articleText("voltage-drop")).toContain("1.46%");
  });
});

describe("참고 알림 문구", () => {
  it("발전기 30%·70%는 부하율을 바꾸지 않는 참고 알림이다", () => {
    const low = calculateGeneratorLoad(
      { ratingType: "standby", ratedMode: "kw", ratedKw: "400", pf: "0.8", loadKw: "90" },
      2,
    );
    const high = calculateGeneratorLoad(
      { ratingType: "standby", ratedMode: "kw", ratedKw: "400", pf: "0.8", loadKw: "320" },
      2,
    );
    expect(low.ok && high.ok).toBe(true);
    if (!low.ok || !high.ok) return;
    expect(primaryNumber(low)).toBeCloseTo(22.5, 2);
    expect(primaryNumber(high)).toBeCloseTo(80, 2);
    const lowText = low.warnings.map((item) => item.message).join(" ");
    const highText = high.warnings.map((item) => item.message).join(" ");
    expect(lowText).toContain("참고 알림 조건");
    expect(lowText).toContain("판정값이 아닙니다");
    expect(lowText).not.toContain("장시간 30% 미만 운전 시");
    expect(highText).toContain("참고 알림 조건");
    expect(highText).toContain("공통 운전 한계가 아닙니다");
    expect(highText).not.toContain("제한 시간 비상 운전용입니다");
    const guide = JSON.stringify(getCalculatorGuide("generator-load"));
    expect(guide).toContain("참고 알림");
    expect(guide).toContain("공통 운전 한계가 아니고");
    expect(guide).not.toContain("두지 말라는");
  });

  it("역률 0.9·0.7은 참고 안내이고 전류 계산기의 0.7 안내와 맞다", () => {
    const mid = calculatePowerFactor({ mode: "from-power", kw: "80", kva: "100" }, 2);
    const low = calculatePowerFactor({ mode: "from-power", kw: "60", kva: "100" }, 2);
    const high = calculatePowerFactor({ mode: "from-power", kw: "95", kva: "100" }, 2);
    const current = calculateThreePhaseCurrent(
      { power: "60", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.6", efficiency: "1" },
      2,
    );
    expect(mid.ok && low.ok && high.ok && current.ok).toBe(true);
    if (!mid.ok || !low.ok || !high.ok || !current.ok) return;
    expect(primaryNumber(mid)).toBeCloseTo(0.8, 3);
    expect(primaryNumber(low)).toBeCloseTo(0.6, 3);
    const midText = mid.warnings.map((item) => item.message).join(" ");
    const lowText = low.warnings.map((item) => item.message).join(" ");
    expect(midText).toContain("참고 안내 조건");
    expect(midText).toContain("피상전력과 전류");
    expect(midText).not.toContain("수전 계약과 변압기");
    expect(mid.warnings).toHaveLength(1);
    expect(low.warnings).toHaveLength(2);
    expect(lowText).toContain("단상·3상 전류 계산기");
    expect(high.warnings.filter((item) => item.title.includes("역률"))).toHaveLength(0);
    expect(current.warnings.map((item) => item.message).join(" ")).toContain("선전류와 필요 kVA");
    expect(current.warnings.map((item) => item.message).join(" ")).not.toContain("합격선");
  });

  it("변압기 80% 문장과 UPS 예제 표기는 계산기 출력과 같다", () => {
    const transformer = getFormulaById("formula-transformer-load");
    expect(transformer?.warnings.join(" ")).not.toContain("상시 80% 이상");
    expect(transformer?.warnings.join(" ")).toContain("냉각 방식");
    expect(transformer?.example.result).toContain("80%");
    const backup = getFormulaById("formula-ups-backup");
    expect(backup?.example.steps.join(" ")).toContain("84.79분");
    expect(backup?.example.result).toBe("84.79분");
    expect(`${backup?.example.steps.join(" ")}${backup?.example.result}`).not.toContain("약 85분");
    expect(`${backup?.example.steps.join(" ")}${backup?.example.result}`).not.toContain("84.8분");
    const capacity = getFormulaById("formula-ups-capacity");
    expect(capacity?.example.result).toBe("53.33 kVA");
    expect(capacity?.example.steps.join(" ")).toContain("53.33 kVA");
    expect(articleText("ups-on-generator")).toContain("53.33 kVA");
    expect(articleText("ups-on-generator")).not.toContain("53.3kVA");
    const calculated = calculateUpsBackup(
      { mode: "battery", batteryV: "384", ah: "100", load: "20", loadUnit: "kW", efficiency: "0.92", dod: "0.8", aging: "1" },
      2,
    );
    const kva = calculateUpsCapacity({ mode: "basic", loadKw: "40", pf: "0.9", growth: "0.2", outputPf: "0.9" }, 2);
    expect(calculated.ok && kva.ok).toBe(true);
    if (!calculated.ok || !kva.ok) return;
    expect(backup?.example.result).toBe(`${calculated.metrics.find((item) => item.id === "min")?.value}분`);
    expect(capacity?.example.result).toBe(shownMetric(kva, "kva"));
  });

  it("모터 5배·8배는 정격전류의 참고 배수이고 확정 기동전류가 아니다", () => {
    const out = calculateMotorCurrent(
      { phase: "3", power: "30", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.85", efficiency: "0.92" },
      2,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const raw = 30000 / (Math.sqrt(3) * 380 * 0.85 * 0.92);
    const low = out.metrics.find((item) => item.id === "startLow");
    const high = out.metrics.find((item) => item.id === "startHigh");
    expect(Number(String(low?.value).replace(/,/g, ""))).toBeCloseTo(Math.round(raw * 5 * 100) / 100, 2);
    expect(Number(String(high?.value).replace(/,/g, ""))).toBeCloseTo(Math.round(raw * 8 * 100) / 100, 2);
    expect(low?.label).toContain("DOL 참고");
    expect(high?.label).toContain("DOL 참고");
    expect(`${low?.label}${high?.label}`).not.toContain("하한");
    expect(`${low?.label}${high?.label}`).not.toContain("상한");
    expect(out.interpretation).toContain("확정 기동전류가 아닙니다");
    expect(out.interpretation).toContain("명판");
  });
});

describe("남은 참고 알림", () => {
  it("임계값은 유지하고 적합 기준으로 말하지 않는다", () => {
    const parallel = calculateTransformerParallel(
      { s1: "1000", z1: "5", s2: "1000", z2: "6", loadKva: "800" },
      2,
    );
    const close = calculateTransformerParallel(
      { s1: "1000", z1: "5", s2: "1000", z2: "5.2", loadKva: "800" },
      2,
    );
    const bigCurrent = calculateSinglePhaseCurrent(
      { power: "100", powerUnit: "kW", voltage: "220", voltageUnit: "V", pf: "1", efficiency: "1" },
      2,
    );
    const shortBackup = calculateUpsBackup(
      { mode: "battery", batteryV: "384", ah: "100", load: "400", loadUnit: "kW", efficiency: "0.92", dod: "0.8", aging: "1" },
      2,
    );
    const longBackup = calculateUpsBackup(
      { mode: "battery", batteryV: "384", ah: "100", load: "5", loadUnit: "kW", efficiency: "0.92", dod: "0.8", aging: "1" },
      2,
    );
    const swing = calculateMonthlyEnergy(
      { energy1: "100", days1: "30", energy2: "140", days2: "30", price: "0", demand1: "0", demand2: "0", normalize: "no" },
      2,
    );
    const calm = calculateMonthlyEnergy(
      { energy1: "100", days1: "30", energy2: "110", days2: "30", price: "0", demand1: "0", demand2: "0", normalize: "no" },
      2,
    );
    expect(parallel.ok && close.ok && bigCurrent.ok && shortBackup.ok && longBackup.ok && swing.ok && calm.ok).toBe(true);
    if (!parallel.ok || !close.ok || !bigCurrent.ok || !shortBackup.ok || !longBackup.ok || !swing.ok || !calm.ok) return;
    expect(parallel.warnings.some((item) => item.message.includes("참고 알림") && item.message.includes("병렬 적합 기준이 아닙니다"))).toBe(true);
    expect(close.warnings.some((item) => item.title === "%Z 차이")).toBe(false);
    expect(bigCurrent.warnings.some((item) => item.message.includes("400 A") && item.message.includes("허용 한도가 아닙니다"))).toBe(true);
    expect(primaryNumber(bigCurrent)).toBeGreaterThan(400);
    expect(shortBackup.warnings.some((item) => item.message.includes("5분") && item.message.includes("기준이 아닙니다"))).toBe(true);
    expect(Number(String(shortBackup.metrics.find((item) => item.id === "min")?.value))).toBeLessThan(5);
    expect(longBackup.warnings.some((item) => item.message.includes("180분") && item.message.includes("백업 상한이 아닙니다"))).toBe(true);
    expect(Number(String(longBackup.metrics.find((item) => item.id === "min")?.value).replace(/,/g, ""))).toBeGreaterThan(180);
    expect(swing.warnings.some((item) => item.message.includes("30%") && item.message.includes("판정값이 아닙니다"))).toBe(true);
    expect(calm.warnings.some((item) => item.title === "큰 변동")).toBe(false);
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
