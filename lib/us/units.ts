import { toMeters, toOhmPerKm, toWatts, wattsTo, toWattHours } from '@/lib/math/units';

/** US adapters preserve the shared KR engine's canonical units and rounded HP constant. */
export const MECHANICAL_HP_W = 745.6998715822702;
export const CIRCULAR_MIL_MM2 = Math.PI * 0.0254 ** 2 / 4;
export type LengthUnit = 'mm'|'m'|'km'|'in'|'ft'|'kft'|'mi';
export type AreaUnit = 'mm²'|'cmil'|'kcmil'|'m²'|'ft²'|'in²';
export type ResistanceUnit = 'Ω'|'mΩ';
export type ResistanceDensityUnit = 'Ω/m'|'Ω/km'|'Ω/ft'|'Ω/kft';
export type TemperatureUnit = '°C'|'°F';
export type RealPowerUnit = 'W'|'kW'|'MW'|'hp';
export type ApparentPowerUnit = 'VA'|'kVA'|'MVA';
export type ReactivePowerUnit = 'var'|'kvar';
export type EnergyUnit = 'Wh'|'kWh'|'MWh';
export type VolumeUnit = 'L'|'US gal';
export type FlowUnit = 'L/h'|'US gal/h';
export type PressureUnit = 'Pa'|'kPa'|'psi';
const finite = (value:number) => {if(!Number.isFinite(value)) throw new RangeError('Enter a finite number.'); return value;};
const scaled = <U extends string>(value:number,from:U,to:U,table:Record<U,number>) => {
  finite(value);
  if(!Object.hasOwn(table,from)||!Object.hasOwn(table,to)) throw new RangeError('Unsupported unit.');
  return finite(value*table[from]/table[to]);
};
function meters(value:number,unit:LengthUnit) {
  finite(value);
  if(unit==='m'||unit==='km'||unit==='ft') return toMeters(value,unit);
  const factors = {mm:0.001,in:0.0254,kft:304.8,mi:1609.344};
  if(!Object.hasOwn(factors,unit)) throw new RangeError('Unsupported length unit.');
  return finite(value*factors[unit]);
}
export const convertLength = (value:number,from:LengthUnit,to:LengthUnit) => finite(meters(value,from)/meters(1,to));
export const convertArea = (value:number,from:AreaUnit,to:AreaUnit) => scaled(value,from,to,{
  'mm²':1,cmil:CIRCULAR_MIL_MM2,kcmil:1000*CIRCULAR_MIL_MM2,'m²':1e6,'ft²':92903.04,'in²':645.16,
});
export const convertResistance = (value:number,from:ResistanceUnit,to:ResistanceUnit) => scaled(value,from,to,{'Ω':1,'mΩ':0.001});
function ohmKm(value:number,unit:ResistanceDensityUnit) {
  finite(value);
  if(unit==='Ω/ft') return finite(value/0.0003048);
  const units = {'Ω/m':'ohm/m','Ω/km':'ohm/km','Ω/kft':'ohm/kft'};
  if(!Object.hasOwn(units,unit)) throw new RangeError('Unsupported resistance density unit.');
  return toOhmPerKm(value,units[unit]);
}
export const convertResistanceDensity = (value:number,from:ResistanceDensityUnit,to:ResistanceDensityUnit) => finite(ohmKm(value,from)/ohmKm(1,to));
export function convertTemperature(value:number,from:TemperatureUnit,to:TemperatureUnit,delta=false) {
  finite(value);
  if(!['°C','°F'].includes(from)||!['°C','°F'].includes(to)) throw new RangeError('Unsupported temperature unit.');
  if(from===to) return value;
  return finite(from==='°F' ? (value-(delta?0:32))*5/9 : value*9/5+(delta?0:32));
}
export function convertRealPower(value:number,from:RealPowerUnit,to:RealPowerUnit) {
  finite(value);
  const watts=from==='hp'?value*MECHANICAL_HP_W:toWatts(value,from);
  return finite(to==='hp'?watts/MECHANICAL_HP_W:wattsTo(watts,to));
}
export const convertApparentPower=(value:number,from:ApparentPowerUnit,to:ApparentPowerUnit)=>scaled(value,from,to,{VA:1,kVA:1000,MVA:1e6});
export const convertReactivePower=(value:number,from:ReactivePowerUnit,to:ReactivePowerUnit)=>scaled(value,from,to,{var:1,kvar:1000});
export const convertEnergy=(value:number,from:EnergyUnit,to:EnergyUnit)=>finite(toWattHours(finite(value),from)/toWattHours(1,to));
export const convertVolume=(value:number,from:VolumeUnit,to:VolumeUnit)=>scaled(value,from,to,{L:1,'US gal':3.785411784});
export const convertFlow=(value:number,from:FlowUnit,to:FlowUnit)=>scaled(value,from,to,{'L/h':1,'US gal/h':3.785411784});
export const convertPressure=(value:number,from:PressureUnit,to:PressureUnit)=>scaled(value,from,to,{Pa:1,kPa:1000,psi:6894.757293168});

/** Text entry conversion preserves blank/invalid text instead of silently turning it into zero. */
export function convertEntry(raw:string,convert:(value:number)=>number):string {
  if(raw.trim()==='') return raw;
  // Deliberately do not interpret ambiguous thousands/decimal separators.
  const value=Number(raw);
  if(!Number.isFinite(value)) return raw;
  try {return String(convert(value));} catch {return raw;}
}
