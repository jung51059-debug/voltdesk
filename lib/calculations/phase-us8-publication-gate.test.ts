import {it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
import inventory from '@/lib/us/release-allowlist.json';
import {resolveUsReleaseMode} from '@/lib/us/release-environment.mjs';
import {usAccessDecision,usNavigationTarget,usRuntimeMode} from '@/lib/us/release-gate';
import {US_FORMULA_REVIEWS} from '@/lib/us/sources/formula-review';
import {US_PUBLISHED_GUIDES} from '@/lib/us/guides/published-guides';
import {proxy} from '../../proxy';
it('allowlist is exactly the reviewed technical surface, including PARTIAL SLD and excluding load flow',()=>{
 const ready=inventory.filter(r=>r.status.startsWith('READY_'));
 expect(ready).toHaveLength(74);expect(ready.filter(r=>r.proposedIndex)).toHaveLength(46);
 expect(ready.filter(r=>r.kind==='calculator').map(r=>r.path.split('/').pop()).sort()).toEqual(US_FORMULA_REVIEWS.filter(r=>r.status==='VERIFIED').map(r=>r.slug).sort());
 expect(ready.filter(r=>r.kind==='guide').map(r=>r.path.split('/').pop()).sort()).toEqual(US_PUBLISHED_GUIDES.filter(r=>r.verificationStatus==='VERIFIED').map(r=>r.slug).sort());
 expect(ready.filter(r=>r.kind==='workspace').map(r=>r.path)).toEqual(['/us/workspaces/sld','/us/workspaces/load-schedule','/us/workspaces/cable-schedule']);
});
it('106 routes enforce the 74/32 split after US9B privacy closure server-side; disabled denies all and private review includes all',()=>{
 for(const row of inventory){expect(usAccessDecision(row.path,'public').allowed,row.path).toBe(row.status.startsWith('READY_'));expect(usAccessDecision(row.path,'disabled').allowed).toBe(false);expect(usAccessDecision(row.path,'protected-preview').allowed).toBe(true);}
});
it('mode resolution requires deployment-controlled project/environment/protection markers',()=>{
 expect(resolveUsReleaseMode({})).toBe('disabled');
 expect(resolveUsReleaseMode({VERCEL:'1',VERCEL_ENV:'preview',AMPORY_US_PREVIEW_PROTECTED:'true'})).toBe('disabled');
 const base={VERCEL:'1',VERCEL_PROJECT_ID:'prj_yiJVIAEYHjzA3PALYFjtdfSRFW7a',VERCEL_ENV:'preview'};
 expect(resolveUsReleaseMode(base)).toBe('disabled');expect(resolveUsReleaseMode({...base,AMPORY_US_PREVIEW_PROTECTED:'true'})).toBe('protected-preview');
 expect(resolveUsReleaseMode({...base,AMPORY_US_LOCAL_MODE:'public'})).toBe('disabled');
 expect(resolveUsReleaseMode({...base,VERCEL_ENV:'production'})).toBe('disabled');
 expect(resolveUsReleaseMode({...base,VERCEL_ENV:'production',AMPORY_US_PUBLIC_ACCESS:'true'})).toBe('public');
});
it('encoded paths and unknown endpoints cannot bypass the allowlist',()=>{
 for(const path of ['/%75s/tools/electrical/solar-pv','/us%2ftools/electrical/solar-pv','/us%252ftools/electrical/solar-pv','/us\\tools/electrical/solar-pv','/us//tools/electrical/solar-pv','/us/unknown'])expect(usAccessDecision(path,'public').allowed,path).toBe(false);
 expect(usAccessDecision('/tools/electrical/solar-pv','disabled')).toEqual({isUs:false,allowed:true});
});
it('forged headers, query and cookies cannot grant access to a blocked route',()=>{
 vi.stubEnv('AMPORY_US_BUILD_MODE','public');try{
  const request=new NextRequest('https://example.invalid/us/tools/electrical/solar-pv?preview=true&mode=protected-preview',{headers:{'x-ampory-pathname':'/us','x-ampory-region':'KR','x-ampory-mode':'protected-preview','x-vercel-protection-bypass':'not-auth','cookie':'AMPORY_US_BUILD_MODE=protected-preview'}});
  expect(proxy(request).status).toBe(404);expect(proxy(request).headers.get('x-robots-tag')).toContain('noindex');
 }finally{vi.unstubAllEnvs();}
});
it('held navigation targets fall back without modifying regional inventories',()=>{
 expect(usNavigationTarget('/us/workspaces/load-flow','public')).toBe('/us/workspaces');expect(usNavigationTarget('/us/privacy','public')).toBe('/us/privacy');expect(usNavigationTarget('/us/references/us-voltage-systems','public')).toBe('/us/references');expect(usNavigationTarget('/tools/electrical/soil-resistivity','public')).toBe('/tools/electrical/soil-resistivity');
});
it('a protected preview artifact fails closed after an accidental production promotion',()=>{
 vi.stubEnv('AMPORY_US_BUILD_MODE','protected-preview');try{expect(usRuntimeMode({VERCEL:'1',VERCEL_ENV:'production'})).toBe('disabled');expect(usRuntimeMode({VERCEL:'1',VERCEL_ENV:'preview'})).toBe('protected-preview');}finally{vi.unstubAllEnvs();}
});
it('public search filters technical and policy holds while preserving raw inventories',async()=>{
 vi.stubEnv('AMPORY_US_BUILD_MODE','public');vi.resetModules();try{const {US_SEARCH_INDEX}=await import('@/lib/us/search-index');expect(US_SEARCH_INDEX).toHaveLength(63);for(const row of US_SEARCH_INDEX)expect(usAccessDecision(row.href,'public').allowed).toBe(true);}finally{vi.unstubAllEnvs();vi.resetModules();}
});
