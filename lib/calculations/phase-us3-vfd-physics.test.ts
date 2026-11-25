import { describe, expect, it } from "vitest";
import { calculateVfdSizing } from "@/lib/calculations/protection";
import { GROUP_B_TOOLS, groupBDefaults, runGroupB } from "@/lib/us/group-b-tools";

/**
 * KR engine: sFromP = kW×(1+margin)/derate is stored under metric id "sp" with Korean label "전력 기준"
 * and unit kVA in the engine (heuristic: treat electrical input kW as a scalar drive size path).
 * US shell: sp displayed as kW; s/si as kVA from √3 V I path.
 */
describe("US-3 VFD physics disclosure", () => {
  it("KR engine kW-path scalar vs current-path kVA (380 V anchor unchanged)", () => {
    const kr = calculateVfdSizing(
      { motorKw: "30", motorA: "60", voltage: "380", margin: "0.1", derate: "1", voltageUnit: "V" },
      2,
    );
    expect(kr.ok).toBe(true);
    if (!kr.ok) return;
    const s = Number(kr.metrics.find((m) => m.id === "s")?.value);
    const sp = Number(kr.metrics.find((m) => m.id === "sp")?.value);
    expect(s).toBeCloseTo(43.44, 2);
    expect(sp).toBeCloseTo(33, 2);
  });

  it("US defaults 480 V: primary pick follows current-path kVA", () => {
    const spec = GROUP_B_TOOLS.find((t) => t.slug === "vfd-sizing")!;
    const out = runGroupB(spec, groupBDefaults(spec), 4);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const sp = out.metrics.find((m) => m.id === "sp");
    const si = out.metrics.find((m) => m.id === "si");
    expect(sp?.unit).toBe("kW");
    expect(si?.unit).toBe("kVA");
    expect(Number(sp?.value)).toBeCloseTo(33, 1);
    expect(Number(si?.value)).toBeCloseTo(54.87, 1);
  });
});