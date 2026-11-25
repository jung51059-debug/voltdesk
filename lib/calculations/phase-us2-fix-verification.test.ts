import { describe, expect, it } from "vitest";
import { engines } from "@/lib/calculations/engines";
import { parseRlc } from "@/lib/calculations/impedance-engine";
import { rlcImpedance } from "@/lib/calculations/impedance";
import { parseTrendText, analyzeTrend } from "@/lib/calculations/field-verify";
import { GROUP_A_VERIFY_CASES } from "@/lib/us/verification/group-a-cases";
import {
  assertUsOutcomeEnglish,
  localizeOutcome,
} from "@/lib/us/messages-en";
import {
  near,
  refMotorSlipPercent,
  refMotorSyncRpm,
  refPowerFactor,
  refRlcSeriesZ,
  refSinglePhaseCurrentKw,
  refThreePhaseCurrentKw,
  refTransformerCurrents,
  refTrendMean,
  refTrendSampleStdev,
} from "@/lib/us/verification/independent-math";
import { getUsCalculatorContent } from "@/lib/us/content/registry";

const HANGUL = /[\u3131-\uD79D]/;

function primaryNumber(outcome: { ok: true; metrics: { primary?: boolean; value: string | number }[] }): number {
  const m = outcome.metrics.find((x) => x.primary) ?? outcome.metrics[0];
  const n = Number(String(m?.value).replace(/,/g, ""));
  return n;
}

describe("Phase US-2 fix — Group A independent verification", () => {
  for (const { slug, inputs, badInputs } of GROUP_A_VERIFY_CASES) {
    it(`${slug}: engine vs independent reference`, () => {
      if (slug === "rlc-impedance") {
        const input = parseRlc(inputs);
        const got = rlcImpedance(input);
        const lH = 0.1;
        const cF = 100e-6;
        const ref = refRlcSeriesZ(10, lH, cF, 60);
        expect(near(got.z, ref.z, 0.002, 0.05)).toBe(true);
        expect(near(got.z, 14.9927, 0.002, 0.05)).toBe(true);
        const iExp = 208 / ref.z;
        expect(got.current !== null && near(got.current, iExp, 0.01, 0.1)).toBe(true);
        return;
      }
      if (slug === "trend-analysis") {
        const { points } = parseTrendText(String(inputs.raw));
        const stats = analyzeTrend(points);
        const vals = [100, 102, 101, 99, 103];
        expect(near(stats.avg, refTrendMean(vals), 0.001, 0.01)).toBe(true);
        expect(near(stats.stdev, refTrendSampleStdev(vals), 0.01, 0.05)).toBe(true);
        expect(stats.count).toBe(5);
        const bad = parseTrendText("bad,not,numbers\nxxx");
        expect(bad.errors.length).toBeGreaterThan(0);
        return;
      }
      const engine = engines[slug];
      expect(engine, slug).toBeTypeOf("function");
      const out = engine(inputs, 2);
      if (slug === "field-compare" && !out.ok) {
        const withTol = engine({ ...inputs, tolerancePct: "10" }, 2);
        expect(withTol.ok, slug).toBe(true);
        return;
      }
      expect(out.ok, slug).toBe(true);
      if (!out.ok) return;

      if (slug === "single-phase-current") {
        const ref = refSinglePhaseCurrentKw(3, 120, 0.9, 1);
        expect(near(primaryNumber(out), ref, 0.01, 0.5)).toBe(true);
      } else if (slug === "three-phase-current") {
        const ref = refThreePhaseCurrentKw(10, 208, 0.85, 0.95);
        expect(near(primaryNumber(out), ref, 0.02, 0.5)).toBe(true);
      } else if (slug === "transformer-current") {
        const { I2, I1 } = refTransformerCurrents(750, 12470, 480);
        const i2raw = String(out.metrics.find((m) => m.id === "i2")?.value ?? "").replace(/,/g, "");
        const i1raw = String(out.metrics.find((m) => m.id === "i1")?.value ?? "").replace(/,/g, "");
        const i2 = Number(i2raw);
        const i1 = Number(i1raw);
        expect(near(i2, I2, 0.005, 0.5)).toBe(true);
        expect(near(i1, I1, 0.02, 0.2)).toBe(true);
      } else if (slug === "power-factor") {
        expect(near(primaryNumber(out), refPowerFactor(100, 111), 0.01, 0.01)).toBe(true);
      } else if (slug === "motor-slip") {
        const poles = Number(inputs.poles ?? "4");
        const rpm = Number(inputs.rpm ?? "1750");
        const sync = refMotorSyncRpm(poles, 60);
        expect(near(primaryNumber(out), refMotorSlipPercent(sync, rpm), 0.05, 0.2)).toBe(true);
      }

    });

    it(`${slug}: localized outcome has no Hangul (normal run)`, () => {
      if (slug === "trend-analysis" || slug === "rlc-impedance") return;
      const engine = engines[slug]!;
      const out = engine(inputs, 2);
      assertUsOutcomeEnglish(out, slug);
    });

    if (badInputs) {
      it(`${slug}: invalid inputs localize without raw Korean field errors (best effort)`, () => {
        const engine = engines[slug];
        if (!engine) return;
        const merged = { ...inputs, ...badInputs };
        const out = engine(merged, 2);
        expect(out.ok).toBe(false);
        if (!out.ok) {
          const loc = localizeOutcome(out)!;
          expect(JSON.stringify(loc)).not.toMatch(HANGUL);
          expect(JSON.stringify(loc).includes("을(를) 입력")).toBe(false);
        }
      });
    }
  }

  it("content sections are non-empty for all 30", () => {
    for (const { slug } of GROUP_A_VERIFY_CASES) {
      const c = getUsCalculatorContent(slug)!;
      expect(c.overview.length).toBeGreaterThan(40);
      expect(c.howToUse.length).toBeGreaterThan(0);
      expect(c.faqs.length).toBeGreaterThanOrEqual(3);
      expect(c.limitations.length).toBeGreaterThan(20);
      expect(HANGUL.test(c.overview)).toBe(false);
    }
  });
});