import { it, expect, describe } from 'vitest';
import * as u from '@/lib/us/units';
import { nominalAwg, wireAreaMm2, compareAwg, AWG_SIZES } from '@/lib/us/wire-sizes';
import { WATTS_PER_HP, toMeters, toOhmPerKm } from '@/lib/math/units';
import { writeFileSync } from 'node:fs';
const cases = [
  {name:'inch to mm',actual:()=>u.convertLength(1,'in','mm'),expected:25.4,tol:1e-12},
  {name:'foot to m',actual:()=>u.convertLength(1,'ft','m'),expected:0.3048,tol:1e-14},
  {name:'kft to m',actual:()=>u.convertLength(1,'kft','m'),expected:304.8,tol:1e-12},
  {name:'mile to m',actual:()=>u.convertLength(1,'mi','m'),expected:1609.344,tol:1e-10},
  {name:'circular mil to mm²',actual:()=>u.convertArea(1,'cmil','mm²'),expected:0.0005067074791,tol:1e-13},
  {name:'kcmil to mm²',actual:()=>u.convertArea(1,'kcmil','mm²'),expected:0.5067074791,tol:1e-10},
  {name:'mechanical hp W',actual:()=>u.convertRealPower(1,'hp','W'),expected:745.6999,tol:0.00005},
  {name:'Fahrenheit freezing',actual:()=>u.convertTemperature(32,'°F','°C'),expected:0,tol:1e-12},
  {name:'Fahrenheit boiling',actual:()=>u.convertTemperature(100,'°C','°F'),expected:212,tol:1e-12},
  {name:'temperature interval',actual:()=>u.convertTemperature(18,'°F','°C',true),expected:10,tol:1e-12},
  {name:'resistance density km to kft',actual:()=>u.convertResistanceDensity(1,'Ω/km','Ω/kft'),expected:0.3048,tol:1e-12},
  {name:'resistance density ft to km',actual:()=>u.convertResistanceDensity(0.001,'Ω/ft','Ω/km'),expected:3.280839895013123,tol:1e-12},
  {name:'mΩ to Ω',actual:()=>u.convertResistance(1000,'mΩ','Ω'),expected:1,tol:1e-12},
  {name:'kVA to VA',actual:()=>u.convertApparentPower(1,'kVA','VA'),expected:1000,tol:1e-12},
  {name:'kvar to var',actual:()=>u.convertReactivePower(1,'kvar','var'),expected:1000,tol:1e-12},
  {name:'MWh to kWh',actual:()=>u.convertEnergy(1,'MWh','kWh'),expected:1000,tol:1e-12},
  {name:'US gallon to liters',actual:()=>u.convertVolume(1,'US gal','L'),expected:3.785411784,tol:1e-12},
  {name:'US gallon per hour to L/h',actual:()=>u.convertFlow(10,'US gal/h','L/h'),expected:37.85411784,tol:1e-10},
  {name:'square feet to square m',actual:()=>u.convertArea(1,'ft²','m²'),expected:0.09290304,tol:1e-12},
  {name:'psi to Pa',actual:()=>u.convertPressure(1,'psi','Pa'),expected:6894.757293168,tol:1e-8},
  {name:'36 AWG definition diameter',actual:()=>nominalAwg(36).diameterMm,expected:0.127,tol:1e-12},
  {name:'4/0 definition diameter',actual:()=>nominalAwg('4/0').diameterMm,expected:11.684,tol:1e-12},
  {name:'12 AWG published nominal area',actual:()=>nominalAwg(12).areaMm2,expected:3.31,tol:0.005},
  {name:'1/0 AWG published nominal area',actual:()=>nominalAwg('1/0').areaMm2,expected:53.5,tol:0.05},
];
describe('US-3B independently anchored conversions',()=>{
  for(const c of cases) it(c.name,()=>expect(Math.abs(c.actual()-c.expected)).toBeLessThanOrEqual(c.tol));
  it('keeps the KR horsepower and shared conversion contracts',()=>{
    expect(WATTS_PER_HP).toBe(746); expect(toMeters(100,'ft')).toBe(30.48);
    expect(toOhmPerKm(0.3048,'ohm/kft')).toBeCloseTo(1,12);
  });
  it('preserves conductor DC resistance across unit representations',()=>{
    const area=wireAreaMm2({kind:'awg',gauge:12});
    const length=u.convertLength(100,'ft','m');
    const resistance=0.01724*length/area;
    const kcmil=u.convertArea(area,'mm²','kcmil');
    expect(0.01724*u.convertLength(u.convertLength(length,'m','ft'),'ft','m')/wireAreaMm2({kind:'kcmil',value:kcmil})).toBeCloseTo(resistance,13);
  });
  it('round trips every supported length unit without display rounding',()=>{
    for(const unit of ['mm','m','km','in','ft','kft','mi'] as const)
      expect(u.convertLength(u.convertLength(123.456,'m',unit),unit,'m')).toBeCloseTo(123.456,12);
  });
  it('supports all 44 AWG geometries and orders by conductor area',()=>{
    expect(AWG_SIZES).toHaveLength(44);
    AWG_SIZES.slice(1).forEach((wire,i)=>expect(wire.areaMm2).toBeGreaterThan(AWG_SIZES[i].areaMm2));
    expect(compareAwg(3.5).nearest.gauge).toBe(12);
    expect(compareAwg(3.5).lower?.gauge).toBe(12);
    expect(compareAwg(3.5).upper?.gauge).toBe(11);
    expect(compareAwg(3.5).exact).toBe(false);
    expect(compareAwg(0.001).lower).toBeUndefined();
    expect(compareAwg(1000).upper).toBeUndefined();
  });
  it('rejects unsupported and non-finite inputs',()=>{
    for(const gauge of [0,41,12.5,NaN]) expect(()=>nominalAwg(gauge)).toThrow();
    for(const value of [0,-1,NaN,Infinity]) expect(()=>wireAreaMm2({kind:'kcmil',value})).toThrow();
    expect(()=>u.convertLength(Infinity,'ft','m')).toThrow();
    expect(()=>u.convertLength(1,'bad' as u.LengthUnit,'m')).toThrow();
  });
  it('preserves blank and invalid entry text',()=>{
    for(const raw of ['','  ','bad','1,5','Infinity']) expect(u.convertEntry(raw,n=>n*2)).toBe(raw);
    expect(u.convertEntry('10',n=>u.convertLength(n,'ft','m'))).toBe('3.048');
  });
  it('exports observed conversion evidence',()=>{
    writeFileSync('PHASE-US3-UNIT-VALIDATION.csv','case,expected,actual,tolerance,status\n'+cases.map(c=>`${c.name},${c.expected},${c.actual()},${c.tol},${Math.abs(c.actual()-c.expected)<=c.tol?'PASS':'FAIL'}`).join('\n'));
  });
});
