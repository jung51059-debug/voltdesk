import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

describe('US-4 deliverable closure', () => {
  const files = [
    'PHASE-US4-IMPLEMENTATION-REPORT.md',
    'PHASE-US4-GROUP-C-INVENTORY.csv',
    'PHASE-US4-NEC-SOURCES.csv',
    'PHASE-US4-DATA-RIGHTS-REPORT.md',
    'PHASE-US4-CODE-ARCHITECTURE.md',
    'PHASE-US4-CALCULATOR-VALIDATION.csv',
    'PHASE-US4-NEW-CALCULATOR-REPORT.md',
    'PHASE-US4-BLOCKED-ITEMS.md',
    'PHASE-US4-SOURCE-CLOSURE.csv',
    'PHASE-US4-ARCHITECTURE-REGRESSION.md',
    'PHASE-US4-WORKED-EXAMPLE-QA.csv',
  ];

  for (const file of files) {
    it(`exists ${file}`, () => {
      expect(existsSync(file)).toBe(true);
    });
  }

  it('worked example QA covers 5 US-4 pilots', () => {
    const csv = readFileSync('PHASE-US4-WORKED-EXAMPLE-QA.csv', 'utf8');
    const lines = csv.trim().split(/\r?\n/).slice(1);
    expect(lines).toHaveLength(5);
    const bad = lines.filter((l) => !/,"PASS",/.test(l));
    expect(bad).toEqual([]);
  });

  it('browser matrix documents 305 viewport runs', () => {
    const raw = readFileSync('PHASE-US4-BROWSER-QA.csv', 'utf8');
    const lines = raw.trim().split('\n').filter((l) => !l.startsWith('#'));
    expect(lines.length - 1).toBe(305);
    const fails = lines.slice(1).filter((l) => /,"\d+","FAIL"/.test(l));
    expect(fails.length).toBe(0);
  });

  it('Group C validation rows all PASS', () => {
    const csv = readFileSync('PHASE-US4-CALCULATOR-VALIDATION.csv', 'utf8');
    const lines = csv.trim().split(/\r?\n/).slice(1);
    expect(lines.length).toBe(4);
    expect(lines.every((l) => l.endsWith(',PASS'))).toBe(true);
  });
});