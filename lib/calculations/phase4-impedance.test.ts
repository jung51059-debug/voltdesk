import { describe, expect, it } from "vitest";
import { acVoltageDrop, cableImpedance, rlcImpedance, theoreticalResistance } from "./impedance";
import { calculateAcVoltageDrop } from "./impedance-adapters";
import { calculatePathVoltageDrop, emptyPathSegment } from "./path-voltage-drop";
import { calculateVoltageDrop } from "./engines";
import { getPublishedTools } from "@/lib/data/tools";
import { sitemapEntries } from "@/lib/seo";

describe("Phase 4 — R·X 전압강하 독립 검산", () => {
  it("3상 380V·80A·100m·r0.727·x0.08·PF0.8 지상 (요청서 예제)", () => {
    const r = acVoltageDrop({
      phase: "3",
      voltage: 380,
      current: 80,
      length: 100,
      r: 0.727,
      x: 0.08,
      pf: 0.8,
      direction: "lagging",
    });
    expect(r.drop).toBeCloseTo(8.72399350756292, 10);
    expect(r.percent).toBeCloseTo(2.2957877651481366, 10);
    expect(r.lossW).toBeCloseTo(1395.84, 10);
  });

  it("voltage-drop 상세 모드 엔진 동일 값", () => {
    const out = calculateVoltageDrop(
      {
        mode: "detailed",
        phase: "3",
        current: "80",
        length: "100",
        lengthUnit: "m",
        voltage: "380",
        voltageUnit: "V",
        rMode: "ohm",
        resistance: "0.727",
        resistanceUnit: "ohm/km",
        reactance: "0.08",
        pf: "0.8",
        direction: "lagging",
        kecReview: "off",
      },
      4,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const dv = Number(String(out.metrics.find((m) => m.id === "dv")?.value).replace(/,/g, ""));
    const pct = Number(String(out.metrics.find((m) => m.id === "pct")?.value).replace(/,/g, ""));
    const loss = Number(String(out.metrics.find((m) => m.id === "loss")?.value).replace(/,/g, ""));
    expect(dv).toBeCloseTo(8.724, 3);
    expect(pct).toBeCloseTo(2.2958, 3);
    expect(loss).toBeCloseTo(1395.84, 2);
  });

  it("calculateAcVoltageDrop 어댑터", () => {
    const out = calculateAcVoltageDrop(
      {
        mode: "detailed",
        phase: "3",
        current: "80",
        length: "100",
        lengthUnit: "m",
        voltage: "380",
        voltageUnit: "V",
        rMode: "ohm",
        resistance: "0.727",
        resistanceUnit: "ohm/km",
        reactance: "0.08",
        pf: "0.8",
        direction: "lagging",
      },
      6,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const dv = Number(String(out.metrics.find((m) => m.id === "dv")?.value).replace(/,/g, ""));
    expect(dv).toBeCloseTo(8.724, 3);
  });
});

describe("Phase 4 — 구리 25mm² 100m 90℃ 저항", () => {
  it("이론 R20·R90 (편도 100m)", () => {
    const rKm = theoreticalResistance("cu", 25, 90);
    expect(rKm.r20).toBeCloseTo(0.6896, 6);
    expect(rKm.r).toBeCloseTo(0.87930896, 6);
    const segment = cableImpedance({
      mode: "theory",
      material: "cu",
      area: 25,
      length: 100,
      temperature: 90,
      frequency: 60,
      inductance: 0.25,
      resistance: 0,
      reactance: 0,
    });
    expect(segment.r).toBeCloseTo(0.087930896, 9);
    expect(segment.r20).toBeCloseTo(0.06896, 8);
  });
});

describe("Phase 4 — 경로 전압강하 상세 구간", () => {
  it("단일 상세 구간 R·X·손실", () => {
    const out = calculatePathVoltageDrop(
      {
        startKind: "meter-2nd",
        startLabel: "계량기 2차",
        kecReview: false,
        kecScope: "utility",
        kecSupply: "lv",
        kecLoad: "other",
        kecDuty: "normal",
        segments: [
          {
            ...emptyPathSegment(0),
            mode: "detailed",
            lengthM: 100,
            currentA: 80,
            pf: 0.8,
            reactanceOhmKm: 0.08,
            resistanceOhmKm: 0.727,
          },
        ],
      },
      3,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const seg = out.path.segments[0];
    expect(seg.dropV).toBeCloseTo(8.72399350756292, 6);
    expect(seg.lossW).toBeCloseTo(1395.84, 2);
    expect(seg.resistiveV).toBeGreaterThan(0);
    expect(seg.reactiveV).toBeGreaterThan(0);
  });

  it("상·전압 불일치 구간 차단", () => {
    const out = calculatePathVoltageDrop(
      {
        startKind: "meter-2nd",
        startLabel: "계량기 2차",
        kecReview: false,
        kecScope: "utility",
        kecSupply: "lv",
        kecLoad: "other",
        kecDuty: "normal",
        segments: [
          { ...emptyPathSegment(0), phase: "3", voltageV: 380 },
          { ...emptyPathSegment(1), phase: "1", voltageV: 220 },
        ],
      },
      2,
    );
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.formError).toContain("기준전압");
  });
});

describe("Phase 4 — 발행·사이트맵", () => {
  it("임피던스 2종 published 및 URL", () => {
    const tools = getPublishedTools();
    expect(tools.map((t) => t.slug)).toEqual(expect.arrayContaining(["cable-impedance", "rlc-impedance"]));
    const paths = sitemapEntries();
    expect(paths).toContain("/tools/electrical/cable-impedance");
    expect(paths).toContain("/tools/electrical/rlc-impedance");
    expect(paths).toHaveLength(132);
  });

  it("RLC 기본 예제 전류", () => {
    const r = rlcImpedance({
      circuit: "RLC",
      r: 10,
      l: 0.1,
      c: 100e-6,
      frequency: 60,
      voltage: 220,
    });
    expect(r.z).toBeCloseTo(14.994745, 4);
    expect(r.current).toBeCloseTo(14.671807, 4);
    expect(r.resonance).toBeCloseTo(50.329212, 4);
  });
});