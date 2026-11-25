import { describe, expect, it } from 'vitest';
import { GROUP_C_TOOLS } from '@/lib/us/group-c-tools';
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { US_CABLE_TOOLS } from '@/lib/us/cable-tools';
import { US_NEW_TOOLS } from '@/lib/us/new-tools';
import { GROUP_A_SLUGS } from '@/lib/us/group-a-slugs';
import { sitemapEntries } from '@/lib/seo';
import { getPublishedTools } from '@/lib/data/tools';

describe('US-4 acceptance inventory', () => {
  it('KR baseline unchanged', () => {
    expect(getPublishedTools()).toHaveLength(71);
    expect(new Set(sitemapEntries()).size).toBe(132);
  });

  it('US routable after US-4 pilots', () => {
    const total = 30 + GROUP_B_TOOLS.length + US_CABLE_TOOLS.length + US_NEW_TOOLS.length + GROUP_C_TOOLS.length + 1;
    expect(total).toBe(61);
    expect(GROUP_A_SLUGS).toHaveLength(30);
  });
});