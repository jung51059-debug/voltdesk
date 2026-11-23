import { describe, expect, it } from "vitest";
import { calculateTransformerImpedance as calc } from "./transformer-impedance";
import { calculateShortCircuit } from "./short-circuit";
import { transformerImpedanceSchema as schema } from "@/lib/data/transformer-impedance";
import { getToolBySlug, getPublishedTools } from "@/lib/data/tools";
import { sitemapEntries, toolMetadata } from "@/lib/seo";
import { getFormulaById } from "@/lib/data/formulas";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";

const defaults = schema.defaults;
function values(input = defaults, precision = 2) {
  const result = calc(input, precision);
  if (!result.ok) throw new Error(JSON.stringify(result));
  return Object.fromEntries(result.metrics.map(m => [m.id, Number(String(m.value).replaceAll(",", ""))]));
}
describe("transformer percent impedance", () => {
  it("1,000kVA / 380V / 5%", () => {
    const r = values();
    expect(r.base).toBeCloseTo(0.1444, 10);
    expect(r.z).toBeCloseTo(0.00722, 10);
    expect(r.in).toBeCloseTo(1519.34, 2);
    expect(r.isc).toBeCloseTo(30386.86, 2);
  });
  it("500kVA / 400V / 4%", () => {
    const r = values({ ...defaults, ratedKva: "500", voltage: "400", zPct: "4" });
    expect(r.base).toBeCloseTo(0.32, 10);
    expect(r.z).toBeCloseTo(0.0128, 10);
    expect(r.isc).toBeCloseTo(18042.2, 1);
  });
  it("inverse and V/kV equivalence", () => {
    expect(values({ ...defaults, mode: "ohm", impedance: "0.00722" }).pct).toBeCloseTo(5, 10);
    expect(values({ ...defaults, voltage: "0.38", voltageUnit: "kV" })).toEqual(values());
  });
  it("same %Z, different Ω and current on HV/LV sides", () => {
    const hv = values({ ...defaults, voltage: "22.9", voltageUnit: "kV" });
    expect(hv.z).toBeCloseTo(26.2205, 6);
    expect(hv.z / values().z).toBeCloseTo((22900 / 380) ** 2, 5);
    expect(values({ ...defaults, mode: "ohm", impedance: "26.2205", voltage: "22900" }).pct).toBeCloseTo(5, 8);
    expect(values({ ...defaults, mode: "ohm", impedance: "26.2205" }).pct).not.toBeCloseTo(5);
  });
  for (const key of ["ratedKva", "voltage", "zPct"]) {
    it.each(["0", "-1", "abc", "", "NaN", "Infinity", "1e300", "1e13", "1e-300"])(`${key} rejects %s`, value => {
      expect(calc({ ...defaults, [key]: value }, 2).ok).toBe(false);
    });
  }
  it.each(["0", "-1", "abc", "1e300"])("Ω rejects %s", impedance => {
    expect(calc({ ...defaults, mode: "ohm", impedance }, 2).ok).toBe(false);
  });
  it("rejects unknown units/modes and ignores hidden input", () => {
    expect(calc({ ...defaults, voltageUnit: "MV" }, 2).ok).toBe(false);
    expect(calc({ ...defaults, mode: "invalid" }, 2).ok).toBe(false);
    expect(calc({ ...defaults, impedance: "abc" }, 2).ok).toBe(true);
  });
  it("preserves small Ω even at zero display precision", () => {
    expect(values(defaults, 0).z).toBeCloseTo(0.00722, 10);
    expect(values({ ...defaults, zPct: "0.000001" }, 0).z).toBeGreaterThan(0);
  });
  it("agrees with existing short circuit engine at c=1; handoff retains exact inputs", () => {
    const result = calc(defaults, 2);
    if (!result.ok) throw new Error("calculation failed");
    const url = new URL(result.followUps![0].href, "http://localhost");
    const input = Object.fromEntries(url.searchParams);
    expect(input).toMatchObject({ voltage: "380", voltageUnit: "V", trKva: "1000", trZpct: "5", cFactor: "1" });
    const old = calculateShortCircuit(input, 2);
    expect(old.ok).toBe(true);
    if (old.ok) expect(Number(String(old.metrics.find(m => m.id === "ik")!.value).replaceAll(",", ""))).toBeCloseTo(values().isc, 0);
  });
  it("registered listing, formula, guide, canonical, sitemap and related links", () => {
    const tool = getToolBySlug("transformer-impedance")!;
    expect(getPublishedTools()).toContainEqual(tool);
    expect(getFormulaById(tool.formulaId)).toBeTruthy();
    expect(toolMetadata(tool).alternates?.canonical).toBe(tool.href);
    expect(sitemapEntries()).toContain(tool.href);
    for (const link of getCalculatorGuide(tool.slug)!.links!) expect(sitemapEntries()).toContain(link.href);
  });
});
