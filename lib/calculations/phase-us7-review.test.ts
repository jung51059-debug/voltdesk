import { expect,it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { US_FORMULA_REVIEWS } from '@/lib/us/sources/formula-review';
import { US_TECHNICAL_SOURCES } from '@/lib/us/sources/technical-sources';
import { US_TECHNICAL_CLAIMS } from '@/lib/us/sources/technical-claims';
import { buildUsRouteInventory } from '@/lib/us/route-inventory';
import { US_ROUTABLE_SLUGS } from '@/lib/us/us-routable-slugs';
import { US_PUBLISHED_GUIDES } from '@/lib/us/guides/published-guides';
import { US_SEARCH_INDEX } from '@/lib/us/search-index';
import { searchUsCatalog } from '@/lib/us/search';
import { getUsCalculatorContent } from '@/lib/us/content/registry';
import { buildBrowserIndependentExpectations } from '@/lib/us/verification/browser-independent-expectations';
import { GROUP_A_CLOSURE } from '@/lib/us/verification/group-a-closure';
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { GROUP_C_TOOLS } from '@/lib/us/group-c-tools';
import { US_WORKSPACES } from '@/lib/us/workspaces/inventory';
import { sitemapEntries } from '@/lib/seo';
import { getPublishedTools } from '@/lib/data/tools';
import { articles } from '@/lib/data/articles';
it('US-7 maps every actual calculator to a scoped review without universal source approval',()=>{
  expect(US_FORMULA_REVIEWS.map(r=>r.slug).sort()).toEqual([...US_ROUTABLE_SLUGS].sort());
  for(const r of US_FORMULA_REVIEWS) for(const id of r.sourceIds) expect(US_TECHNICAL_SOURCES.some(s=>s.sourceId===id),`${r.slug}: ${id}`).toBe(true);
  const sources=new Map(US_TECHNICAL_SOURCES.map(s=>[s.sourceId,s]));
  expect(sources.get('openstax-up2-power')?.sourceUrl).toContain('/9-5-');
  expect(sources.get('openstax-up2-ac')?.verifiedClaim).not.toContain('three-phase');
  expect(sources.get('nfpa-nec-2023')?.verificationStatus).toBe('BLOCKED_LICENSE');
  expect(US_FORMULA_REVIEWS.find(r=>r.slug==='cable-ampacity')?.status).toBe('VERIFIED');
  expect(US_TECHNICAL_CLAIMS.find(c=>c.claimId==='claim-ampacity-user')?.sourceId).not.toBe('nfpa-nec-2023');
});
it('US-7 exports current source facts for build-bound HTTP/browser audits',()=>{
  const queries=['Fault current','Short circuit current','Available fault current','Short-circuit calculation','Voltage drop','Wire gauge','Conductor size','Grounding','Bonding','Ampacity','Single-line diagram','Load flow','Load schedule','Cable schedule'];
  writeFileSync('artifacts/us7/review-data.json',JSON.stringify({
    generatedAt:new Date().toISOString(),routes:buildUsRouteInventory(),slugs:US_ROUTABLE_SLUGS,reviews:US_FORMULA_REVIEWS,sources:US_TECHNICAL_SOURCES,claims:US_TECHNICAL_CLAIMS,
    calculators:US_ROUTABLE_SLUGS.map(slug=>({slug,content:getUsCalculatorContent(slug),formula:GROUP_A_CLOSURE.find(c=>c.slug===slug)?.formula??GROUP_B_TOOLS.find(c=>c.slug===slug)?.formula??GROUP_C_TOOLS.find(c=>c.slug===slug)?.formula??'See dedicated physics model and formula guide'})),
    groupAExamples:GROUP_A_CLOSURE,
    guides:US_PUBLISHED_GUIDES,workspaces:US_WORKSPACES,index:US_SEARCH_INDEX,search:queries.map(query=>({query,hits:searchUsCatalog(query)})),expectations:buildBrowserIndependentExpectations(),
    kr:{sitemap:sitemapEntries(),published:getPublishedTools().map(t=>({slug:t.slug,path:t.href})),articles:articles.length},
  },null,2));
});
