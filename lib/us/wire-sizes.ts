import { CIRCULAR_MIL_MM2 } from './units';
export type Aught = '1/0'|'2/0'|'3/0'|'4/0';
export type WireSize = {kind:'awg'; gauge:number|Aught}|{kind:'kcmil';value:number}|{kind:'mm²';value:number};
export type NominalWire = {gauge:number|Aught; diameterMm:number; areaMm2:number};
function awgNumber(gauge:number|Aught):number {
  if(typeof gauge==='string') {
    const aught:Record<Aught,number>={'1/0':0,'2/0':-1,'3/0':-2,'4/0':-3};
    if(!Object.hasOwn(aught,gauge)) throw new RangeError('Choose 1/0 through 4/0 AWG.');
    return aught[gauge];
  }
  if(!Number.isInteger(gauge)||gauge<1||gauge>40) throw new RangeError('Choose an integer AWG from 1 to 40.');
  return gauge;
}
export function nominalAwg(gauge:number|Aught):NominalWire {
  const diameterMm=0.127*92**((36-awgNumber(gauge))/39);
  return {gauge,diameterMm,areaMm2:Math.PI*diameterMm**2/4};
}
export const AWG_SIZES:NominalWire[] = [...Array.from({length:40},(_,i)=>nominalAwg(40-i)),...(['1/0','2/0','3/0','4/0'] as const).map(nominalAwg)];
export function wireAreaMm2(wire:WireSize):number {
  if(wire.kind==='awg') return nominalAwg(wire.gauge).areaMm2;
  if(!Number.isFinite(wire.value)||wire.value<=0) throw new RangeError('Conductor area must be positive and finite.');
  if(wire.kind==='kcmil') return wire.value*1000*CIRCULAR_MIL_MM2;
  if(wire.kind==='mm²') return wire.value;
  throw new RangeError('Unsupported conductor size.');
}
/** Geometric comparison only: never an ampacity, insulation diameter or substitution approval. */
export function compareAwg(areaMm2:number) {
  wireAreaMm2({kind:'mm²',value:areaMm2});
  const lower=[...AWG_SIZES].reverse().find(w=>w.areaMm2<=areaMm2);
  const upper=AWG_SIZES.find(w=>w.areaMm2>=areaMm2);
  const nearest=AWG_SIZES.reduce((best,w)=>Math.abs(w.areaMm2-areaMm2)<Math.abs(best.areaMm2-areaMm2)?w:best);
  return {nearest,lower,upper,exact:Math.abs(nearest.areaMm2-areaMm2)<=areaMm2*1e-12};
}
