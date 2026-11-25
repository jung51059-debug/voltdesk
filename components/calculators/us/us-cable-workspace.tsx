'use client';
import { useId, useState } from 'react';
import { cableDefaults, runUsCable, type CableRow, type CableValues } from '@/lib/us/cable-tools';
import { AWG_SIZES } from '@/lib/us/wire-sizes';
import { convertArea, convertEntry, convertLength, convertResistanceDensity, convertTemperature, type LengthUnit, type ResistanceDensityUnit, type TemperatureUnit } from '@/lib/us/units';
import { ResultPanel } from '@/components/calculators/result-panel';
import { WarningPanel } from '@/components/calculators/warning-panel';
import type { CalculationOutcome } from '@/lib/types';

export function UsCableWorkspace({slug}:{slug:string}) {
  const id=useId(),[values,setValues]=useState<CableValues>(cableDefaults),[outcome,setOutcome]=useState<CalculationOutcome|null>(null),[areaFormat,setAreaFormat]=useState('AWG');
  const path=slug==='path-voltage-drop',drop=path||slug==='voltage-drop';
  function edit(patch:Partial<CableValues>){setValues(v=>({...v,...patch}));setOutcome(null);}
  function rowEdit(index:number,patch:Partial<CableRow>){setValues(v=>({...v,rows:v.rows.map((r,i)=>i===index?{...r,...patch}:r)}));setOutcome(null);}
  function unit(index:number,key:'lengthUnit'|'densityUnit'|'temperatureUnit',to:string){
    const row=values.rows[index];
    if(key==='lengthUnit') rowEdit(index,{length:convertEntry(row.length,n=>convertLength(n,row.lengthUnit,to as LengthUnit)),lengthUnit:to as LengthUnit});
    if(key==='temperatureUnit') rowEdit(index,{temperature:convertEntry(row.temperature,n=>convertTemperature(n,row.temperatureUnit,to as TemperatureUnit)),temperatureUnit:to as TemperatureUnit});
    if(key==='densityUnit') rowEdit(index,{resistance:convertEntry(row.resistance,n=>convertResistanceDensity(n,row.densityUnit,to as ResistanceDensityUnit)),reactance:convertEntry(row.reactance,n=>convertResistanceDensity(n,row.densityUnit,to as ResistanceDensityUnit)),densityUnit:to as ResistanceDensityUnit});
  }
  const inputClass='mt-1 h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3';
  function numberInput(label:string,value:string,set:(value:string)=>void,key:string){return <label className="block text-sm" htmlFor={`${id}-${key}`}>{label}<input className={inputClass} id={`${id}-${key}`} value={value} type="text" inputMode="decimal" onChange={e=>set(e.target.value)}/></label>;}
  function select(label:string,value:string,options:readonly string[],set:(value:string)=>void,key:string){return <label className="block text-sm" htmlFor={`${id}-${key}`}>{label}<select className={inputClass} id={`${id}-${key}`} value={value} onChange={e=>set(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>;}
  return <div className="rounded-2xl border border-border bg-card p-5">
    <form className="space-y-5" onSubmit={e=>{e.preventDefault();setOutcome(runUsCable(slug,values));}}>
      {drop?<>
        {select('Load connection',values.connection,['single','split-ll','split-ln','three'],v=>edit({connection:v as CableValues['connection']}),'connection')}
        <p className="text-sm text-muted">single: two-wire single-phase; split-ll: 240 V line-to-line load; split-ln: 120 V line-to-neutral branch; three: balanced three-phase. Shared-neutral imbalance is outside this model.</p>
        {select('Representative voltage preset','Custom',['Custom','120','240','208','277','480'],v=>{if(v!=='Custom') edit({voltage:v});},'preset')}
        {numberInput(values.connection==='three'?'Load line-to-line voltage (V)':'Voltage across this two-wire load (V)',values.voltage,v=>edit({voltage:v}),'voltage')}
      </>:null}
      {numberInput('Operating frequency (Hz)',values.frequency,v=>edit({frequency:v}),'frequency')}
      {select('Conductor size display',areaFormat,['AWG','kcmil','mm²'],setAreaFormat,'area-format')}
      <p className="text-sm text-muted">Changing the display preserves nominal area. Selecting an AWG size explicitly changes the conductor. Unmatched areas remain custom; nearest gauges do not establish interchangeability.</p>
      {slug==='cable-parallel'?numberInput('Number of identical parallel conductors',values.parallel,v=>edit({parallel:v}),'parallel'):null}
      {values.rows.map((row,index)=>{
        const nearest=AWG_SIZES.find(w=>Math.abs(w.areaMm2-Number(row.area))<Number(row.area)*1e-10);
        const displayed=areaFormat==='kcmil'?convertEntry(row.area,n=>convertArea(n,'mm²','kcmil')):row.area;
        return <fieldset key={index} className="space-y-4 rounded-xl border border-border p-4"><legend className="px-2 font-medium">{path?`Segment ${index+1}`:'Conductor and load'}</legend>
          {areaFormat==='AWG'?<label className="block text-sm" htmlFor={`${id}-awg-${index}`}>Nominal AWG size<select id={`${id}-awg-${index}`} className={inputClass} value={nearest?String(nearest.gauge):'custom'} onChange={e=>{const wire=AWG_SIZES.find(w=>String(w.gauge)===e.target.value);if(wire) rowEdit(index,{area:String(wire.areaMm2)});}}><option value="custom">Custom area retained ({row.area} mm²)</option>{AWG_SIZES.map(w=><option key={String(w.gauge)} value={String(w.gauge)}>{w.gauge} AWG</option>)}</select></label>:numberInput(`Nominal conductor area (${areaFormat})`,displayed,v=>rowEdit(index,{area:areaFormat==='kcmil'?convertEntry(v,n=>convertArea(n,'kcmil','mm²')):v}),`area-${index}`)}
          {select('Conductor material',row.material,['cu','al'],v=>rowEdit(index,{material:v as CableRow['material']}),`material-${index}`)}
          <p className="text-sm text-muted">cu = copper; al = aluminum. Nominal area does not include insulation.</p>
          <div className="grid gap-3 sm:grid-cols-2">{numberInput(`One-way length (${row.lengthUnit})`,row.length,v=>rowEdit(index,{length:v}),`length-${index}`)}{select('Length units',row.lengthUnit,['ft','m','kft','km','in','mm','mi'],v=>unit(index,'lengthUnit',v),`lengthUnit-${index}`)}</div>
          <div className="grid gap-3 sm:grid-cols-2">{numberInput(`Conductor temperature (${row.temperatureUnit})`,row.temperature,v=>rowEdit(index,{temperature:v}),`temperature-${index}`)}{select('Temperature units',row.temperatureUnit,['°F','°C'],v=>unit(index,'temperatureUnit',v),`temperatureUnit-${index}`)}</div>
          {slug!=='cable-resistance'&&slug!=='cable-parallel'?<>
            {select('Resistance data source',row.data,['theory','manufacturer'],v=>rowEdit(index,{data:v as CableRow['data']}),`data-${index}`)}
            {row.data==='theory'?numberInput('User justified inductance (mH/km)',row.inductance,v=>rowEdit(index,{inductance:v}),`inductance-${index}`):<>
              {select('Manufacturer R/X units',row.densityUnit,['Ω/kft','Ω/km','Ω/ft','Ω/m'],v=>unit(index,'densityUnit',v),`densityUnit-${index}`)}
              {numberInput(`Manufacturer AC resistance (${row.densityUnit})`,row.resistance,v=>rowEdit(index,{resistance:v}),`resistance-${index}`)}
              {numberInput(`Manufacturer reactance (${row.densityUnit})`,row.reactance,v=>rowEdit(index,{reactance:v}),`reactance-${index}`)}
              <p className="text-sm text-muted">Use R/X at the entered operating frequency and actual conductor temperature. Manufacturer values are not temperature-corrected again.</p>
            </>}
          </>:null}
          {drop||slug==='cable-parallel'?numberInput('Line current (A)',row.current,v=>rowEdit(index,{current:v}),`current-${index}`):null}
          {drop?<>{select('Voltage drop model',row.mode,['basic','detailed'],v=>rowEdit(index,{mode:v as CableRow['mode']}),`mode-${index}`)}{numberInput('Power factor (0 to 1)',row.pf,v=>rowEdit(index,{pf:v}),`pf-${index}`)}{select('Power factor direction',row.direction,['lagging','leading'],v=>rowEdit(index,{direction:v as CableRow['direction']}),`direction-${index}`)}</>:null}
          {path&&values.rows.length>1?<button type="button" className="min-h-11 rounded border border-border px-3" onClick={()=>edit({rows:values.rows.filter((_,i)=>i!==index)})}>Remove segment {index+1}</button>:null}
        </fieldset>;
      })}
      {path?<button type="button" className="min-h-11 rounded border border-border px-3" onClick={()=>edit({rows:[...values.rows,{...cableDefaults().rows[0]}]})}>Add segment</button>:null}
      <div className="flex gap-3"><button className="min-h-11 rounded-lg bg-primary px-5 text-white" type="submit">Calculate</button><button className="min-h-11 rounded-lg border border-border px-5" type="button" onClick={()=>{setValues(cableDefaults());setOutcome(null);setAreaFormat('AWG');}}>Reset</button></div>
    </form>
    {outcome&&!outcome.ok?<p className="mt-5 text-danger-ink" role="alert">{outcome.formError}</p>:null}
    {outcome?.ok?<div className="mt-6" data-testid="us-result"><ResultPanel result={outcome} uiLocale="en"/><WarningPanel warnings={outcome.warnings} uiLocale="en"/></div>:null}
  </div>;
}
