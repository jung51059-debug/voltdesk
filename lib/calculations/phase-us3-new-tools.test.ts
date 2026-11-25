import { it, describe, expect } from 'vitest';
import { solveOhm, convertWire, OHM_PAIRS } from '@/lib/us/new-tools';
describe('US-3F new calculators',()=>{
  for(const pair of OHM_PAIRS) it(`Ohm law ${pair}: independently anchored 12 V; 2 A; 6 ohm; 24 W`,()=>{
    const values:Record<string,number>={V:12,I:2,R:6,P:24};
    const [x,y]=pair.split(',');
    expect(solveOhm(pair,values[x],values[y])).toEqual(values);
  });
  it('rejects zero, negative, nonfinite and overflowing combinations',()=>{
    for(const n of [0,-1,NaN,Infinity]) expect(()=>solveOhm('V,R',12,n)).toThrow();
    expect(()=>solveOhm('I,R',1e300,1e300)).toThrow();
  });
  it('handles 1/0–4/0 AWG and kcmil/mm² cross conversions',()=>{
    expect(convertWire('1/0','AWG').areaMm2).toBeCloseTo(53.475,2);
    expect(convertWire('250','kcmil').areaMm2).toBeCloseTo(126.676869775,5);
    const odd=convertWire('3.5','mm²');
    expect(odd.exact).toBe(false);
    expect(odd.nearest?.gauge).toBe(12);
  });
  it('rejects divide-by-zero style ohm inputs',()=>{
    expect(()=>solveOhm('V,R',12,0)).toThrow();
    expect(()=>solveOhm('I,R',0,6)).toThrow();
  });
  it('supports physical unit magnitudes and bracketing without substitution claims',()=>{
    expect(convertWire('12','AWG').areaMm2).toBeCloseTo(3.31,2);
    expect(convertWire('250','kcmil').areaMm2).toBeCloseTo(126.676869775,7);
    const custom=convertWire('3.5','mm²');
    expect(custom.lower?.gauge).toBe(12);expect(custom.upper?.gauge).toBe(11);expect(custom.exact).toBe(false);
    for(const raw of ['0','41','3.5','5/0','bad','']) expect(()=>convertWire(raw,'AWG')).toThrow();
  });
});
