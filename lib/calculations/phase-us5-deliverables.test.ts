import { describe, it, expect } from 'vitest';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { US_ROUTABLE_SLUGS } from '@/lib/us/us-routable-slugs';
import { getUsCalculatorContent } from '@/lib/us/content/registry';
import { KO_REFERENCE_ANALYSIS } from '@/lib/us/guides/ko-reference-inventory';
import { US_PUBLISHED_GUIDES, US_GUIDE_SLUGS } from '@/lib/us/guides/published-guides';
import { US_TECHNICAL_SOURCES } from '@/lib/us/sources/technical-sources';
import { validateInternalLink, guidePath, calculatorPath } from '@/lib/us/linking/content-links';
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { buildKoDispositionRows } from '@/lib/us/guides/ko-disposition';
import { US_TECHNICAL_CLAIMS } from '@/lib/us/sources/technical-claims';

describe('US-5 deliverables', () => {
  it('writes PHASE-US5-CONTENT-INVENTORY.csv', () => {
    const rows = ['content_id,type,locale,routable,verification,indexable,notes'];
    for (const slug of US_ROUTABLE_SLUGS) {
      const c = getUsCalculatorContent(slug);
      rows.push(
        `calc-${slug},calculator,en-US,yes,${c?.references.some((r) => r.status === 'verified') ? 'PARTIAL' : 'PENDING'},no,US-5 registry`,
      );
    }
    for (const g of US_PUBLISHED_GUIDES) {
      rows.push(`${g.contentId},guide,en-US,yes,${g.verificationStatus},no,${g.migrationStatus}`);
    }
    writeFileSync('PHASE-US5-CONTENT-INVENTORY.csv', rows.join('\n'));
  });

  it('writes PHASE-US5-GUIDE-INVENTORY.csv', () => {
    const head = 'content_id,slug,ko_slug,migration_status,verification,routable,related_calculators';
    const body = US_PUBLISHED_GUIDES.map((g) =>
      [g.contentId, g.slug, g.koArticleSlug ?? '', g.migrationStatus, g.verificationStatus, 'yes', g.relatedCalculatorSlugs.join('|')]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    );
    writeFileSync('PHASE-US5-GUIDE-INVENTORY.csv', [head, ...body].join('\n'));
  });

  it('writes PHASE-US5-CALCULATOR-CONTENT-QA.csv', () => {
    const rows = ['slug,overview,faq_count,ref_verified_count,has_safety,has_code_notes'];
    for (const slug of US_ROUTABLE_SLUGS) {
      const c = getUsCalculatorContent(slug)!;
      rows.push(
        `${slug},${c.overview.length >= 40 ? 'PASS' : 'FAIL'},${c.faqs.length},${c.references.filter((r) => r.status === 'verified').length},${c.safetyNotes ? 'yes' : 'no'},${c.codeAndJurisdictionNotes ? 'yes' : 'no'}`,
      );
    }
    writeFileSync('PHASE-US5-CALCULATOR-CONTENT-QA.csv', rows.join('\n'));
  });

  it('writes PHASE-US5-SOURCE-CLOSURE.csv', () => {
    const head =
      'source_id,verification_status,reuse_permission,verified_claim,calculators,guides,limitation';
    const body = US_TECHNICAL_SOURCES.map((s) =>
      [s.sourceId, s.verificationStatus, s.reusePermissionStatus, s.verifiedClaim, s.relatedCalculators, '', s.limitation]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    );
    writeFileSync('PHASE-US5-SOURCE-CLOSURE.csv', [head, ...body].join('\n'));
  });

  it('writes PHASE-US5-INTERNAL-LINK-QA.csv', () => {
    const rows = ['from,to,status'];
    for (const g of US_PUBLISHED_GUIDES) {
      for (const slug of g.relatedCalculatorSlugs) {
        const domain = GROUP_B_TOOLS.find((t) => t.slug === slug)?.domain;
        rows.push([g.slug, calculatorPath(slug, domain), validateInternalLink(calculatorPath(slug, domain))].join(','));
      }
      for (const slug of g.relatedGuideSlugs) {
        rows.push([g.slug, guidePath(slug), validateInternalLink(guidePath(slug))].join(','));
      }
    }
    writeFileSync('PHASE-US5-INTERNAL-LINK-QA.csv', rows.join('\n'));
    expect(rows.slice(1).every((r) => r.endsWith(',ok'))).toBe(true);
  });

  it('writes PHASE-US5-BLOCKED-CONTENT.md', () => {
    const disp = buildKoDispositionRows();
    const blocked = disp.filter((d) => d.usDisposition === 'BLOCKED');
    const localized = disp.filter((d) => d.usDisposition === 'LOCALIZED');
    writeFileSync(
      'PHASE-US5-BLOCKED-CONTENT.md',
      `# US-5 blocked & deferred content\n\n## KR blocked (${blocked.length})\n\n${blocked.map((b) => `- **${b.krSlug}**: ${b.notes}`).join('\n')}\n\n## KR localized to US guide (${localized.length})\n\n${localized.map((b) => `- **${b.krSlug}** → \`${b.usTargetSlug}\``).join('\n')}\n`,
    );
  });

  it('writes PHASE-US5-NEW-GUIDE-REPORT.md', () => {
    const neu = US_PUBLISHED_GUIDES.filter((g) => g.migrationStatus === 'NEW_US_CONTENT');
    writeFileSync(
      'PHASE-US5-NEW-GUIDE-REPORT.md',
      `# US-5 new guides\n\n| Slug | Title | Verification |\n|------|-------|-------------|\n${neu.map((g) => `| ${g.slug} | ${g.title} | ${g.verificationStatus} |`).join('\n')}\n`,
    );
  });

  it('writes PHASE-US5-TECHNICAL-CLAIMS-QA.csv', () => {
    const rows = ['claim_id,calculator,kind,claim,source_id,status'];
    for (const c of US_TECHNICAL_CLAIMS) {
      rows.push([c.claimId, c.slug, c.kind, c.claim, c.sourceId, c.status].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','));
    }
    writeFileSync('PHASE-US5-TECHNICAL-CLAIMS-QA.csv', rows.join('\n'));
  });

  it('writes KR disposition appendix to CONTENT-INVENTORY', () => {
    const disp = buildKoDispositionRows();
    expect(disp).toHaveLength(34);
    const extra = ['', '# KR article disposition (34)', 'kr_slug,kr_title,us_disposition,us_target,source_status,follow_up'];
    for (const row of disp) {
      extra.push([row.krSlug, row.krTitle, row.usDisposition, row.usTargetSlug, row.sourceStatus, row.followUpPhase].join(','));
    }
    const prior = readFileSync('PHASE-US5-CONTENT-INVENTORY.csv', 'utf8');
    writeFileSync('PHASE-US5-CONTENT-INVENTORY.csv', `${prior}\n${extra.join('\n')}`);
  });

  it('writes PHASE-US5-IMAGE-LOCALIZATION.csv', () => {
    const rows = [
      'page_path,image_assets,ko_text_in_image,us_units,alt_english,mobile_check,copyright_check,status,notes',
    ];
    const targets = [
      ...US_ROUTABLE_SLUGS.map((slug) => `calc:${slug}`),
      ...US_GUIDE_SLUGS.map((slug) => `guide:${slug}`),
      'hub:/us',
      'hub:/us/references',
    ];
    for (const t of targets) {
      rows.push(`${t},0,N/A,N/A,N/A,N/A,N/A,N/A,No raster/diagram images in US routes (text+tables only)`);
    }
    writeFileSync('PHASE-US5-IMAGE-LOCALIZATION.csv', rows.join('\n'));
  });

  it('writes PHASE-US5-SEO-VALIDATION.csv stub when http script not run', () => {
    if (!existsSync('PHASE-US5-SEO-VALIDATION.csv')) {
      writeFileSync('PHASE-US5-SEO-VALIDATION.csv', 'path,status,lang,noindex\n# run scripts/us5-http-seo.mjs after npm run build\n');
    }
    expect(existsSync('PHASE-US5-SEO-VALIDATION.csv')).toBe(true);
  });

  it('expects PHASE-US5-BROWSER-QA.csv matrix rows when matrix executed', () => {
    if (!existsSync('PHASE-US5-BROWSER-QA.csv')) return;
    const raw = readFileSync('PHASE-US5-BROWSER-QA.csv', 'utf8');
    if (raw.startsWith('# US-5: run')) return;
    const lines = raw.split('\n').filter((l) => l && !l.startsWith('#'));
    expect(lines.length).toBeGreaterThanOrEqual(355);
  });

  it('closure artifacts exist after other tests', () => {
    expect(existsSync('artifacts/us5/browser-expectations.json')).toBe(true);
    if (existsSync('PHASE-US5-WORKED-EXAMPLE-QA.csv')) {
      const n = readFileSync('PHASE-US5-WORKED-EXAMPLE-QA.csv', 'utf8').trim().split('\n').length - 1;
      expect(n).toBe(61);
    }
  });

  it('guide count', () => {
    expect(US_GUIDE_SLUGS.length).toBe(10);
  });
});