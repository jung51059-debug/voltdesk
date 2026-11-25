import { emptyLoadRow, summarizeLoads, exportLoadScheduleCsv, toCsv, type LoadRow } from '@/lib/calculations/schedules';

export const US_LOAD_CATEGORIES = ['Lighting', 'Receptacle', 'HVAC', 'Motor', 'UPS', 'Other'] as const;

export const US_VOLTAGE_PRESETS = [
  { label: '120 V (L-N)', value: 120 },
  { label: '240 V at load (select actual phase)', value: 240 },
  { label: '208Y/120 V', value: 208 },
  { label: '480Y/277 V (L-L)', value: 480 },
] as const;

export function usEmptyLoadRow(): LoadRow {
  return { ...emptyLoadRow(), category: 'Motor', voltage: 480, panel: 'LP-1', name: 'Load 1' };
}

export function summarizeLoadsEn(rows: LoadRow[]) {
  return summarizeLoads(rows);
}

/** Preserve input/computed rows, but group US categories without the KR category whitelist. */
export function exportUsLoadScheduleCsv(rows:LoadRow[]) {
  const original=exportLoadScheduleCsv(rows,{transformerKva:0,generatorKw:0});
  const prefix=original.slice(0,original.indexOf('# SECTION:SUMMARY'));
  const summary=(kind:string,key:string,group:LoadRow[])=>{
    const s=summarizeLoads(group);
    return [kind,key,s.connectedKw,s.demandKw,s.demandKva,s.currentA,s.pf].map(String);
  };
  const groups=[summary('total','',rows)];
  for(const [kind,field,fallback]of [['category','category','Other'],['panel','panel','(Unspecified)']] as const){
    for(const key of new Set(rows.map(r=>r[field].trim()||fallback)))groups.push(summary(kind,key,rows.filter(r=>(r[field].trim()||fallback)===key)));
  }
  return prefix+'# SECTION:SUMMARY\n'+toCsv(['kind','key','connectedKw','demandKw','demandKva','currentA','pf'],groups);
}
