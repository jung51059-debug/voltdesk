import { describe, expect, it } from 'vitest';
import { GROUP_C_SLUGS, GROUP_C_TOOLS, GROUP_C_BLOCKED, runGroupC, groupCDefaults } from '@/lib/us/group-c-tools';
import { US_CALCULATOR_CATALOG } from '@/lib/us/calculator-catalog';
import { conduitFillPercent } from '@/lib/us/conduit-fill-physical';
import { isNecTableEmbedAllowed } from '@/lib/us/regulation/guard';

describe('US-4 Group C pilots', () => {
  it('catalog Group C has 9 rows', () => {
    expect(US_CALCULATOR_CATALOG.filter((e) => e.migrationGroup === 'C')).toHaveLength(9);
    expect([...GROUP_C_SLUGS].sort()).toEqual(
      US_CALCULATOR_CATALOG.filter((e) => e.migrationGroup === 'C')
        .map((e) => e.krSlug)
        .sort(),
    );
  });

  it('NEC tables remain disabled', () => {
    expect(isNecTableEmbedAllowed('2023')).toBe(false);
  });

  for (const spec of GROUP_C_TOOLS) {
    it(`${spec.slug}: independent engine vs spec.expected`, () => {
      const out = runGroupC(spec, groupCDefaults(spec), 6);
      expect(out.ok, JSON.stringify(out)).toBe(true);
      if (!out.ok) return;
      const actual = Number(String(out.metrics.find((m) => m.id === spec.checkMetric)?.value).replace(/,/g, ''));
      expect(actual).toBeCloseTo(spec.expected, spec.slug === 'contract-power-current' ? 1 : 3);
      expect(JSON.stringify({ metrics: out.metrics, warnings: out.warnings })).not.toMatch(/[\u3131-\uD79D]/);
    });
  }

  it('conduit fill physical example', () => {
    const pct = conduitFillPercent(178, [
      { label: 'a', areaMm2: 3.31, count: 3 },
      { label: 'b', areaMm2: 5.26, count: 1 },
    ]);
    expect(pct).toBeCloseTo(((3.31 * 3 + 5.26) / 178) * 100, 2);
  });

  it('blocked slugs stay blocked in catalog', () => {
    for (const slug of GROUP_C_BLOCKED) {
      const row = US_CALCULATOR_CATALOG.find((e) => e.krSlug === slug);
      expect(row?.publicationStatus).toBe('blocked');
    }
  });
});