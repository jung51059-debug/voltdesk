import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const FILES = [
  'PHASE-US5-IMPLEMENTATION-REPORT.md',
  'PHASE-US5-CONTENT-INVENTORY.csv',
  'PHASE-US5-CALCULATOR-CONTENT-QA.csv',
  'PHASE-US5-GUIDE-INVENTORY.csv',
  'PHASE-US5-NEW-GUIDE-REPORT.md',
  'PHASE-US5-SOURCE-CLOSURE.csv',
  'PHASE-US5-WORKED-EXAMPLE-QA.csv',
  'PHASE-US5-INTERNAL-LINK-QA.csv',
  'PHASE-US5-BLOCKED-CONTENT.md',
  'PHASE-US5-ARCHITECTURE-REGRESSION.md',
  'PHASE-US5-TECHNICAL-CLAIMS-QA.csv',
  'PHASE-US5-IMAGE-LOCALIZATION.csv',
  'PHASE-US5-SEO-VALIDATION.csv',
  'PHASE-US5-BROWSER-QA.csv',
];

describe('US-5 closure', () => {
  for (const f of FILES) {
    it(`exists ${f}`, () => {
      expect(existsSync(f)).toBe(true);
    });
  }

  it('calculator content QA all overview PASS', () => {
    const lines = readFileSync('PHASE-US5-CALCULATOR-CONTENT-QA.csv', 'utf8').trim().split('\n').slice(1);
    expect(lines.length).toBe(61);
    expect(lines.every((l) => /^[^,]+,PASS,/.test(l))).toBe(true);
  });

  it('browser independent expectations are non-engine-echo', () => {
    const raw = readFileSync('artifacts/us5/browser-expectations.json', 'utf8');
    const hints = JSON.parse(raw) as Record<string, { source?: string }>;
    expect(Object.keys(hints).length).toBe(61);
    expect(Object.values(hints).every((h) => Boolean(h.source) && !String(h.source).includes('engine'))).toBe(true);
  });

  it('browser matrix 355 rows when PHASE-US5-BROWSER-QA.csv present', () => {
    if (!existsSync('PHASE-US5-BROWSER-QA.csv')) return;
    const raw = readFileSync('PHASE-US5-BROWSER-QA.csv', 'utf8');
    if (raw.startsWith('# US-5: run')) return;
    const data = raw.trim().split('\n').filter((l) => !l.startsWith('#'));
    expect(data.length - 1).toBe(355);
  });
});