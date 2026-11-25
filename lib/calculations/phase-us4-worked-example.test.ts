import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { GROUP_C_TOOLS, runGroupC, groupCDefaults } from '@/lib/us/group-c-tools';
import { conduitFillPercent } from '@/lib/us/conduit-fill-physical';

const US4_NEW_SLUGS = [
  ...GROUP_C_TOOLS.map((t) => t.slug),
  'conduit-fill-physical',
] as const;

describe('US-4 worked example QA (5 new routables)', () => {
  const rows: string[][] = [];

  for (const spec of GROUP_C_TOOLS) {
    it(`${spec.slug}: guide inputs match engine`, () => {
      const out = runGroupC(spec, groupCDefaults(spec), 6);
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      const actual = Number(String(out.metrics.find((m) => m.id === spec.checkMetric)?.value).replace(/,/g, ''));
      const tol = spec.slug === 'contract-power-current' ? 0.5 : 0.01;
      const pass = Math.abs(actual - spec.expected) <= tol;
      rows.push([
        spec.slug,
        'group-c',
        spec.fields.map((f) => `${f.id}=${f.value}`).join(';'),
        String(spec.expected),
        String(actual),
        String(tol),
        pass ? 'PASS' : 'FAIL',
        pass ? '' : 'align defaults with workedExample copy',
      ]);
      expect(pass).toBe(true);
    });
  }

  it('conduit-fill-physical: default areas', () => {
    const pct = conduitFillPercent(178, [
      { label: 'a', areaMm2: 3.31, count: 3 },
      { label: 'b', areaMm2: 5.26, count: 1 },
    ]);
    const expected = ((3.31 * 3 + 5.26) / 178) * 100;
    const pass = Math.abs(pct - expected) < 0.05;
    rows.push([
      'conduit-fill-physical',
      'us4-new',
      'conduit=178;3x3.31+5.26',
      expected.toFixed(2),
      pct.toFixed(2),
      '0.05',
      pass ? 'PASS' : 'FAIL',
      '',
    ]);
    expect(pass).toBe(true);
  });

  it('exports PHASE-US4-WORKED-EXAMPLE-QA.csv', () => {
    expect(rows.length).toBe(US4_NEW_SLUGS.length);
    const header =
      'slug,group,inputs,independent_expected,engine_actual,tolerance,status,fix';
    const csv = [header, ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    writeFileSync('PHASE-US4-WORKED-EXAMPLE-QA.csv', csv, 'utf8');
  });
});