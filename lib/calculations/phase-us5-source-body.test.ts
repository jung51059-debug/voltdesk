import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { US_TECHNICAL_SOURCES } from '@/lib/us/sources/technical-sources';

const BODY_CHECKS: Record<string, { url: string; patterns: RegExp[] }> = {
  'nist-sp811-2024': {
    url: 'https://www.nist.gov/pml/special-publication-811',
    patterns: [/International System of Units/i, /conversion/i],
  },
  'openstax-up2-power': {
    url: 'https://openstax.org/books/university-physics-volume-2/pages/9-introduction',
    patterns: [/electrical/i, /energy/i, /power/i],
  },
  'osha-loto-overview': {
    url: 'https://www.osha.gov/control-hazardous-energy',
    patterns: [/lockout/i, /tagout/i, /hazardous energy/i],
  },
  'openstax-up2-ac': {
    url: 'https://openstax.org/books/university-physics-volume-2/pages/15-4-power-in-an-ac-circuit',
    patterns: [/power factor/i, /RMS/i],
  },
};

describe('US-5 public source body spot-check', () => {
  const rows: string[][] = [];

  for (const [sourceId, check] of Object.entries(BODY_CHECKS)) {
    it(`fetches and spot-checks ${sourceId}`, async () => {
      const res = await fetch(check.url, { headers: { 'User-Agent': 'Ampory-US5-verification/1.0' } });
      const body = await res.text();
      const hits = res.status === 200 ? check.patterns.filter((p) => p.test(body)).length : 0;
      const status =
        res.status !== 200
          ? 'BLOCKED_ACCESS'
          : hits === check.patterns.length
            ? 'VERIFIED_BODY'
            : hits > 0
              ? 'PARTIAL_BODY'
              : 'FETCH_ONLY';
      const reg = US_TECHNICAL_SOURCES.find((s) => s.sourceId === sourceId);
      rows.push([
        sourceId,
        check.url,
        String(res.status),
        String(hits),
        String(check.patterns.length),
        status,
        reg?.verificationStatus ?? 'UNKNOWN',
      ]);
      if (res.status === 200) expect(hits).toBeGreaterThan(0);
    });
  }

  it('appends body check results to TECHNICAL-CLAIMS notes file', () => {
    const head = 'source_id,url,http_status,pattern_hits,pattern_total,body_check,registry_status';
    const csv = [head, ...rows.map((r) => r.join(','))].join('\n');
    writeFileSync('artifacts/us5/source-body-checks.csv', csv);
  });
});