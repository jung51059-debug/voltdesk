'use client';
import { useId, useState } from 'react';
import { ResultPanel } from '@/components/calculators/result-panel';
import { WarningPanel } from '@/components/calculators/warning-panel';
import { groupBDefaults, runGroupB, type GroupBTool } from '@/lib/us/group-b-tools';
import { convertEntry, convertRealPower, convertEnergy, convertFlow, type RealPowerUnit, type EnergyUnit, type FlowUnit } from '@/lib/us/units';
import type { CalculationOutcome } from '@/lib/types';

export function UsGroupBWorkspace({spec}:{spec:GroupBTool}) {
  const id=useId();
  const [values,setValues]=useState(()=>groupBDefaults(spec));
  const [outcome,setOutcome]=useState<CalculationOutcome|null>(null);
  function setField(key:string,value:string){setValues(v=>({...v,[key]:value}));setOutcome(null);}
  function changeUnit(field:GroupBTool['fields'][number],unit:string) {
    setValues(v=>{
      const from=v[`${field.id}Unit`];
      const raw=convertEntry(v[field.id],n=>field.kind==='power'?convertRealPower(n,from as RealPowerUnit,unit as RealPowerUnit):field.kind==='energy'?convertEnergy(n,from as EnergyUnit,unit as EnergyUnit):convertFlow(n,from as FlowUnit,unit as FlowUnit));
      return {...v,[field.id]:raw,[`${field.id}Unit`]:unit};
    });setOutcome(null);
  }
  return <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <form onSubmit={event=>{event.preventDefault();setOutcome(runGroupB(spec,values));}} className="space-y-4">
      {spec.fields.map(field=><div key={field.id}>
        <label htmlFor={`${id}-${field.id}`} className="text-sm font-medium">{field.label} ({values[`${field.id}Unit`]})</label>
        <div className="mt-1 flex gap-2">
          <input id={`${id}-${field.id}`} type="text" inputMode="decimal" required value={values[field.id]} onChange={event=>setField(field.id,event.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3" />
          {field.units?<select aria-label={`${field.label} units`} value={values[`${field.id}Unit`]} onChange={event=>changeUnit(field,event.target.value)} className="h-11 max-w-32 rounded-lg border border-border bg-surface px-2">{field.units.map(unit=><option key={unit}>{unit}</option>)}</select>:null}
        </div>
      </div>)}
      <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-lg bg-primary px-5 text-white" type="submit">Calculate</button><button className="min-h-11 rounded-lg border border-border px-5" type="button" onClick={()=>{setValues(groupBDefaults(spec));setOutcome(null);}}>Reset</button></div>
    </form>
    {!outcome?.ok&&outcome?<p role="alert" className="mt-4 text-danger-ink">{outcome.formError}</p>:null}
    {outcome?.ok?<div className="mt-6" data-testid="us-result"><ResultPanel result={outcome} uiLocale="en"/><WarningPanel warnings={outcome.warnings} uiLocale="en"/></div>:null}
  </div>;
}
