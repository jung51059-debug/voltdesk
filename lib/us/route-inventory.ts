import { getHubCategories } from '@/lib/data/categories';
import { US_GUIDE_SLUGS } from '@/lib/us/guides/published-guides';
import { US_SEARCH_INDEX } from '@/lib/us/search-index';
import { US_WORKSPACES } from '@/lib/us/workspaces/inventory';
import { US_ROUTABLE_SLUGS } from '@/lib/us/us-routable-slugs';
import { usCalculatorPath } from '@/lib/us/us-calculator-path';

export type UsRouteKind =
  | 'home'
  | 'calculator'
  | 'workspace'
  | 'workspace_hub'
  | 'guide'
  | 'guide_hub'
  | 'calculator_hub'
  | 'category'
  | 'search'
  | 'favorites'
  | 'settings'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'disclaimer'
  | 'sources'
  | 'negative_404';

export type UsRouteRow = {
  path: string;
  kind: UsRouteKind;
  slug: string;
  indexable: boolean;
  notes: string;
};

const SERVICE_PAGES: { path: string; kind: UsRouteRow['kind']; slug: string }[] = [
  { path: '/us/search', kind: 'search', slug: 'search' },
  { path: '/us/favorites', kind: 'favorites', slug: 'favorites' },
  { path: '/us/settings', kind: 'settings', slug: 'settings' },
  { path: '/us/about', kind: 'about', slug: 'about' },
  { path: '/us/contact', kind: 'contact', slug: 'contact' },
  { path: '/us/privacy', kind: 'privacy', slug: 'privacy' },
  { path: '/us/terms', kind: 'terms', slug: 'terms' },
  { path: '/us/disclaimer', kind: 'disclaimer', slug: 'disclaimer' },
  { path: '/us/sources', kind: 'sources', slug: 'sources' },
];

const NEGATIVE_404: UsRouteRow[] = [
  { path: '/us/tools/electrical/bogus-slug-404-test', kind: 'negative_404', slug: 'bogus-calc', indexable: false, notes: 'expect 404' },
  { path: '/us/references/bogus-guide-404', kind: 'negative_404', slug: 'bogus-guide', indexable: false, notes: 'expect 404' },
];

export function buildUsRouteInventory(): UsRouteRow[] {
  const rows: UsRouteRow[] = [
    { path: '/us', kind: 'home', slug: 'home', indexable: false, notes: '' },
    { path: '/us/tools', kind: 'calculator_hub', slug: 'tools', indexable: false, notes: '' },
    { path: '/us/tools/electrical', kind: 'calculator_hub', slug: 'electrical-hub', indexable: false, notes: '' },
    { path: '/us/tools/facility', kind: 'calculator_hub', slug: 'facility-hub', indexable: false, notes: '' },
    { path: '/us/references', kind: 'guide_hub', slug: 'references', indexable: false, notes: '' },
    { path: '/us/workspaces', kind: 'workspace_hub', slug: 'workspaces', indexable: false, notes: '' },
  ];

  for (const slug of US_ROUTABLE_SLUGS) {
    rows.push({
      path: usCalculatorPath(slug),
      kind: 'calculator',
      slug,
      indexable: false,
      notes: '',
    });
  }

  for (const slug of US_GUIDE_SLUGS) {
    rows.push({ path: `/us/references/${slug}`, kind: 'guide', slug, indexable: false, notes: '' });
  }

  for (const ws of US_WORKSPACES) {
    rows.push({ path: ws.href, kind: 'workspace', slug: ws.slug, indexable: false, notes: ws.status });
  }

  for (const c of getHubCategories()) {
    rows.push({
      path: `/us/tools/categories/${c.slug}`,
      kind: 'category',
      slug: c.slug,
      indexable: false,
      notes: c.nameEn,
    });
  }

  for (const s of SERVICE_PAGES) {
    rows.push({ path: s.path, kind: s.kind, slug: s.slug, indexable: false, notes: '' });
  }

  return [...rows, ...NEGATIVE_404];
}

export function countUsRoutesByKind(rows = buildUsRouteInventory()) {
  const m = new Map<UsRouteKind, number>();
  for (const r of rows) m.set(r.kind, (m.get(r.kind) ?? 0) + 1);
  return Object.fromEntries(m) as Record<UsRouteKind, number>;
}

export function usRoutablePageCount(): number {
  return buildUsRouteInventory().filter((r) => r.kind !== 'negative_404').length;
}

export function usSearchIndexRecordCount(): number {
  return US_SEARCH_INDEX.length;
}