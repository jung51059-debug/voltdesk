import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  buildUsRouteInventory,
  countUsRoutesByKind,
  usRoutablePageCount,
  usSearchIndexRecordCount,
} from '@/lib/us/route-inventory';
import { US_ROUTABLE_SLUGS } from '@/lib/us/us-routable-slugs';
import { getHubCategories } from '@/lib/data/categories';

describe('US-6 route inventory', () => {
  const rows = buildUsRouteInventory();

  it('counts match expected structure', () => {
    expect(US_ROUTABLE_SLUGS.length).toBe(61);
    expect(usRoutablePageCount()).toBe(
      6 + 61 + 10 + 4 + getHubCategories().length + 9,
    );
    expect(rows.filter((r) => r.kind === 'negative_404').length).toBe(2);
  });

  it('writes PHASE-US6-ROUTE-INVENTORY.csv and routes-summary.json', () => {
    const head = 'path,kind,slug,indexable,notes';
    const body = rows.map((r) => [r.path, r.kind, r.slug, r.indexable ? 'yes' : 'no', r.notes].join(','));
    writeFileSync('PHASE-US6-ROUTE-INVENTORY.csv', [head, ...body].join('\n'));
    mkdirSync('artifacts/us6', { recursive: true });
    writeFileSync(
      'artifacts/us6/routes-summary.json',
      JSON.stringify(
        {
          routablePages: usRoutablePageCount(),
          totalWith404: rows.length,
          searchIndexRecords: usSearchIndexRecordCount(),
          byKind: countUsRoutesByKind(rows),
          categorySlugs: getHubCategories().map((c) => c.slug),
        },
        null,
        2,
      ),
    );
    expect(usSearchIndexRecordCount()).toBeGreaterThan(80);
  });
});