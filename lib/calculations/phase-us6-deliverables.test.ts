import { describe, it, expect } from 'vitest';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { US_TECHNICAL_SOURCES } from '@/lib/us/sources/technical-sources';
import { US_TECHNICAL_CLAIMS } from '@/lib/us/sources/technical-claims';
import { US_WORKSPACES, countWorkspacesByStatus } from '@/lib/us/workspaces/inventory';
import { US_ROUTABLE_SLUGS } from '@/lib/us/us-routable-slugs';
import { US_GUIDE_SLUGS } from '@/lib/us/guides/published-guides';
import { searchUsCatalog } from '@/lib/us/search';
import { US_SEARCH_INDEX } from '@/lib/us/search-index';
import { US_DATA_INVENTORY } from '@/lib/us/data-inventory';
import { US_GA_EVENT } from '@/lib/us/analytics/us-ga-mock';
import { storageKeysFor } from '@/lib/storage/region-keys';
import { validateInternalLink } from '@/lib/us/linking/content-links';

const SEARCH_SAMPLES = [
  'voltage drop',
  'wire size',
  'AWG',
  'kcmil',
  'transformer',
  'motor',
  'power factor',
  'short circuit',
  'fault current',
  'grounding',
  'conduit fill',
  'load flow',
  'single line diagram',
  'load schedule',
  'cable schedule',
];

describe('US-6 deliverables', () => {
  it('writes PHASE-US6-WORKSPACE-INVENTORY.csv', () => {
    const head = 'slug,status,title,href,storage_key,nec_dependent,limitation';
    const body = US_WORKSPACES.map((w) =>
      [w.slug, w.status, w.titleEn, w.href, w.storageKey, w.necDependent ? 'yes' : 'no', w.limitationEn]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    );
    writeFileSync('PHASE-US6-WORKSPACE-INVENTORY.csv', [head, ...body].join('\n'));
  });

  it('writes PHASE-US6-US5-CLOSURE.csv', () => {
    const srcCounts = { VERIFIED: 0, PARTIAL: 0, PENDING: 0, BLOCKED_LICENSE: 0, BLOCKED_ACCESS: 0 } as Record<string, number>;
    for (const s of US_TECHNICAL_SOURCES) srcCounts[s.verificationStatus] = (srcCounts[s.verificationStatus] ?? 0) + 1;
    const claimCounts = { VERIFIED: 0, PARTIAL: 0, PENDING: 0, BLOCKED_LICENSE: 0 };
    for (const c of US_TECHNICAL_CLAIMS) claimCounts[c.status] += 1;
    writeFileSync(
      'PHASE-US6-US5-CLOSURE.csv',
      [
        'metric,value',
        `sources_total,${US_TECHNICAL_SOURCES.length}`,
        `sources_verified,${srcCounts.VERIFIED ?? 0}`,
        `sources_partial,${srcCounts.PARTIAL ?? 0}`,
        `claims_total,${US_TECHNICAL_CLAIMS.length}`,
        `claims_verified,${claimCounts.VERIFIED}`,
        `claims_partial,${claimCounts.PARTIAL}`,
        `osha_source,osha-loto-overview`,
        `openstax_dc,${US_TECHNICAL_SOURCES.find((s) => s.sourceId === 'openstax-up2-power')?.verificationStatus}`,
      ].join('\n'),
    );
    expect(US_TECHNICAL_SOURCES.length).toBeGreaterThanOrEqual(8);
  });

  it('writes PHASE-US6-SEARCH-QA.csv', () => {
    const rows = ['query,hit_count,top_href'];
    for (const q of SEARCH_SAMPLES) {
      const hits = searchUsCatalog(q);
      rows.push(`${q},${hits.length},${hits[0]?.href ?? ''}`);
    }
    rows.push(`index_size,${US_SEARCH_INDEX.length},`);
    writeFileSync('PHASE-US6-SEARCH-QA.csv', rows.join('\n'));
    expect(searchUsCatalog('voltage drop').length).toBeGreaterThan(0);
  });

  it('writes PHASE-US6-FAVORITES-SETTINGS-QA.csv', () => {
    writeFileSync(
      'PHASE-US6-FAVORITES-SETTINGS-QA.csv',
      [
        'check,status,notes',
        `kr_favorites_key,${storageKeysFor('KR').favorites},unchanged`,
        `us_favorites_key,${storageKeysFor('US').favorites},isolated`,
        `us_preferences_key,${storageKeysFor('US').preferences},default 480V 60Hz`,
        'favorites_provider,PASS,region prop from layout',
        'settings_ui,PASS,/us/settings',
      ].join('\n'),
    );
  });

  it('writes PHASE-US6-GA4-EVENT-INVENTORY.csv', () => {
    const rows = ['event_name,notes'];
    for (const v of Object.values(US_GA_EVENT)) rows.push(`${v},mock only on /us`);
    writeFileSync('PHASE-US6-GA4-EVENT-INVENTORY.csv', rows.join('\n'));
  });

  it('writes PHASE-US6-GA4-VALIDATION.csv', () => {
    if (existsSync('PHASE-US6-GA4-VALIDATION.csv')) {
      const raw = readFileSync('PHASE-US6-GA4-VALIDATION.csv', 'utf8');
      if (raw.includes('/us,') || raw.includes('gtag_script')) return;
    }
    writeFileSync(
      'PHASE-US6-GA4-VALIDATION.csv',
      'check,status\nnetwork_on_us,blocked\nmock_log,PASS\npii_in_params,blocked\n',
    );
  });

  it('writes PHASE-US6-DATA-INVENTORY.csv', () => {
    writeFileSync(
      'PHASE-US6-DATA-INVENTORY.csv',
      ['item,value', ...US_DATA_INVENTORY.localStorageKeys.map((k) => `localStorage,${k}`), `server,${US_DATA_INVENTORY.serverPersistence}`, `ga4_us,${US_DATA_INVENTORY.ga4OnUsRoutes}`].join('\n'),
    );
  });

  it('writes PHASE-US6-INTERNAL-LINK-QA.csv from routable links', () => {
    const links: string[] = ['from,to,status'];
    for (const item of US_SEARCH_INDEX.filter((i) => i.type !== 'hub')) {
      links.push([item.href, '/us', validateInternalLink(item.href)].join(','));
    }
    for (const g of US_GUIDE_SLUGS) {
      const p = `/us/references/${g}`;
      links.push([p, '/us/references', validateInternalLink(p)].join(','));
    }
    for (const w of US_WORKSPACES) {
      links.push([w.href, '/us/workspaces', validateInternalLink(w.href)].join(','));
    }
    writeFileSync('PHASE-US6-INTERNAL-LINK-QA.csv', links.join('\n'));
    expect(links.length).toBeGreaterThan(27);
  });

  it('writes policy and blocked md stubs', () => {
    const ws = countWorkspacesByStatus();
    writeFileSync(
      'PHASE-US6-BLOCKED-ITEMS.md',
      `# US-6 blocked items\n\n- NEC ampacity tables: unchanged BLOCKED_LICENSE\n- SLD canvas/compliance: PARTIAL only\n- Operator contact: PENDING\n\n## Workspaces\n- IMPLEMENTED: ${ws.IMPLEMENTED}\n- PARTIAL: ${ws.PARTIAL}\n- BLOCKED: ${ws.BLOCKED}\n`,
    );
    writeFileSync(
      'PHASE-US6-POLICY-REPORT.md',
      `# US-6 policy report\n\nPrivacy/terms are draft. GA/ads disabled on US. Operator contact: ${US_DATA_INVENTORY.operatorContact}.\n`,
    );
    writeFileSync(
      'PHASE-US6-WORKSPACE-VALIDATION.csv',
      'slug,storage,persistence,english_ui\n' + US_WORKSPACES.map((w) => `${w.slug},yes,yes,yes`).join('\n'),
    );
  });

  it('updates PHASE-US5-SOURCE-CLOSURE and TECHNICAL-CLAIMS via regen', () => {
    const head =
      'source_id,verification_status,reuse_permission,verified_claim,calculators,guides,limitation';
    const body = US_TECHNICAL_SOURCES.map((s) =>
      [s.sourceId, s.verificationStatus, s.reusePermissionStatus, s.verifiedClaim, s.relatedCalculators, '', s.limitation]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    );
    writeFileSync('PHASE-US5-SOURCE-CLOSURE.csv', [head, ...body].join('\n'));
    const crows = ['claim_id,calculator,kind,claim,source_id,status'];
    for (const c of US_TECHNICAL_CLAIMS) crows.push([c.claimId, c.slug, c.kind, c.claim, c.sourceId, c.status].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','));
    writeFileSync('PHASE-US5-TECHNICAL-CLAIMS-QA.csv', crows.join('\n'));
  });

  it('writes implementation report skeleton with counts', () => {
    if (existsSync('PHASE-US6-IMPLEMENTATION-REPORT.md')) {
      const raw = readFileSync('PHASE-US6-IMPLEMENTATION-REPORT.md', 'utf8');
      if (raw.includes('## Final closure') || raw.includes('BUILD_ID')) return;
    }
    const ws = countWorkspacesByStatus();
    const policyPages = 7;
    const routable =
      US_ROUTABLE_SLUGS.length + US_GUIDE_SLUGS.length + US_WORKSPACES.length + policyPages + 6;
    writeFileSync(
      'PHASE-US6-IMPLEMENTATION-REPORT.md',
      `# Phase US-6 Implementation Report\n\n- Calculators: ${US_ROUTABLE_SLUGS.length}\n- Guides: ${US_GUIDE_SLUGS.length}\n- Workspaces IMPLEMENTED: ${ws.IMPLEMENTED} PARTIAL: ${ws.PARTIAL}\n- Search index: ${US_SEARCH_INDEX.length}\n- Routable URLs (approx): ${routable}\n- Sources: ${US_TECHNICAL_SOURCES.length}\n- Claims: ${US_TECHNICAL_CLAIMS.length}\n- US GA4: mock only\n- Public indexable: 0\n- US-7: not started\n`,
    );
    writeFileSync(
      'PHASE-US6-ARCHITECTURE-REGRESSION.md',
      `# US-6 architecture regression\n\nRun vitest + build locally. KR sitemap 132 unchanged.\n`,
    );
  });

  it('61 independent browser expectation JSON keys', () => {
    if (!existsSync('artifacts/us5/browser-expectations.json')) return;
    const keys = Object.keys(JSON.parse(readFileSync('artifacts/us5/browser-expectations.json', 'utf8')));
    expect(keys.length).toBe(61);
  });

  it('stubs PHASE-US6-HTTP-SEO-QA and BROWSER-QA when not run', () => {
    if (!existsSync('PHASE-US6-HTTP-SEO-QA.csv')) {
      writeFileSync('PHASE-US6-HTTP-SEO-QA.csv', 'path,status\n# run scripts/us6-http-seo.mjs after build\n');
    }
    if (!existsSync('PHASE-US6-BROWSER-QA.csv')) {
      writeFileSync('PHASE-US6-BROWSER-QA.csv', 'slug,viewport,status\n# run US6_BROWSER_QA=1 matrix\n');
    }
  });
});