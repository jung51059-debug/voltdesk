import { wireAreaMm2, compareAwg, type Aught } from './wire-sizes';
import { convertArea } from './units';
export const US_NEW_TOOLS=[{slug:'ohms-law',title:"Ohm's Law Calculator"},{slug:'wire-size-converter',title:'AWG / mm² / kcmil Converter'}] as const;
export const OHM_PAIRS=['V,I','V,R','V,P','I,R','I,P','R,P'] as const;
export type OhmPair=typeof OHM_PAIRS[number];
export function solveOhm(pair:OhmPair,a:number,b:number) {
  if(!OHM_PAIRS.includes(pair)||![a,b].every(n=>Number.isFinite(n)&&n>0)) throw new RangeError('Choose two independent quantities and enter positive finite values. Zero or negative inputs do not define this passive-resistor model.');
  let v=0,i=0,r=0;
  if(pair==='V,I'){v=a;i=b;r=v/i;}
  if(pair==='V,R'){v=a;r=b;i=v/r;}
  if(pair==='V,P'){v=a;i=b/v;r=v/i;}
  if(pair==='I,R'){i=a;r=b;v=i*r;}
  if(pair==='I,P'){i=a;v=b/i;r=v/i;}
  if(pair==='R,P'){r=a;i=Math.sqrt(b/r);v=i*r;}
  const p=v*i;
  if(![v,i,r,p].every(n=>Number.isFinite(n)&&n>0)) throw new RangeError('The result is outside the positive finite numerical range.');
  return {V:v,I:i,R:r,P:p};
}
export function convertWire(raw:string,unit:'AWG'|'mm²'|'kcmil'|'cmil') {
  if(!raw.trim()) throw new RangeError('Enter a conductor size.');
  const n=Number(raw);
  const area=unit==='AWG'?wireAreaMm2({kind:'awg',gauge:/^[1-4]\/0$/.test(raw)?raw as Aught:n}):unit==='kcmil'?wireAreaMm2({kind:'kcmil',value:n}):unit==='cmil'?wireAreaMm2({kind:'mm²',value:convertArea(n,'cmil','mm²')}):wireAreaMm2({kind:'mm²',value:n});
  if(!['AWG','mm²','kcmil','cmil'].includes(unit)) throw new RangeError('Choose a supported conductor size unit.');
  return {areaMm2:area,kcmil:convertArea(area,'mm²','kcmil'),cmil:convertArea(area,'mm²','cmil'),...compareAwg(area)};
}
