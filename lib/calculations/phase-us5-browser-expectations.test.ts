import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { buildBrowserIndependentExpectations } from '@/lib/us/verification/browser-independent-expectations';
import { formSchemas } from '@/lib/calculations/schemas';
import { engines } from '@/lib/calculations/engines';
import { rlcImpedance } from '@/lib/calculations/impedance';
import { parseRlc } from '@/lib/calculations/impedance-engine';
import { analyzeTrend, parseTrendText } from '@/lib/calculations/field-verify';
import { GROUP_A_CLOSURE } from '@/lib/us/verification/group-a-closure';
import { groupBDefaults, runGroupB, GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { groupCDefaults, runGroupC, GROUP_C_TOOLS } from '@/lib/us/group-c-tools';
import { cableDefaults, runUsCable, US_CABLE_TOOLS } from '@/lib/us/cable-tools';

function engineMetric(slug: string, metric: string, input: Record<string, string>): number {
  if (slug === 'rlc-impedance') return rlcImpedance(parseRlc(input)).z;
  if (slug === 'trend-analysis') {
    const parsed = parseTrendText(input.raw);
    return analyzeTrend(parsed.points).avg;
  }
  const out = engines[slug](input, 8);
  if (!out.ok) throw new Error(out.formError ?? 'fail');
  return Number(String(out.metrics.find((m) => m.id === metric)?.value).replace(/,/g, ''));
}

describe('US-5 browser independent expectations', () => {
  it('writes artifacts/us5/browser-expectations.json with non-engine-echo sources', () => {
    const hints = buildBrowserIndependentExpectations();
    expect(Object.keys(hints).length).toBe(61);
    expect(Object.values(hints).every((h) => !h.source.includes('engine'))).toBe(true);

    for (const c of GROUP_A_CLOSURE) {
      const input = { ...formSchemas[c.slug]?.defaults, ...c.inputs };
      const actual = engineMetric(c.slug, c.metric, input);
      const expected = hints[c.slug].value;
      expect(Math.abs(actual - expected) / Math.max(1, Math.abs(expected))).toBeLessThan(0.02);
    }

    for (const spec of GROUP_B_TOOLS) {
      const out = runGroupB(spec, groupBDefaults(spec), 8);
      expect(out.ok).toBe(true);
      if (!out.ok) continue;
      const actual = Number(String(out.metrics.find((m: { id: string }) => m.id === spec.checkMetric)?.value).replace(/,/g, ''));
      expect(actual).toBeCloseTo(hints[spec.slug].value, 2);
    }

    for (const spec of GROUP_C_TOOLS) {
      const out = runGroupC(spec, groupCDefaults(spec), 8);
      expect(out.ok).toBe(true);
      if (!out.ok) continue;
      const actual = Number(String(out.metrics.find((m: { id: string }) => m.id === spec.checkMetric)?.value).replace(/,/g, ''));
      expect(actual).toBeCloseTo(hints[spec.slug].value, 2);
    }

    for (const tool of US_CABLE_TOOLS) {
      const out = runUsCable(tool.slug, cableDefaults(), 8);
      expect(out.ok).toBe(true);
      if (!out.ok) continue;
      const id = hints[tool.slug].metric;
      const actual = Number(String(out.metrics.find((m) => m.id === id)?.value).replace(/,/g, ''));
      expect(actual).toBeCloseTo(hints[tool.slug].value, 4);
    }

    mkdirSync('artifacts/us5', { recursive: true });
    writeFileSync('artifacts/us5/browser-expectations.json', JSON.stringify(hints, null, 2));
  });
});