import { describe, expect, it } from 'vitest';
import { US_ROUTABLE_SLUGS } from '@/lib/us/us-routable-slugs';
import { getUsCalculatorContent } from '@/lib/us/content/registry';

const REQUIRED_KEYS = [
  'overview',
  'howToUse',
  'workedExample',
  'understandingResults',
  'practicalApplications',
  'commonMistakes',
  'limitations',
  'faqs',
  'references',
] as const;

describe('US-5 calculator English content (61)', () => {
  expect(US_ROUTABLE_SLUGS).toHaveLength(61);

  for (const slug of US_ROUTABLE_SLUGS) {
    it(`${slug}: guide sections populated`, () => {
      const c = getUsCalculatorContent(slug);
      expect(c, slug).toBeTruthy();
      if (!c) return;
      for (const key of REQUIRED_KEYS) {
        expect(c[key], key).toBeTruthy();
      }
      expect(c.howToUse.length).toBeGreaterThanOrEqual(3);
      expect(c.faqs.length).toBeGreaterThanOrEqual(2);
      expect(c.workedExample.expectedValueContains.length).toBeGreaterThan(0);
      expect(c.overview).not.toMatch(/[\u3131-\uD79D]/);
    });
  }
});