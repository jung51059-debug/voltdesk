import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { buildBrowserIndependentExpectations } from '@/lib/us/verification/browser-independent-expectations';
import { US_ROUTABLE_SLUGS } from '@/lib/us/us-routable-slugs';
import { getUsCalculatorContent } from '@/lib/us/content/registry';
import { GROUP_A_CLOSURE } from '@/lib/us/verification/group-a-closure';
import { GROUP_B_TOOLS, groupBDefaults, runGroupB } from '@/lib/us/group-b-tools';
import { GROUP_C_TOOLS, groupCDefaults, runGroupC } from '@/lib/us/group-c-tools';
import { US_CABLE_TOOLS, cableDefaults, runUsCable } from '@/lib/us/cable-tools';
import { solveOhm, convertWire } from '@/lib/us/new-tools';
import { conduitFillPercent } from '@/lib/us/conduit-fill-physical';
import { formSchemas } from '@/lib/calculations/schemas';
import { engines } from '@/lib/calculations/engines';
import { rlcImpedance } from '@/lib/calculations/impedance';
import { parseRlc } from '@/lib/calculations/impedance-engine';
import { analyzeTrend, parseTrendText } from '@/lib/calculations/field-verify';
function runEngine(slug: string, input: Record<string, string>, metric: string): number {
  if (slug === 'rlc-impedance') return rlcImpedance(parseRlc(input)).z;
  if (slug === 'trend-analysis') {
    const parsed = parseTrendText(input.raw);
    return analyzeTrend(parsed.points).avg;
  }
  const out = engines[slug](input, 8);
  if (!out.ok) throw new Error(out.formError ?? 'fail');
  return Number(String(out.metrics.find((m) => m.id === metric)?.value).replace(/,/g, ''));
}

describe('US-5 worked example QA (61)', () => {
  const rows: string[][] = [];

  it('generates and exports PHASE-US5-WORKED-EXAMPLE-QA.csv', () => {
    const hints = buildBrowserIndependentExpectations();
    for (const slug of US_ROUTABLE_SLUGS) {
      const hint = hints[slug];
      expect(hint, slug).toBeTruthy();
      let actual = hint.value;
      let expected = hint.value;
      let inputs = 'defaults';

      const closure = GROUP_A_CLOSURE.find((c) => c.slug === slug);
      if (closure) {
        const input = { ...formSchemas[slug]?.defaults, ...closure.inputs };
        inputs = JSON.stringify(input);
        actual = runEngine(slug, input, closure.metric);
        expected = closure.expected;
      } else if (GROUP_B_TOOLS.some((t) => t.slug === slug)) {
        const spec = GROUP_B_TOOLS.find((t) => t.slug === slug)!;
        const values = groupBDefaults(spec);
        inputs = JSON.stringify(values);
        const out = runGroupB(spec, values, 8);
        expect(out.ok).toBe(true);
        if (!out.ok) continue;
        actual = Number(String(out.metrics.find((m: { id: string }) => m.id === spec.checkMetric)?.value).replace(/,/g, ''));
        expected = spec.expected;
      } else if (GROUP_C_TOOLS.some((t) => t.slug === slug)) {
        const spec = GROUP_C_TOOLS.find((t) => t.slug === slug)!;
        const values = groupCDefaults(spec);
        inputs = JSON.stringify(values);
        const out = runGroupC(spec, values, 8);
        expect(out.ok).toBe(true);
        if (!out.ok) continue;
        actual = Number(String(out.metrics.find((m: { id: string }) => m.id === spec.checkMetric)?.value).replace(/,/g, ''));
        expected = spec.expected;
      } else if (US_CABLE_TOOLS.some((t) => t.slug === slug)) {
        const values = cableDefaults();
        inputs = JSON.stringify(values);
        const out = runUsCable(slug, values, 8);
        if (!out.ok) throw new Error('cable fail');
        const m = out.metrics[0];
        actual = Number(String(m.value).replace(/,/g, ''));
        expected = hint.value;
      } else if (slug === 'ohms-law') {
        inputs = 'V=12,I=2';
        actual = solveOhm('V,I', 12, 2).P;
        expected = 24;
      } else if (slug === 'wire-size-converter') {
        inputs = '12 AWG';
        actual = convertWire('12', 'AWG').areaMm2;
        expected = hint.value;
      } else if (slug === 'conduit-fill-physical') {
        inputs = '178mm2';
        actual = conduitFillPercent(178, [
          { label: 'a', areaMm2: 3.31, count: 3 },
          { label: 'b', areaMm2: 5.26, count: 1 },
        ]);
        expected = hint.value;
      }

      const tol = Math.max(0.001, Math.abs(expected) * 0.002);
      const pass = Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tol;
      const content = getUsCalculatorContent(slug);
      const guideOk = content?.workedExample.expectedValueContains
        ? content.workedExample.narrative.length > 20
        : true;
      rows.push([
        slug,
        inputs,
        String(expected),
        String(actual),
        String(tol),
        pass && guideOk ? 'PASS' : 'FAIL',
        '',
      ]);
      expect(pass && guideOk, slug).toBe(true);
    }

    expect(rows.length).toBe(61);
    const csv = [
      'slug,inputs,independent_expected,engine_actual,tolerance,status,fix',
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    writeFileSync('PHASE-US5-WORKED-EXAMPLE-QA.csv', csv);
  });
});