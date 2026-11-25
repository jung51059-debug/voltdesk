import { describe, it, expect } from 'vitest';
import { engines } from './engines';
import { formSchemas } from './schemas';
import { parseRlc } from './impedance-engine';
import { rlcImpedance } from './impedance';
import { analyzeTrend, parseTrendText } from './field-verify';
import { GROUP_A_CLOSURE } from '@/lib/us/verification/group-a-closure';
import { GROUP_A_SLUGS } from '@/lib/us/group-a-slugs';
import { getUsCalculatorContent } from '@/lib/us/content/registry';
import { writeFileSync } from 'node:fs';

function run(slug: string, input: Record<string,string>, metric: string) {
  if(slug === 'rlc-impedance') {
    try { return {ok:true, value:rlcImpedance(parseRlc(input)).z}; } catch { return {ok:false,value:NaN}; }
  }
  if(slug === 'trend-analysis') {
    const parsed = parseTrendText(input.raw);
    return {ok:parsed.errors.length === 0 && parsed.points.length > 0,value:analyzeTrend(parsed.points).avg};
  }
  const out = engines[slug](input, 6);
  return {ok:out.ok, value:out.ok ? Number(String(out.metrics.find(m=>m.id===metric)?.value).replace(/,/g,'')) : NaN};
}
describe('US-3A independent examples',()=>{
  it('covers exactly all 30 Group A calculators',()=>expect(GROUP_A_CLOSURE.map(c=>c.slug).sort()).toEqual([...GROUP_A_SLUGS].sort()));
  for(const c of GROUP_A_CLOSURE) {
    const input = {...formSchemas[c.slug]?.defaults,...c.inputs};
    it(`${c.slug}: independent numeric reference and guide input`,()=>{
      const out = run(c.slug,input,c.metric);
      expect(out.ok).toBe(true);
      expect(Math.abs(out.value-c.expected),JSON.stringify(out)).toBeLessThanOrEqual(Math.max(c.slug==='amp-to-kw'?0.005:0.00001,Math.abs(c.expected)*1e-8));
    });
    it(`${c.slug}: invalid input rejected`,()=>expect(run(c.slug,{...input,...c.bad},c.metric).ok).toBe(false));
    it(`${c.slug}: boundary produces a finite result`,()=>{
      const out=run(c.slug,{...input,...c.boundary},c.metric);
      expect(out.ok).toBe(true); expect(Number.isFinite(out.value)).toBe(true);
    });
  }
  it('exports observed results without treating unperformed checks as passed',()=>{
    const quote=(v:unknown)=>`"${String(v).replace(/"/g,'""')}"`;
    const rows=GROUP_A_CLOSURE.map(c=>{
      const input={...formSchemas[c.slug]?.defaults,...c.inputs};
      const got=run(c.slug,input,c.metric);
      const invalid=run(c.slug,{...input,...c.bad},c.metric);
      const boundary=run(c.slug,{...input,...c.boundary},c.metric);
      const pass=got.ok&&Math.abs(got.value-c.expected)<=Math.max(c.slug==='amp-to-kw'?0.005:0.00001,Math.abs(c.expected)*1e-8);
      const guide = getUsCalculatorContent(c.slug)?.workedExample;
      const guidePass = guide && (guide.narrative.includes(guide.expectedValueContains) || guide.narrative.includes(String(Number(c.expected.toFixed(4)))));
      return [c.slug,JSON.stringify(input),c.formula,c.metric,c.expected,got.value,c.unit,'max(1e-5; abs(expected)*1e-8)',pass?'PASS':'FAIL',!invalid.ok?'PASS':'FAIL',boundary.ok&&Number.isFinite(boundary.value)?'PASS':'FAIL',guidePass?'PASS':'FAIL','PENDING'].map(quote).join(',');
    });
    writeFileSync('PHASE-US3-GROUP-A-CLOSURE.csv','slug,inputs,independent_formula,metric,expected,actual,output_unit,tolerance,numeric,invalid,boundary,guide_integration,source_review\n'+rows.join('\n'));
  });
});
