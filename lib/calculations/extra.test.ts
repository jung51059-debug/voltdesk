import { describe, expect, it } from "vitest";
import { calculateMotorCurrent } from "@/lib/calculations/motor";
import { calculatePowerFactorCorrection, calculateThd } from "@/lib/calculations/power-quality";
import { calculateVoltageDrop, calculateTransformerLoad, calculateBreakerReference, engines } from "@/lib/calculations/engines";
import { kecVoltageDropCanCompare, kecVoltageDropLimitPct } from "@/lib/calculations/kec-review";
import { calculateEarthConductor, calculateLux } from "@/lib/calculations/site-tools";
import {
  exportLoadScheduleCsv,
  loadRowsFromCsv,
  normalizeLoadRow,
  parseLoadScheduleDocument,
  panelRowsFromLoads,
  radialLoadFlow,
  rowPowers,
  suggestPhasePlacement,
  summarizeByCategory,
  summarizeLoads,
  toCsv,
} from "@/lib/calculations/schedules";
import { calculateCableSizing } from "@/lib/calculations/cable-tools";
import {
  analyzeTrend,
  calculateDutyCycle,
  calculateFieldCompare,
  calculateGeneratorLoadTest,
  calculateOperatingEnergy,
  calculatePhaseUnbalance,
  calculateRetrofitCompare,
  calculateSensorCalibration,
  calculateVUF,
  parseTrendText,
} from "@/lib/calculations/field-verify";
import { NEUTRAL_ZERO_SEQUENCE_PLANNED_INPUTS } from "@/lib/calculations/neutral-zero-sequence";
import { calculateGeneratorSizing } from "@/lib/calculations/facility-extra";
import { buildHandoffHref, parseHandoff } from "@/lib/calculations/handoff";
import { formSchemas } from "@/lib/calculations/schemas";
import { getFormulaById } from "@/lib/data/formulas";
import { createMeasurementRecord } from "@/lib/storage/measurement";
import {
  getPublishedTools,
  getToolById,
  isElectricalWorkspaceTool,
  isFacilityWorkspaceTool,
} from "@/lib/data/tools";
import { searchCatalog } from "@/lib/search";
import {
  STANDARD_KIND_LABEL,
  STANDARD_STATUS_LABEL,
  STANDARD_STATUS_NOTE,
  STANDARD_STATUSES,
  assertNoComplianceWording,
  getStandardBasisBySlug,
  missingStandardBasis,
  toolsByStandardStatus,
} from "@/lib/data/standard-basis";
import { SQRT_3, WATTS_PER_HP } from "@/lib/math/units";

function primaryNumber(outcome: { ok: boolean; metrics?: { primary?: boolean; value: number | string }[] }): number {
  if (!outcome.ok) throw new Error("expected success");
  const primary = outcome.metrics?.find((m) => m.primary);
  return Number(String(primary?.value).replace(/,/g, ""));
}

function metricNumber(outcome: { ok: boolean; metrics?: { id: string; value: number | string }[] }, id: string): number {
  if (!outcome.ok) throw new Error("expected success");
  return Number(String(outcome.metrics?.find((m) => m.id === id)?.value).replace(/,/g, ""));
}

describe("모터 정격전류", () => {
  it("380V 3상 30kW PF0.85 η0.92", () => {
    const expected = 30000 / (SQRT_3 * 380 * 0.85 * 0.92);
    const out = calculateMotorCurrent(
      { phase: "3", power: "30", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.85", efficiency: "0.92" },
      2,
    );
    expect(out.ok).toBe(true);
    expect(primaryNumber(out)).toBeCloseTo(expected, 2);
  });

  it("단상은 3상보다 √3배 크다", () => {
    const three = calculateMotorCurrent(
      { phase: "3", power: "10", powerUnit: "kW", voltage: "380", pf: "0.85", efficiency: "0.9" },
      4,
    );
    const one = calculateMotorCurrent(
      { phase: "1", power: "10", powerUnit: "kW", voltage: "380", pf: "0.85", efficiency: "0.9" },
      4,
    );
    expect(primaryNumber(one)).toBeCloseTo(primaryNumber(three) * SQRT_3, 3);
  });

  it("HP 단위 환산", () => {
    const out = calculateMotorCurrent(
      { phase: "3", power: "1", powerUnit: "HP", voltage: "380", pf: "0.85", efficiency: "0.9" },
      4,
    );
    const expected = WATTS_PER_HP / (SQRT_3 * 380 * 0.85 * 0.9);
    expect(primaryNumber(out)).toBeCloseTo(expected, 3);
  });

  it("역률 0·1 초과·음수·빈 값을 거부", () => {
    expect(calculateMotorCurrent({ phase: "3", power: "10", voltage: "380", pf: "0", efficiency: "0.9" }, 2).ok).toBe(false);
    expect(calculateMotorCurrent({ phase: "3", power: "10", voltage: "380", pf: "1.2", efficiency: "0.9" }, 2).ok).toBe(false);
    expect(calculateMotorCurrent({ phase: "3", power: "-10", voltage: "380", pf: "0.85", efficiency: "0.9" }, 2).ok).toBe(false);
    expect(calculateMotorCurrent({ phase: "3", power: "0", voltage: "380", pf: "0.85", efficiency: "0.9" }, 2).ok).toBe(false);
    expect(calculateMotorCurrent({ phase: "3", power: "", voltage: "380", pf: "0.85", efficiency: "0.9" }, 2).ok).toBe(false);
  });
});

describe("역률 개선", () => {
  it("Qc = P (tanφ1 − tanφ2)", () => {
    const P = 100;
    const pf1 = 0.8;
    const pf2 = 0.95;
    const expected = P * (Math.tan(Math.acos(pf1)) - Math.tan(Math.acos(pf2)));
    const out = calculatePowerFactorCorrection({ powerKw: "100", pfNow: "0.8", pfTarget: "0.95" }, 4);
    expect(out.ok).toBe(true);
    expect(primaryNumber(out)).toBeCloseTo(expected, 3);
  });

  it("목표 역률이 더 낮으면 거부", () => {
    expect(calculatePowerFactorCorrection({ powerKw: "100", pfNow: "0.9", pfTarget: "0.8" }, 2).ok).toBe(false);
  });
});

describe("전압강하 경계", () => {
  it("전류 0은 거부", () => {
    const out = calculateVoltageDrop(
      { phase: "3", current: "0", length: "80", voltage: "380", rMode: "ohm", resistance: "0.727" },
      2,
    );
    expect(out.ok).toBe(false);
  });

  it("음수 길이는 거부", () => {
    const out = calculateVoltageDrop(
      { phase: "3", current: "80", length: "-10", voltage: "380", rMode: "ohm", resistance: "0.727" },
      2,
    );
    expect(out.ok).toBe(false);
  });
});

describe("고조파 THD", () => {
  it("기본파 대비 RSS 비율", () => {
    const out = calculateThd({ kind: "voltage", fundamental: "100", harmonics: "10, 10" }, 4);
    expect(out.ok).toBe(true);
    expect(primaryNumber(out)).toBeCloseTo((Math.hypot(10, 10) / 100) * 100, 3);
  });
});

describe("루멘법", () => {
  it("필요 등기구 수", () => {
    const out = calculateLux(
      { length: "10", width: "8", lux: "300", lumens: "3000", uf: "0.6", mf: "0.8" },
      1,
    );
    const total = (300 * 80) / (0.6 * 0.8);
    expect(primaryNumber(out)).toBe(Math.ceil(total / 3000));
  });
});

describe("부하 스케줄·방사형 조류", () => {
  it("행 집계", () => {
    const input = {
      id: "1",
      name: "펌프",
      category: "동력",
      qty: 2,
      unitKw: 15,
      efficiency: 0.92,
      pf: 0.85,
      demand: 0.8,
      coincidence: 1,
      voltage: 380,
      phase: "3" as const,
      pole: "RST" as const,
      panel: "MCC-1",
      remark: "",
    };
    const row = rowPowers(input);
    const connected = 30;
    const demandKw = (connected / 0.92) * 0.8;
    expect(row.connectedKw).toBeCloseTo(connected, 6);
    expect(row.demandKw).toBeCloseTo(demandKw, 6);
    expect(summarizeLoads([input]).demandKw).toBeCloseTo(demandKw, 6);
  });

  it("부하 버스 전압이 소스보다 낮다", () => {
    const flow = radialLoadFlow(
      [
        { id: "S", loadKw: 0, loadKvar: 0 },
        { id: "L", loadKw: 100, loadKvar: 50 },
      ],
      [{ from: "S", to: "L", r: 0.05, x: 0.08 }],
      380,
    );
    expect(flow.ok).toBe(true);
    if (flow.ok) {
      const load = flow.buses.find((b) => b.id === "L");
      expect(load && load.vPct).toBeLessThan(100);
      expect(flow.totalLossKw).toBeGreaterThan(0);
    }
  });
});

describe("카탈로그 정합", () => {
  it("워크스페이스 도구는 공식·스키마·엔진이 있다", () => {
    for (const tool of getPublishedTools()) {
      expect(getFormulaById(tool.formulaId), tool.slug).toBeTruthy();
      for (const id of tool.relatedToolIds) {
        expect(getToolById(id), `${tool.slug} → ${id}`).toBeTruthy();
      }
      if (isElectricalWorkspaceTool(tool) || isFacilityWorkspaceTool(tool)) {
        expect(formSchemas[tool.slug], tool.slug).toBeTruthy();
        expect(engines[tool.slug], tool.slug).toBeTruthy();
      }
    }
  });

  it("모든 published 도구에 계산 기준 메타데이터가 있다", () => {
    expect(missingStandardBasis()).toEqual([]);
    for (const tool of getPublishedTools()) {
      const basis = getStandardBasisBySlug(tool.slug);
      expect(basis, tool.slug).toBeTruthy();
      if (!basis) continue;
      for (const kind of basis.kinds) {
        expect(assertNoComplianceWording(STANDARD_KIND_LABEL[kind])).toBe(true);
      }
      expect(STANDARD_STATUSES.includes(basis.standardStatus), tool.slug).toBe(true);
      expect(assertNoComplianceWording(STANDARD_STATUS_LABEL[basis.standardStatus])).toBe(true);
      expect(assertNoComplianceWording(STANDARD_STATUS_NOTE[basis.standardStatus])).toBe(true);
      expect(assertNoComplianceWording(basis.methodNote)).toBe(true);
      expect(assertNoComplianceWording(basis.amporyScope)).toBe(true);
      for (const limit of basis.limits) expect(assertNoComplianceWording(limit)).toBe(true);
    }
  });
});

describe("차단기 Ib/In/Iz", () => {
  it("In·Iz가 있어도 적합 판정을 하지 않는다", () => {
    const out = calculateBreakerReference(
      { current: "80", margin: "1.25", inRated: "100", izCorrected: "114" },
      2,
    );
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.interpretation).toContain("적합 판정이 아닙니다");
      expect(out.warnings.some((w) => w.title === "관계 표시")).toBe(true);
      expect(out.warnings.some((w) => /합격|인증|법적 적합/.test(`${w.title}${w.message}`))).toBe(false);
      expect(out.metrics.find((m) => m.id === "i2Review")?.value).toBe("미검토");
      expect(out.metrics.find((m) => m.id === "cond1")?.value).toBe("수치관계 충족");
    }
  });

  it("I₂를 넣으면 조건 2 수치관계만 표시하고 합격 문구를 쓰지 않는다", () => {
    const out = engines["breaker-current"](
      { current: "80", margin: "1.25", inRated: "100", izCorrected: "114", i2Conv: "200" },
      2,
    );
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.metrics.find((m) => m.id === "i2")?.value).toBeTruthy();
      expect(out.metrics.find((m) => m.id === "i2Review")?.value).toBe("수치관계 미충족");
      expect(out.metrics.find((m) => m.id === "i2Limit")?.value).toBeTruthy();
      expect(out.warnings.some((w) => /합격|인증|법적 적합/.test(`${w.title}${w.message}`))).toBe(false);
    }
  });
});

describe("전압강하 허용치", () => {
  it("3%·5%를 자동 한도로 쓰지 않는다", () => {
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
    if (out.ok) {
      expect(out.warnings.some((w) => w.title.includes("3%") || w.title.includes("5%"))).toBe(false);
      expect(out.metrics.find((m) => m.id === "kecJudge")?.value).toBe("미적용");
      expect(out.interpretation).toContain("자동 판정은 미적용");
    }
  });

  it("검토를 켠 저압 조명 150 m는 3.25%를 허용 참고로 쓴다", () => {
    const limit = kecVoltageDropLimitPct({ supply: "lv", load: "lighting", lengthM: 150 });
    expect(limit.limitPct).toBeCloseTo(3.25, 5);
    const out = calculateVoltageDrop(
      {
        phase: "3",
        current: "80",
        length: "150",
        lengthUnit: "m",
        voltage: "380",
        voltageUnit: "V",
        rMode: "ohm",
        resistance: "0.727",
        resistanceUnit: "ohm/km",
        kecReview: "on",
        kecScope: "utility",
        kecSupply: "lv",
        kecLoad: "lighting",
        kecPathSame: "yes",
      },
      2,
    );
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.metrics.find((m) => m.id === "kecJudge")?.value).toBe("선택 검토");
      expect(Number(out.metrics.find((m) => m.id === "kecLimit")?.value)).toBeCloseTo(3.25, 2);
      expect(out.metrics.find((m) => m.id === "kecCompare")?.value).toMatch(/기준/);
      expect(out.interpretation).toContain("적합 판정이 아닙니다");
    }
  });

  it("ΔV 구간과 KEC 경로 길이를 분리한다", () => {
    const out = calculateVoltageDrop(
      {
        phase: "3",
        current: "80",
        length: "40",
        lengthUnit: "m",
        voltage: "380",
        voltageUnit: "V",
        rMode: "ohm",
        resistance: "0.727",
        resistanceUnit: "ohm/km",
        kecReview: "on",
        kecScope: "utility",
        kecSupply: "lv",
        kecLoad: "other",
        kecPathSame: "no",
        kecPathLength: "160",
      },
      2,
    );
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(Number(out.metrics.find((m) => m.id === "kecLimit")?.value)).toBeCloseTo(5.3, 2);
      expect(out.metrics.some((m) => m.id === "kecCompare")).toBe(false);
      expect(String(out.interpretation)).not.toMatch(/기준 이하|기준 초과/);
      expect(out.interpretation).toContain("선택한 케이블 구간의 전압강하");
      expect(out.interpretation).toContain("전체 공급경로");
      expect(out.inputSummary.some((row) => row.label === "계산 구간" && row.value.includes("40"))).toBe(true);
      expect(out.inputSummary.some((row) => row.label === "KEC 경로" && row.value.includes("160"))).toBe(true);
    }
  });

  it("구간과 경로가 같으면 비교하고 다르면 비교하지 않는다", () => {
    expect(kecVoltageDropCanCompare(40, 40)).toBe(true);
    expect(kecVoltageDropCanCompare(40, 160)).toBe(false);
  });

  it("320 m 경로는 가산 상한 0.5%를 적용한다", () => {
    expect(kecVoltageDropLimitPct({ supply: "lv", load: "other", lengthM: 320 }).limitPct).toBeCloseTo(5.5, 5);
  });

  it("혼합부하는 표 숫자를 고르지 않는다", () => {
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
        kecReview: "on",
        kecScope: "utility",
        kecSupply: "lv",
        kecLoad: "mixed",
        kecPathSame: "yes",
      },
      2,
    );
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.metrics.find((m) => m.id === "kecJudge")?.value).toBe("혼합부하 · 별도 검토");
      expect(out.metrics.some((m) => m.id === "kecLimit")).toBe(false);
      expect(out.interpretation).toContain("공급경로를 확인하여 결정하세요");
    }
  });

  it("고압 이상 수전에 최종회로 주의사항을 표시한다", () => {
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
        kecReview: "on",
        kecScope: "utility",
        kecSupply: "hv-plus",
        kecLoad: "other",
        kecPathSame: "yes",
      },
      2,
    );
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(Number(out.metrics.find((m) => m.id === "kecLimit")?.value)).toBe(8);
      expect(out.warnings.some((w) => w.title === "고압 이상 수전 주의")).toBe(true);
    }
  });

  it("표 232.3-1 기본값과 거리 가산 상한을 지킨다", () => {
    expect(kecVoltageDropLimitPct({ supply: "lv", load: "other", lengthM: 80 }).limitPct).toBe(5);
    expect(kecVoltageDropLimitPct({ supply: "hv-plus", load: "lighting", lengthM: 80 }).limitPct).toBe(6);
    expect(kecVoltageDropLimitPct({ supply: "hv-plus", load: "other", lengthM: 80 }).limitPct).toBe(8);
    expect(kecVoltageDropLimitPct({ supply: "lv", load: "lighting", lengthM: 220 }).limitPct).toBeCloseTo(3.5, 5);
  });

  it("독립 자가발전기는 표와 비교하지 않는다", () => {
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
        kecReview: "on",
        kecScope: "island",
        kecSupply: "lv",
        kecLoad: "other",
      },
      2,
    );
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.metrics.find((m) => m.id === "kecJudge")?.value).toBe("적용 대상 아님");
      expect(out.metrics.some((m) => m.id === "kecLimit")).toBe(false);
    }
  });
});

describe("KEC 표기 범위", () => {
  it("60287을 사용 표준으로 붙이지 않는다", () => {
    for (const tool of getPublishedTools()) {
      const basis = getStandardBasisBySlug(tool.slug);
      expect(basis?.relatedStandards?.some((item) => item.includes("60287")) ?? false).toBe(false);
    }
  });

  it("케이블 허용전류는 232.5.2와 60364-5-52만 연결한다", () => {
    const basis = getStandardBasisBySlug("cable-ampacity");
    expect(basis?.domesticReview).toBe("KEC 232.5.2");
    expect(basis?.relatedStandards).toEqual(["KS C IEC 60364-5-52"]);
    expect(basis?.usedInCalculation).toContain("사용자");
    expect(basis?.standardStatus).toBe("kec-related");
  });

  it("확인된 분류를 metadata에 고정한다", () => {
    expect(getStandardBasisBySlug("cable-sizing")?.standardStatus).toBe("kec-related");
    expect(getStandardBasisBySlug("breaker-current")?.standardStatus).toBe("kec-related");
    expect(getStandardBasisBySlug("voltage-drop")?.standardStatus).toBe("kec-related");
    expect(getStandardBasisBySlug("voltage-drop")?.usedInCalculation).toContain("구간=경로");
    expect(getStandardBasisBySlug("earth-conductor")?.standardStatus).toBe("kec-related");
    expect(getStandardBasisBySlug("earth-conductor")?.usedInCalculation).toContain("결과 숨김");
    expect(getStandardBasisBySlug("earth-conductor")?.domesticReview).toBe("KEC 142.3.2 보호도체 최소 단면적");
    expect(getStandardBasisBySlug("earth-conductor")?.relatedStandards).toEqual(["KS C IEC 60364-5-54"]);
    expect(getStandardBasisBySlug("ups-backup-time")?.standardStatus).toBe("manufacturer-data-required");
    expect(getStandardBasisBySlug("ups-capacity")?.standardStatus).toBe("manufacturer-data-required");
    expect(getStandardBasisBySlug("battery-capacity")?.standardStatus).toBe("manufacturer-data-required");
    expect(getStandardBasisBySlug("vfd-sizing")?.standardStatus).toBe("manufacturer-data-required");
    expect(getStandardBasisBySlug("soft-starter")?.standardStatus).toBe("manufacturer-data-required");
    expect(getStandardBasisBySlug("motor-starting")?.standardStatus).toBe("manufacturer-data-required");
    expect(getStandardBasisBySlug("generator-fuel")?.standardStatus).toBe("manufacturer-data-required");
    expect(getStandardBasisBySlug("short-circuit")?.standardStatus).toBe("international-reference");
    expect(getStandardBasisBySlug("transformer-load")?.standardStatus).toBe("general-engineering");
    expect(toolsByStandardStatus("verified-kec")).toEqual([]);
    expect(toolsByStandardStatus("kec-related").map((item) => item.slug).sort()).toEqual([
      "breaker-current",
      "cable-ampacity",
      "cable-sizing",
      "earth-conductor",
      "voltage-drop",
    ]);
    expect(STANDARD_STATUS_NOTE["manufacturer-data-required"]).toContain("제조사");
    expect(STANDARD_STATUS_NOTE["verification-required"]).toContain("자동 적합 판정");
  });
});

describe("접지도체 단열식", () => {
  it("k 기본값 없이 계산하고 t≤5 s를 표시한다", () => {
    const out = calculateEarthConductor({ faultA: "5000", time: "0.5", kFactor: "143" }, 2);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.interpretation).toContain("5초 이하");
      expect(out.inputSummary.some((row) => row.label === "t ≤ 5 s" && row.value === "적용범위 내")).toBe(true);
    }
  });

  it("t가 5초를 넘으면 k 없이 적용범위만 안내한다", () => {
    const out = calculateEarthConductor({ faultA: "5000", time: "8" }, 2);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.metrics.some((m) => m.id === "s")).toBe(false);
      expect(out.interpretation).not.toContain("선정 불가능");
    }
  });

  it("t가 5초를 넘으면 단면적을 숨기고 적용범위만 안내한다", () => {
    const out = calculateEarthConductor({ faultA: "5000", time: "6", kFactor: "143" }, 2);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.metrics.some((m) => m.id === "s")).toBe(false);
      expect(out.metrics.find((m) => m.id === "scope")?.value).toBe("적용범위 밖");
      expect(out.interpretation).toContain("이 계산식의 적용범위를 벗어났습니다");
      expect(out.interpretation).toContain("차단시간 5초 이하");
      expect(out.interpretation).toContain("표 142.3-1");
      expect(out.interpretation).not.toContain("선정 불가능");
      expect(out.warnings.some((w) => w.title === "차단시간 적용범위" && w.level === "warning")).toBe(true);
    }
  });
});

describe("검색 동의어", () => {
  it("한글·영문 실무 검색어를 찾는다", () => {
    expect(searchCatalog("전선").some((h) => h.href.includes("cable"))).toBe(true);
    expect(searchCatalog("cable").some((h) => h.href.includes("cable"))).toBe(true);
    expect(searchCatalog("wire").some((h) => h.href.includes("cable"))).toBe(true);
    expect(searchCatalog("CT").some((h) => h.href.includes("ct-ratio"))).toBe(true);
    expect(searchCatalog("콘덴서").some((h) => h.href.includes("power-factor"))).toBe(true);
    expect(searchCatalog("접지").length).toBeGreaterThan(0);
    expect(searchCatalog("SPD").length).toBeGreaterThan(0);
    expect(searchCatalog("조명").some((h) => h.href.includes("lux"))).toBe(true);
    expect(searchCatalog("태양광").some((h) => h.href.includes("solar"))).toBe(true);
    expect(searchCatalog("모터").some((h) => h.href.includes("motor-current"))).toBe(true);
    expect(searchCatalog("발전기").length).toBeGreaterThan(0);
    expect(searchCatalog("배터리").length).toBeGreaterThan(0);
    expect(searchCatalog("불평형").some((h) => h.href.includes("phase-unbalance"))).toBe(true);
    expect(searchCatalog("로드테스트").some((h) => h.href.includes("generator-load-test"))).toBe(true);
  });
});

describe("케이블 상세 보정", () => {
  it("보정 후 요구전류 = 회선당 / (kθ k그룹 k포설)", () => {
    const out = calculateCableSizing(
      {
        mode: "detailed",
        phase: "3",
        power: "100",
        powerUnit: "kW",
        voltage: "380",
        pf: "0.85",
        efficiency: "1",
        demand: "1",
        length: "50",
        allowPct: "3",
        kTemp: "0.91",
        kGroup: "0.8",
        kInstall: "1",
        parallel: "1",
      },
      4,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const ib = metricNumber(out, "ib");
    const ireq = metricNumber(out, "ireq");
    expect(ireq).toBeCloseTo(ib / (0.91 * 0.8), 3);
    expect(out.corrections?.some((c) => c.id === "kProd")).toBe(true);
  });

  it("단열계수 k가 없으면 열적 단면적을 만들지 않는다", () => {
    const out = calculateCableSizing(
      {
        mode: "detailed",
        phase: "3",
        power: "100",
        powerUnit: "kW",
        voltage: "380",
        pf: "0.85",
        length: "50",
        allowPct: "3",
        iscKa: "10",
        tsc: "1",
      },
      2,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.metrics.some((m) => m.id === "smin")).toBe(false);
  });
});

describe("발전기 운전/기동 분리", () => {
  it("기본 모드는 동시·여유를 넣지 않는다", () => {
    const out = calculateGeneratorSizing(
      { mode: "basic", staticKw: "100", motorKw: "50", upsKw: "0", pf: "0.8", motorStartK: "3" },
      2,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(metricNumber(out, "prun")).toBeCloseTo(150, 2);
    expect(metricNumber(out, "pstart")).toBeCloseTo(100, 2);
    expect(metricNumber(out, "pk")).toBeCloseTo(250, 2);
  });
});

describe("UPS 상세 배터리 수지", () => {
  it("상세 모드에서만 Ah를 이어서 보여준다", () => {
    const basic = engines["ups-capacity"]({ loadKw: "40", pf: "0.8", growth: "0.25", outputPf: "0.9", mode: "basic" }, 2);
    const detailed = engines["ups-capacity"](
      {
        loadKw: "40",
        pf: "0.8",
        growth: "0.25",
        outputPf: "0.9",
        mode: "detailed",
        dcV: "384",
        hours: "0.25",
        efficiency: "0.92",
        dod: "0.8",
        aging: "0.8",
        cellV: "12",
        moduleAh: "100",
      },
      2,
    );
    expect(basic.ok).toBe(true);
    expect(detailed.ok).toBe(true);
    if (!basic.ok || !detailed.ok) return;
    expect(basic.metrics.some((m) => m.id === "ah")).toBe(false);
    expect(detailed.metrics.some((m) => m.id === "ah")).toBe(true);
    expect(detailed.metrics.some((m) => m.id === "series")).toBe(true);
  });
});

describe("계산기 전달 쿼리", () => {
  it("허용 키만 넣고 이름은 버린다", () => {
    const href = buildHandoffHref("/tools/electrical/cable-sizing", { power: 30, pf: 0.85, name: "secret" });
    expect(href).toContain("power=30");
    expect(href).not.toContain("secret");
    const parsed = parseHandoff(new URLSearchParams("power=30&name=hidden"));
    expect(parsed.power).toBe("30");
    expect(parsed.name).toBeUndefined();
  });
});

describe("부하 스케줄 CSV", () => {
  it("내보낸 헤더를 다시 읽는다", () => {
    const csv = toCsv(
      ["name", "category", "qty", "unitKw", "efficiency", "pf", "demand", "coincidence", "voltage", "phase", "pole", "panel"],
      [["펌프", "동력", "2", "15", "0.92", "0.85", "0.8", "1", "380", "3", "RST", "MCC-1"]],
    );
    const imported = loadRowsFromCsv(csv);
    expect(imported.rows).toHaveLength(1);
    expect(imported.rows[0].unitKw).toBe(15);
    expect(imported.rows[0].pole).toBe("RST");
    expect(summarizeLoads(imported.rows).connectedKw).toBeCloseTo(30, 6);
  });

  it("잘못된 역률 행 번호를 남긴다", () => {
    const csv = ["name,qty,unitKw,pf,voltage,phase", "램프,1,0.1,1.5,220,1"].join("\n");
    const imported = loadRowsFromCsv(csv);
    expect(imported.errors.some((e) => e.line === 2 && e.message.includes("역률"))).toBe(true);
    expect(imported.rows).toHaveLength(1);
  });

  it("COMPUTED 구간은 입력으로 읽지 않는다", () => {
    const exported = exportLoadScheduleCsv(
      [
        normalizeLoadRow({
          name: "펌프",
          category: "모터",
          qty: 2,
          unitKw: 15,
          efficiency: 0.92,
          pf: 0.85,
          demand: 0.8,
          coincidence: 1,
          voltage: 380,
          phase: "3",
          pole: "RST",
          panel: "MCC-1",
        }),
      ],
      { transformerKva: 0, generatorKw: 0 },
    );
    const imported = loadRowsFromCsv(exported);
    expect(imported.rows).toHaveLength(1);
    expect(imported.rows[0].unitKw).toBe(15);
    expect(exported).toContain("# SECTION:COMPUTED");
    expect(exported).toContain("# SECTION:SUMMARY");
  });
});

describe("부하표 분류·상배치·Panel 생성", () => {
  it("동력을 모터 분류로 묶고 입력 kW를 계산한다", () => {
    const row = normalizeLoadRow({
      name: "펌프",
      category: "동력",
      qty: 2,
      unitKw: 15,
      efficiency: 0.92,
      pf: 0.85,
      demand: 0.8,
      coincidence: 1,
      voltage: 380,
      phase: "3",
      pole: "RST",
      panel: "MCC-1",
    });
    expect(rowPowers(row).inputKw).toBeCloseTo(30 / 0.92, 6);
    const motor = summarizeByCategory([row]).find((c) => c.key === "모터");
    expect(motor?.connectedKw).toBeCloseTo(30, 6);
  });

  it("단상 부하를 가벼운 상으로 추천한다", () => {
    const a = normalizeLoadRow({ name: "A", category: "콘센트", qty: 1, unitKw: 3, phase: "1", pole: "R", voltage: 220, pf: 1, efficiency: 1, demand: 1, coincidence: 1, panel: "DB-1" });
    const b = normalizeLoadRow({ name: "B", category: "콘센트", qty: 1, unitKw: 2, phase: "1", pole: "R", voltage: 220, pf: 1, efficiency: 1, demand: 1, coincidence: 1, panel: "DB-1" });
    const out = suggestPhasePlacement([a, b]);
    expect(out.changed).toBeGreaterThan(0);
    expect(new Set(out.rows.map((r) => r.pole)).size).toBeGreaterThan(1);
  });

  it("Panel 회로는 굵기를 비운다", () => {
    const row = normalizeLoadRow({ name: "펌프", category: "모터", qty: 1, unitKw: 15, phase: "3", voltage: 380, pf: 0.85, efficiency: 0.92, demand: 1, coincidence: 1, panel: "MCC-1" });
    const circuits = panelRowsFromLoads([row]);
    expect(circuits[0].cable).toBe("");
    expect(circuits[0].breaker).toBe("");
    expect(circuits[0].voltage).toBe(380);
  });

  it("예전 배열 저장을 문서로 읽는다", () => {
    const doc = parseLoadScheduleDocument([{ id: "1", name: "x", qty: 1, unitKw: 10, phase: "3", voltage: 380 }]);
    expect(doc.version).toBe(1);
    expect(doc.rows[0].unitKw).toBe(10);
    expect(doc.rows[0].remark).toBe("");
  });
});

describe("현장 검증 계산", () => {
  it("설계 100, 실측 94, 허용 ±5%", () => {
    const out = calculateFieldCompare(
      { itemName: "유량", designValue: "100", measuredValue: "94", unit: "m3/h", toleranceMode: "percent", tolerancePct: "5" },
      2,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "pct")).toBeCloseTo(94, 2);
    expect(metricNumber(out, "devpct")).toBeCloseTo(-6, 2);
    expect(metricNumber(out, "lo")).toBeCloseTo(95, 2);
    expect(metricNumber(out, "hi")).toBeCloseTo(105, 2);
  });

  it("절대공차 ±7", () => {
    const out = calculateFieldCompare(
      { designValue: "100", measuredValue: "94", unit: "A", toleranceMode: "absolute", toleranceAbs: "7" },
      2,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "lo")).toBeCloseTo(93, 2);
    expect(metricNumber(out, "hi")).toBeCloseTo(107, 2);
  });

  it("전압 218/221/215 불평형", () => {
    const out = calculatePhaseUnbalance({ vr: "218", vs: "221", vt: "215" }, 4);
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "vavg")).toBeCloseTo(218, 4);
    expect(metricNumber(out, "vdev")).toBeCloseTo(3, 4);
    expect(metricNumber(out, "vunb")).toBeCloseTo((3 / 218) * 100, 3);
    if (out.ok) expect(out.warnings.some((w) => w.title.includes("판정"))).toBe(true);
  });

  it("VUF는 위상 없이 RMS만 있으면 거부한다", () => {
    const out = calculatePhaseUnbalance(
      { unbalanceMethod: "vuf", vaMag: "220", vbMag: "220", vcMag: "220", vr: "380", vs: "380", vt: "380" },
      2,
    );
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.fieldErrors.vaAng).toContain("위상정보");
      expect(out.formError).toContain("Fortescue");
    }
  });

  it("평형 상전압 phasor의 VUF는 0에 가깝다", () => {
    const raw = calculateVUF(
      { magnitude: 220, angleDeg: 0 },
      { magnitude: 220, angleDeg: -120 },
      { magnitude: 220, angleDeg: 120 },
    );
    expect(raw.vufPercent).toBeCloseTo(0, 8);
    expect(raw.positiveSequence).toBeCloseTo(220, 6);

    const out = calculatePhaseUnbalance(
      {
        unbalanceMethod: "vuf",
        vaMag: "220",
        vaAng: "0",
        vbMag: "220",
        vbAng: "-120",
        vcMag: "220",
        vcAng: "120",
      },
      4,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "vuf")).toBeCloseTo(0, 4);
    expect(metricNumber(out, "v1")).toBeCloseTo(220, 3);
  });

  it("VUF는 선간 RMS에 ±120°를 붙여 계산하지 않는다", () => {
    const invented = calculateVUF(
      { magnitude: 380, angleDeg: 0 },
      { magnitude: 383, angleDeg: -120 },
      { magnitude: 377, angleDeg: 120 },
    );
    const out = calculatePhaseUnbalance({ unbalanceMethod: "vuf", vr: "380", vs: "383", vt: "377" }, 2);
    expect(out.ok).toBe(false);
    expect(invented.vufPercent).toBeGreaterThan(0);
  });

  it("변압기 실측 380V 800A 3상", () => {
    const expected = (SQRT_3 * 380 * 800) / 1000;
    const out = calculateTransformerLoad(
      { ratedKva: "1000", loadMode: "measured", phase: "3", voltage: "380", current: "800", pf: "0.9", designKva: "600" },
      4,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "load")).toBeCloseTo(expected, 3);
    expect(metricNumber(out, "kw")).toBeCloseTo(expected * 0.9, 3);
    expect(metricNumber(out, "gap")).toBeCloseTo(expected - 600, 3);
    if (out.ok) expect(out.warnings.some((w) => w.level === "error")).toBe(false);
  });

  it("변압기 상전류가 있으면 평균·최대를 보여 준다", () => {
    const out = calculateTransformerLoad(
      { ratedKva: "1000", loadMode: "measured", phase: "3", voltage: "380", ir: "180", is: "210", it: "195" },
      4,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "iavg")).toBeCloseTo(195, 4);
    expect(metricNumber(out, "imax")).toBeCloseTo(210, 4);
    expect(metricNumber(out, "load")).toBeCloseTo((SQRT_3 * 380 * 195) / 1000, 3);
    if (out.ok) {
      expect(out.metrics.find((m) => m.id === "load")?.label).toBe("평균전류 기반 추정 부하");
      expect(out.metrics.find((m) => m.id === "imaxPhase")?.value).toBe("S상");
      expect(out.interpretation).toContain("균형계통 근사");
      expect(out.warnings.some((w) => w.message.includes("실제 총 kVA"))).toBe(true);
    }
  });

  it("변압기 명판 전류가 있으면 최대상 사용률만 보여 준다", () => {
    const out = calculateTransformerLoad(
      {
        ratedKva: "500",
        loadMode: "measured",
        phase: "3",
        voltage: "380",
        ir: "180",
        is: "210",
        it: "195",
        ratedCurrent: "760",
      },
      4,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "imaxpct")).toBeCloseTo((210 / 760) * 100, 3);
    if (out.ok) {
      expect(out.warnings.some((w) => w.level === "warning" || w.level === "error")).toBe(false);
    }
  });

  it("영상분 계산기는 Facility 카탈로그에 없다", () => {
    expect(formSchemas["neutral-zero-sequence"]).toBeFalsy();
    expect(engines["neutral-zero-sequence"]).toBeFalsy();
    expect(NEUTRAL_ZERO_SEQUENCE_PLANNED_INPUTS).toContain("In");
  });

  it("발전기 로드테스트 P = S × PF", () => {
    const s = (SQRT_3 * 380 * 420) / 1000;
    const out = calculateGeneratorLoadTest(
      { ratedKw: "500", ratedKva: "625", phase: "3", voltage: "380", current: "420", pf: "0.8", hours: "2" },
      4,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "s")).toBeCloseTo(s, 3);
    expect(metricNumber(out, "p")).toBeCloseTo(s * 0.8, 3);
    expect(metricNumber(out, "e")).toBeCloseTo(s * 0.8 * 2, 3);
  });

  it("발전기 PF 미입력 시 kVA만 계산", () => {
    const s = (SQRT_3 * 380 * 420) / 1000;
    const out = calculateGeneratorLoadTest(
      { ratedKva: "625", phase: "3", voltage: "380", current: "420", hours: "2" },
      4,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "s")).toBeCloseTo(s, 3);
    if (out.ok) {
      expect(out.metrics.some((m) => m.id === "p")).toBe(false);
      expect(out.metrics.some((m) => m.id === "e")).toBe(false);
    }
  });

  it("Runtime 가동률", () => {
    const out = calculateDutyCycle({ periodHours: "24", onHours: "8", offHours: "16", starts: "12" }, 4);
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "rt")).toBeCloseTo((8 / 24) * 100, 3);
    expect(metricNumber(out, "sph")).toBeCloseTo(0.5, 3);
    expect(metricNumber(out, "avon")).toBeCloseTo(8 / 12, 3);
    if (out.ok) expect(out.metrics.some((m) => m.id === "duty")).toBe(false);
  });

  it("센서 비교 최대 오차 Point", () => {
    const out = calculateSensorCalibration(
      {
        spanMin: "0",
        spanMax: "100",
        ind1: "0.2",
        ref1: "0",
        ind2: "25.8",
        ref2: "25",
        ind3: "50.1",
        ref3: "50",
        ind4: "74.6",
        ref4: "75",
        ind5: "99.8",
        ref5: "100",
      },
      4,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "worst")).toBe(2);
    expect(metricNumber(out, "wabs")).toBeCloseTo(0.8, 4);
  });

  it("Trend 표본표준편차", () => {
    const parsed = parseTrendText("10\n12\n14");
    expect(parsed.points.map((p) => p.value)).toEqual([10, 12, 14]);
    const stats = analyzeTrend(parsed.points);
    expect(stats.avg).toBeCloseTo(12, 6);
    expect(stats.stdev).toBeCloseTo(2, 6);
    expect(stats.pctChange).toBeCloseTo(40, 6);
  });

  it("운전 에너지는 단가 없으면 비용을 생략한다", () => {
    const out = calculateOperatingEnergy(
      { powerKw: "15", hoursPerDay: "10", daysPerMonth: "22", loadFactor: "1" },
      2,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "day")).toBeCloseTo(150, 2);
    expect(metricNumber(out, "mon")).toBeCloseTo(3300, 2);
    if (out.ok) expect(out.metrics.some((m) => m.id === "mcost")).toBe(false);
  });

  it("개선 전후 ΔP와 Payback", () => {
    const out = calculateRetrofitCompare(
      { baselineKw: "18", proposedKw: "11", baselineHours: "4000", proposedHours: "4000", baselineRate: "100", capitalCost: "1400000" },
      2,
    );
    expect(out.ok).toBe(true);
    expect(metricNumber(out, "dp")).toBeCloseTo(7, 2);
    expect(metricNumber(out, "de")).toBeCloseTo(28000, 2);
    expect(metricNumber(out, "pb")).toBeCloseTo(1400000 / (28000 * 100), 2);
  });

  it("Trend는 워크스페이스 스키마 없이 전용 페이지를 쓴다", () => {
    const tool = getToolById("tool-trend-analysis");
    expect(tool).toBeTruthy();
    expect(isFacilityWorkspaceTool(tool!)).toBe(false);
    expect(formSchemas["trend-analysis"]).toBeFalsy();
  });

  it("MeasurementRecord 버전 1 구조를 만든다", () => {
    const rec = createMeasurementRecord({
      equipmentName: "TR-1",
      equipmentType: "transformer",
      measurementType: "load-ratio",
      measuredAt: "2026-08-29T00:00:00.000Z",
      designValue: 1000,
      measuredValue: 526.7,
      unit: "kVA",
      tolerance: 5,
      note: "현장 점심 부하",
    });
    expect(rec.version).toBe(1);
    expect(rec.id.startsWith("msr-")).toBe(true);
    expect(rec.equipmentName).toBe("TR-1");
  });
});
