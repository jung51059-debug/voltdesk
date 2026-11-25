import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { GROUP_C_SLUGS, GROUP_C_TOOLS, runGroupC, groupCDefaults } from '@/lib/us/group-c-tools';
import { US_REGULATION_SOURCES, US_JURISDICTIONS } from '@/lib/us/regulation/nec-sources';
import { US_CALCULATOR_CATALOG } from '@/lib/us/calculator-catalog';
import { GROUP_A_SLUGS } from '@/lib/us/group-a-slugs';
import { getUsCalculatorContent } from '@/lib/us/content/registry';

const GROUP_C_INVENTORY_TYPES: Record<string, string> = {
  'contract-power-current': 'TYPE1_ENGINEERING',
  'short-circuit': 'TYPE1_ENGINEERING',
  'protection-relay': 'TYPE1_ENGINEERING',
  'cable-ampacity': 'TYPE2_USER_SUPPLIED',
  'cable-sizing': 'TYPE4_BLOCKED',
  'breaker-current': 'TYPE4_BLOCKED',
  'earth-conductor': 'TYPE4_BLOCKED',
  'spd-helper': 'TYPE4_BLOCKED',
  'panel-schedule': 'TYPE4_BLOCKED',
};

describe('US-4 deliverables', () => {
  it('writes PHASE-US4-GROUP-C-INVENTORY.csv', () => {
    const rows = ['slug,impl_type,routable,nec_dependency,kec_dependency,notes'];
    for (const slug of GROUP_C_SLUGS) {
      const entry = US_CALCULATOR_CATALOG.find((e) => e.krSlug === slug)!;
      const impl = GROUP_C_INVENTORY_TYPES[slug] ?? 'UNKNOWN';
      const routable = GROUP_C_TOOLS.some((t) => t.slug === slug) ? 'yes' : 'no';
      rows.push(`${slug},${impl},${routable},${entry.regulationDependency},kec-separated-in-us-layer,US-4`);
    }
    writeFileSync('PHASE-US4-GROUP-C-INVENTORY.csv', rows.join('\n'));
  });

  it('writes PHASE-US4-NEC-SOURCES.csv', () => {
    const head =
      'source_id,document_title,issuing_organization,edition,source_url,accessed_date,verification_status,reuse_permission_status,related_calculator,limitation';
    const body = US_REGULATION_SOURCES.map((s) =>
      [s.sourceId, s.documentTitle, s.issuingOrganization, s.edition, s.sourceUrl, s.accessedDate, s.verificationStatus, s.reusePermissionStatus, s.relatedCalculators, s.limitation]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    );
  writeFileSync('PHASE-US4-NEC-SOURCES.csv', [head, ...body].join('\n'));
  });

  it('writes PHASE-US4-SOURCE-CLOSURE.csv for Group A sample', () => {
    const rows = ['slug,prior_status,us4_status,method,notes'];
    for (const slug of GROUP_A_SLUGS) {
      const content = getUsCalculatorContent(slug);
      const ref = content?.references[0];
      rows.push(`${slug},PENDING,${ref?.status === 'verified' ? 'PARTIAL' : 'PENDING'},registry-body,${ref?.title ?? 'none'}`);
    }
    writeFileSync('PHASE-US4-SOURCE-CLOSURE.csv', rows.join('\n'));
  });

  it('writes jurisdiction stub', () => {
    expect(US_JURISDICTIONS[0]?.adoptedEdition).toBe('UNKNOWN');
  });

  it('writes PHASE-US4-CALCULATOR-VALIDATION.csv', () => {
    const rows = ['slug,expected,actual,status'];
    for (const spec of GROUP_C_TOOLS) {
      const out = runGroupC(spec, groupCDefaults(spec), 6);
      const actual = out.ok ? Number(String(out.metrics.find((m: { id: string }) => m.id === spec.checkMetric)?.value).replace(/,/g, '')) : NaN;
      rows.push(`${spec.slug},${spec.expected},${actual},${out.ok && Math.abs(actual - spec.expected) / Math.max(Math.abs(spec.expected), 1) < 0.001 ? 'PASS' : 'FAIL'}`);
    }
    writeFileSync('PHASE-US4-CALCULATOR-VALIDATION.csv', rows.join('\n'));
  });
});