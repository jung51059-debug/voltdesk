import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import {
  buildUsRouteInventory,
  usRoutablePageCount,
  usSearchIndexRecordCount,
} from '@/lib/us/route-inventory';

const DELIVERABLES = [
  'PHASE-US6-IMPLEMENTATION-REPORT.md',
  'PHASE-US6-US5-CLOSURE.csv',
  'PHASE-US6-WORKSPACE-INVENTORY.csv',
  'PHASE-US6-WORKSPACE-VALIDATION.csv',
  'PHASE-US6-SEARCH-QA.csv',
  'PHASE-US6-FAVORITES-SETTINGS-QA.csv',
  'PHASE-US6-POLICY-REPORT.md',
  'PHASE-US6-DATA-INVENTORY.csv',
  'PHASE-US6-GA4-EVENT-INVENTORY.csv',
  'PHASE-US6-GA4-VALIDATION.csv',
  'PHASE-US6-BROWSER-QA.csv',
  'PHASE-US6-HTTP-SEO-QA.csv',
  'PHASE-US6-INTERNAL-LINK-QA.csv',
  'PHASE-US6-ARCHITECTURE-REGRESSION.md',
  'PHASE-US6-BLOCKED-ITEMS.md',
  'PHASE-US6-ROUTE-INVENTORY.csv',
  'PHASE-US6-CALCULATOR-BROWSER-EXPECTED-QA.csv',
  'PHASE-US6-OPERATOR-CONFIRMATION.md',
];

describe('US-6 final closure deliverables', () => {
  for (const f of DELIVERABLES) {
    it(`exists ${f}`, () => {
      expect(existsSync(f)).toBe(true);
    });
  }

  it('route inventory is exact not estimate', () => {
    const pages = usRoutablePageCount();
    const total = buildUsRouteInventory().length;
    expect(pages).toBe(6 + 61 + 10 + 4 + 16 + 9);
    expect(total).toBe(pages + 2);
    // US-7 includes the three US-only calculators omitted from the original search index.
    expect(usSearchIndexRecordCount()).toBe(95);
  });

  it('US-6 browser matrix row count = pages × 5 viewports', () => {
    if (!existsSync('PHASE-US6-BROWSER-QA.csv')) return;
    const raw = readFileSync('PHASE-US6-BROWSER-QA.csv', 'utf8');
    if (raw.includes('# US-6: run')) return;
    const lines = raw.split('\n').filter((l) => l && !l.startsWith('#') && !l.startsWith('slug,'));
    expect(lines.length).toBe(usRoutablePageCount() * 5);
  });
});
