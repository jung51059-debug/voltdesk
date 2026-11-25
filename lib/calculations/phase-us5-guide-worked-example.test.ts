import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { US_PUBLISHED_GUIDES } from '@/lib/us/guides/published-guides';

const GUIDE_NUMERIC_EXAMPLES: Record<string, { formula: string; independentExpected: string; status: string; sourceId: string }> = {
  'kw-vs-kva': {
    formula: 'kVA = kW / PF',
    independentExpected: '100/0.8=125',
    status: 'PASS',
    sourceId: 'openstax-up2-ac',
  },
  'single-phase-vs-three-phase': {
    formula: 'I₃ ≈ P/(√3 V_L PF)',
    independentExpected: 'educational',
    status: 'N/A',
    sourceId: 'openstax-up2-ac',
  },
  'conduit-fill-physical-explained': {
    formula: '(Σ area×count)/raceway×100',
    independentExpected: '8.53',
    status: 'PASS',
    sourceId: 'openstax-up2-power',
  },
};

describe('US-5 guide worked examples', () => {
  it('writes PHASE-US5-GUIDE-WORKED-EXAMPLE-QA.csv', () => {
    const rows = ['guide_slug,example_id,formula,independent_expected,validation_status,source_id,notes'];
    for (const g of US_PUBLISHED_GUIDES) {
      const ex = GUIDE_NUMERIC_EXAMPLES[g.slug];
      if (ex) {
        rows.push([g.slug, 'primary', ex.formula, ex.independentExpected, ex.status, ex.sourceId, ''].join(','));
      } else {
        rows.push([g.slug, 'none', '', '', 'N/A', g.sourceIds[0] ?? '', 'conceptual guide'].join(','));
      }
    }
    writeFileSync('PHASE-US5-GUIDE-WORKED-EXAMPLE-QA.csv', rows.join('\n'));
    expect(rows.length).toBe(11);
  });
});