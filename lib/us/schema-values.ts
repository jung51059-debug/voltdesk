import type { FormSchema } from '@/lib/calculations/schemas';
import { toWatts,wattsTo,toVolts,toAmperes,toMeters,toWattHours,toOhmPerKm } from '@/lib/math/units';
import { convertEntry } from './units';
const dimensions=[{units:['W','kW','MW','HP'],canonical:toWatts},{units:['V','kV'],canonical:toVolts},{units:['A','kA'],canonical:toAmperes},{units:['m','km','ft'],canonical:toMeters},{units:['Wh','kWh','MWh'],canonical:toWattHours},{units:['ohm/m','ohm/km','ohm/kft'],canonical:toOhmPerKm}];
export function convertSchemaValue(raw:string,from:string,to:string){
  const group=dimensions.find(d=>d.units.includes(from)&&d.units.includes(to));
  if(!group)return raw;
  return convertEntry(raw,n=>group.canonical===toWatts?wattsTo(toWatts(n,from),to):group.canonical(n,from)/group.canonical(1,to));
}
export function validateUsSchemaValues(schema:FormSchema,values:Record<string,string>){
 const errors:Record<string,string>={};
 for(const field of schema.fields){
  if(field.visibleWhen&&!field.visibleWhen.values.includes(values[field.visibleWhen.field]))continue;
  const raw=values[field.id]??'';
  if(field.required&&!raw.trim()){errors[field.id]=`Enter ${field.label.toLowerCase()}.`;continue;}
  if(field.kind==='number'&&raw.trim()){
   const n=Number(raw.replaceAll(',',''));
   if(!Number.isFinite(n)||(field.min!==undefined&&n<field.min)||(field.max!==undefined&&n>field.max))errors[field.id]=`Check ${field.label.toLowerCase()} and its permitted range.`;
  }
 }
 return errors;
}
