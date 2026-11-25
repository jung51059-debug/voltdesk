import { it, expect, describe } from 'vitest';
import { cableDefaults, runUsCable, US_CABLE_TOOLS } from '@/lib/us/cable-tools';
import { nominalAwg } from '@/lib/us/wire-sizes';
import { convertLength, convertResistanceDensity, convertTemperature } from '@/lib/us/units';
import { writeFileSync } from 'node:fs';
const area=Math.PI/4*(0.127*92**(24/39))**2;
const r=0.01724*30.48/area;
const x=2*Math.PI*60*0.25*1e-3*30.48/1000;
const dv=2*20*(r*0.9+x*Math.sqrt(1-0.9**2));
const references:Record<string,{metric:string;value:number}>={
  'cable-impedance':{metric:'z',value:Math.hypot(r,x)},'cable-resistance':{metric:'r',value:r},
  'cable-parallel':{metric:'ieach',value:10},'voltage-drop':{metric:'dv',value:dv},'path-voltage-drop':{metric:'dv',value:dv},
};
const metric=(out:ReturnType<typeof runUsCable>,id:string)=>out.ok?Number(String(out.metrics.find(m=>m.id===id)?.value).replace(/,/g,'')):NaN;
describe('US-3C cable pilot independent formulas',()=>{
  for(const tool of US_CABLE_TOOLS) {
    it(`${tool.slug}: independent US and SI example`,()=>{
      const v=cableDefaults(),ref=references[tool.slug];
      const us=runUsCable(tool.slug,v,8);
      expect(us.ok,JSON.stringify(us)).toBe(true); expect(metric(us,ref.metric)).toBeCloseTo(ref.value,7);
      const row=v.rows[0];
      row.length=String(convertLength(Number(row.length),'ft','m'));row.lengthUnit='m';
      row.temperature=String(convertTemperature(Number(row.temperature),'°F','°C'));row.temperatureUnit='°C';
      row.resistance=String(convertResistanceDensity(Number(row.resistance),'Ω/kft','Ω/km'));
      row.reactance=String(convertResistanceDensity(Number(row.reactance),'Ω/kft','Ω/km'));row.densityUnit='Ω/km';
      expect(metric(runUsCable(tool.slug,v,8),ref.metric)).toBeCloseTo(ref.value,7);
    });
    it(`${tool.slug}: blank, zero area and invalid current rejected`,()=>{
      for(const patch of [{length:''},{area:'0'},{current:'bad'}]) {
        const v=cableDefaults();Object.assign(v.rows[0],patch);expect(runUsCable(tool.slug,v).ok).toBe(false);
      }
    });
  }
  it('manufacturer AC data is not temperature corrected twice',()=>{
    const v=cableDefaults();Object.assign(v.rows[0],{data:'manufacturer',temperature:'140'});
    const out=runUsCable('cable-impedance',v,8);
    expect(metric(out,'r')).toBeCloseTo(0.1*100/1000,8);
    expect(metric(out,'x')).toBeCloseTo(0.02*100/1000,8);
  });
  it('multi-segment mixed ft and m accumulates drop and loss exactly once',()=>{
    const v=cableDefaults();v.rows.push({...v.rows[0],length:'30.48',lengthUnit:'m'});
    const out=runUsCable('path-voltage-drop',v,8);
    expect(out.ok,JSON.stringify(out)).toBe(true);
    expect(metric(out,'dv')).toBeCloseTo(2*dv,7);
    expect(metric(out,'loss')).toBeCloseTo(4*20**2*r,7);
  });
  it('split-phase line-to-line uses the two-wire factor, three-phase uses sqrt(3)',()=>{
    const v=cableDefaults();v.connection='split-ll';v.voltage='240';
    expect(metric(runUsCable('voltage-drop',v,8),'dv')).toBeCloseTo(dv,7);
    v.connection='three';v.voltage='208';
    expect(metric(runUsCable('voltage-drop',v,8),'dv')).toBeCloseTo(dv*Math.sqrt(3)/2,7);
  });
  it('zero current yields zero drop and AWG geometry agrees with explicit area',()=>{
    const v=cableDefaults();v.rows[0].current='0';v.rows[0].area=String(nominalAwg(12).areaMm2);
    expect(metric(runUsCable('voltage-drop',v),'dv')).toBe(0);
  });
  it('exports observed cable comparisons',()=>{
    writeFileSync('artifacts/us3/cable-validation.json',JSON.stringify(US_CABLE_TOOLS.map(tool=>{
      const ref=references[tool.slug],actual=metric(runUsCable(tool.slug,cableDefaults(),8),ref.metric);
      return {slug:tool.slug,expected:ref.value,actual,metric:ref.metric,formula:'Independent AWG geometry; rho L/A; hypot(R;X); 2 I (R PF + X sinφ)',status:Math.abs(actual-ref.value)<1e-7?'PASS':'FAIL'};
    }),null,2));
  });
});
