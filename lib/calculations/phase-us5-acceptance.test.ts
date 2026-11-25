import { describe, expect, it } from 'vitest';
import { articles } from '@/lib/data/articles';
import { getPublishedTools } from '@/lib/data/tools';
import { sitemapEntries } from '@/lib/seo';
import { US_GUIDE_SLUGS } from '@/lib/us/guides/published-guides';
import { KO_REFERENCE_ANALYSIS } from '@/lib/us/guides/ko-reference-inventory';
import { usRoutableCount } from '@/lib/us/us-routable-slugs';
import { isNecTableEmbedAllowed } from '@/lib/us/regulation/guard';

describe('US-5 acceptance', () => {
  it('KR baseline unchanged', () => {
    expect(getPublishedTools()).toHaveLength(71);
    expect(new Set(sitemapEntries()).size).toBe(132);
    expect(articles).toHaveLength(34);
  });

  it('US routable calculators', () => {
    expect(usRoutableCount()).toBe(61);
  });

  it('US guides preview', () => {
    expect(US_GUIDE_SLUGS.length).toBeGreaterThanOrEqual(8);
    expect(KO_REFERENCE_ANALYSIS).toHaveLength(34);
  });

  it('Type 3 NEC disabled', () => {
    expect(isNecTableEmbedAllowed('2023')).toBe(false);
  });
});