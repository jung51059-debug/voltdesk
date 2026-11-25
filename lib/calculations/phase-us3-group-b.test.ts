import { it, describe, expect } from 'vitest';
import { GROUP_B_TOOLS, groupBDefaults, runGroupB } from '@/lib/us/group-b-tools';
import { convertRealPower, convertEnergy, convertFlow, type RealPowerUnit, type EnergyUnit, type FlowUnit } from '@/lib/us/units';
import { writeFileSync } from 'node:fs';
const number=(out:ReturnType<typeof runGroupB>,id:string)=>out.ok?Number(String(out.metrics.find(m=>m.id===id)?.value).replace(/,/g,'')):NaN;
describe('US-3 Group B independently derived examples',()=>{
  for(const spec of GROUP_B_TOOLS) {
    const values=groupBDefaults(spec);
    it(`${spec.slug}: arithmetic example and English output`,()=>{
      const out=runGroupB(spec,values,6);
      expect(out.ok,JSON.stringify(out)).toBe(true);
      expect(number(out,spec.checkMetric)).toBeCloseTo(spec.expected,spec.slug==='energy-cost'?0:4);
      expect(JSON.stringify(out)).not.toMatch(/[\u3131-\uD79D]/);
    });
    it(`${spec.slug}: unit changes preserve physical inputs and results`,()=>{
      for(const field of spec.fields.filter(f=>f.units)) {
        for(const unit of field.units!) {
          let n=Number(field.value);
          if(field.kind==='power') n=convertRealPower(n,field.unit as RealPowerUnit,unit as RealPowerUnit);
          if(field.kind==='energy') n=convertEnergy(n,field.unit as EnergyUnit,unit as EnergyUnit);
          if(field.kind==='flow') n=convertFlow(n,field.unit as FlowUnit,unit as FlowUnit);
          const out=runGroupB(spec,{...values,[field.id]:String(n),[`${field.id}Unit`]:unit},6);
          expect(out.ok,JSON.stringify(out)).toBe(true);
          expect(number(out,spec.checkMetric)).toBeCloseTo(spec.expected,spec.slug==='energy-cost'?0:4);
        }
      }
    });
    it(`${spec.slug}: blank and negative inputs rejected`,()=>{
      const id=spec.fields[0].id;
      for(const value of ['','-1','bad','Infinity']) expect(runGroupB(spec,{...values,[id]:value}).ok).toBe(false);
    });
  }
  it('vfd-sizing: kW path labeled kW while drive pick uses kVA current path',()=>{
    const spec=GROUP_B_TOOLS.find(t=>t.slug==='vfd-sizing')!;
    const out=runGroupB(spec,groupBDefaults(spec),6);
    expect(out.ok).toBe(true);
    if(!out.ok) return;
    const sp=out.metrics.find(m=>m.id==='sp');
    const si=out.metrics.find(m=>m.id==='si');
    expect(sp?.unit).toBe('kW');
    expect(si?.unit).toBe('kVA');
    expect(number(out,'s')).toBeCloseTo(number(out,'si')!,4);
    expect(number(out,'sp')).toBeCloseTo(33,4);
  });
  it('exports actual engine comparisons',()=>{
    writeFileSync('artifacts/us3/group-b-validation.json',JSON.stringify(GROUP_B_TOOLS.map(spec=>{
      const values=groupBDefaults(spec),out=runGroupB(spec,values,6),actual=number(out,spec.checkMetric);
      return {slug:spec.slug,inputs:values,formula:spec.formula,metric:spec.checkMetric,expected:spec.expected,actual,status:out.ok&&Math.abs(actual-spec.expected)<0.0001?'PASS':'FAIL',source:spec.sourceStatus};
    }),null,2));
  });
});
