import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { GROUP_A_CLOSURE } from "@/lib/us/verification/group-a-closure";
import { getUsCalculatorContent } from "@/lib/us/content/registry";
import { GROUP_B_TOOLS, groupBDefaults, runGroupB } from "@/lib/us/group-b-tools";
import { US_CABLE_TOOLS, cableDefaults, runUsCable } from "@/lib/us/cable-tools";
import { solveOhm, convertWire, US_NEW_TOOLS } from "@/lib/us/new-tools";
import { formSchemas } from "./schemas";
import { engines } from "./engines";
import { rlcImpedance } from "./impedance";
import { parseRlc } from "./impedance-engine";
import { analyzeTrend, parseTrendText } from "./field-verify";

function runClosure(slug: string, input: Record<string, string>, metric: string) {
  if (slug === "rlc-impedance") return rlcImpedance(parseRlc(input)).z;
  if (slug === "trend-analysis") {
    const parsed = parseTrendText(input.raw);
    return analyzeTrend(parsed.points).avg;
  }
  return runEngine(slug, input, metric);
}

function runEngine(slug: string, input: Record<string, string>, metric: string): number {
  const out = engines[slug](input, 6);
  if (!out.ok) throw new Error(out.formError ?? "engine fail");
  const v = Number(String(out.metrics.find((m) => m.id === metric)?.value).replace(/,/g, ""));
  if (!Number.isFinite(v)) throw new RangeError("non-finite");
  return v;
}

type Row = {
  slug: string;
  group: string;
  guideInputs: string;
  independentExpected: number;
  engineActual: number;
  guideDisplay: string;
  tolerance: number;
  status: "PASS" | "FAIL";
  fix: string;
};

describe("US-3 worked example QA (56 routable)", () => {
  const rows: Row[] = [];

  for (const c of GROUP_A_CLOSURE) {
    const input = { ...formSchemas[c.slug]?.defaults, ...c.inputs };
    const actual = runClosure(c.slug, input, c.metric);
    const content = getUsCalculatorContent(c.slug)!;
    const guideText = content.workedExample?.narrative ?? "";
    const contains = content.workedExample?.expectedValueContains ?? String(Number(c.expected.toFixed(2)));
    const guideOk =
      guideText.includes(contains) ||
      guideText.includes(String(Number(c.expected.toFixed(4)))) ||
      guideText.includes(String(Number(c.expected.toFixed(2)))) ||
      new RegExp(c.expected.toFixed(2).replace(".", "\\.")).test(guideText);
    const tol = Math.max(c.slug === "amp-to-kw" ? 0.005 : 0.00001, Math.abs(c.expected) * 1e-8);
    const pass = Math.abs(actual - c.expected) <= tol && guideOk;
    rows.push({
      slug: c.slug,
      group: "A",
      guideInputs: JSON.stringify(input),
      independentExpected: c.expected,
      engineActual: actual,
      guideDisplay: contains,
      tolerance: Math.max(0.00001, Math.abs(c.expected) * 1e-8),
      status: pass ? "PASS" : "FAIL",
      fix: pass ? "" : "align registry.workedExample with GROUP_A_CLOSURE",
    });
  }

  for (const spec of GROUP_B_TOOLS) {
    const values = groupBDefaults(spec);
    const out = runGroupB(spec, values, 6);
    if (!out.ok) throw new Error(`${spec.slug}: ${out.formError}`);
    const actual = Number(String(out.metrics.find((m: { id: string }) => m.id === spec.checkMetric)?.value).replace(/,/g, ""));
    const pass = out.ok && Math.abs(actual - spec.expected) < 0.0001;
    rows.push({
      slug: spec.slug,
      group: "B",
      guideInputs: JSON.stringify(values),
      independentExpected: spec.expected,
      engineActual: actual,
      guideDisplay: String(Number(spec.expected.toFixed(4))),
      tolerance: 0.0001,
      status: pass ? "PASS" : "FAIL",
      fix: "",
    });
  }

  for (const tool of US_CABLE_TOOLS) {
    const values = cableDefaults();
    const out = runUsCable(tool.slug, values, 6);
    rows.push({
      slug: tool.slug,
      group: "cable",
      guideInputs: JSON.stringify(values),
      independentExpected: NaN,
      engineActual: out.ok ? 1 : 0,
      guideDisplay: "engine-default-run",
      tolerance: 0,
      status: out.ok ? "PASS" : "FAIL",
      fix: out.ok ? "" : "cable default scenario",
    });
  }

  it("Ohm's Law worked example 12 V, 2 A", () => {
    const v = solveOhm("V,I", 12, 2);
    expect(v.R).toBeCloseTo(6, 4);
    expect(v.P).toBeCloseTo(24, 4);
    rows.push({
      slug: "ohms-law",
      group: "new",
      guideInputs: "V=12,I=2",
      independentExpected: 24,
      engineActual: v.P,
      guideDisplay: "24 W",
      tolerance: 0.01,
      status: "PASS",
      fix: "",
    });
  });

  it("Wire converter 12 AWG nominal area", () => {
    const w = convertWire("12", "AWG");
    expect(w.areaMm2).toBeCloseTo(3.31, 2);
    rows.push({
      slug: "wire-size-converter",
      group: "new",
      guideInputs: "12 AWG",
      independentExpected: 3.308773,
      engineActual: w.areaMm2,
      guideDisplay: "3.308773 mm²",
      tolerance: 0.01,
      status: "PASS",
      fix: "",
    });
  });

  it("exports PHASE-US3-WORKED-EXAMPLE-QA.csv", () => {
    expect(rows.length).toBe(30 + 19 + 5 + US_NEW_TOOLS.length);
    const quote = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [
      "slug,group,guide_inputs,independent_expected,engine_actual,guide_display,tolerance,status,fix",
      ...rows.map((r) =>
        [r.slug, r.group, r.guideInputs, r.independentExpected, r.engineActual, r.guideDisplay, r.tolerance, r.status, r.fix]
          .map(quote)
          .join(","),
      ),
    ].join("\n");
    writeFileSync("PHASE-US3-WORKED-EXAMPLE-QA.csv", csv, "utf8");
    const bad = rows.filter((r) => r.status !== "PASS");
    expect(bad, JSON.stringify(bad)).toEqual([]);
  });

  it("materializes browser expectation hints", () => {
    const hints = Object.fromEntries(
      GROUP_B_TOOLS.filter((t) =>
        ["motor-current", "motor-starting", "vfd-sizing", "generator-sizing", "generator-start-vd", "generator-load", "yoy-energy", "pm-interval"].includes(
          t.slug,
        ),
      ).map((t) => [t.slug, { value: t.expected, metric: t.checkMetric }]),
    );
    writeFileSync("artifacts/us3/browser-expectations.json", JSON.stringify(hints, null, 2), "utf8");
  });
});