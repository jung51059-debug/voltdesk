'use client';
import { useId,useState } from 'react';
import { solveOhm,convertWire,OHM_PAIRS,type OhmPair } from '@/lib/us/new-tools';
import { AWG_SIZES, nominalAwg } from '@/lib/us/wire-sizes';
import { convertArea,convertEntry } from '@/lib/us/units';
export function UsNewToolWorkspace({slug}:{slug:string}) {
  const id=useId(),ohm=slug==='ohms-law';
  const [pair,setPair]=useState<OhmPair>('V,I'),[a,setA]=useState('12'),[b,setB]=useState('2');
  const [format,setFormat]=useState<'AWG'|'mm²'|'kcmil'|'cmil'>('AWG'),[area,setArea]=useState(String(nominalAwg(12).areaMm2));
  const [error,setError]=useState(''),[result,setResult]=useState<Record<string,string>|null>(null);
  const labels:Record<string,string>={V:'Voltage (V)',I:'Current (A)',R:'Resistance (Ω)',P:'Power (W)'};
  const clear=()=>{setError('');setResult(null);};
  const inputClass='mt-1 h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3';
  const selected=AWG_SIZES.find(w=>Math.abs(w.areaMm2-Number(area))<=Number(area)*1e-12);
  const areaUnit=format==='AWG'?'mm²':format;
  const display=convertEntry(area,n=>convertArea(n,'mm²',areaUnit));
  function calculate(){
    clear();try{
      if(ohm) {
        if(!a.trim()||!b.trim()) throw new RangeError('Enter both known quantities.');
        const out=solveOhm(pair,Number(a),Number(b));setResult(Object.fromEntries(Object.entries(out).map(([key,n])=>[labels[key],n.toLocaleString('en-US',{maximumFractionDigits:6})])));
      }else{
        const out=convertWire(area,'mm²');
        setResult({'Nominal area (mm²)':out.areaMm2.toLocaleString('en-US',{maximumFractionDigits:8}),'Nominal area (kcmil)':out.kcmil.toLocaleString('en-US',{maximumFractionDigits:8}),'Nominal area (circular mils)':out.cmil.toLocaleString('en-US',{maximumFractionDigits:8}),'Nearest nominal AWG':`${out.nearest.gauge} AWG${out.exact?' (exact nominal area)':''}`,'Adjacent smaller or equal nominal area':out.lower?`${out.lower.gauge} AWG`:'Outside supported range','Adjacent larger or equal nominal area':out.upper?`${out.upper.gauge} AWG`:'Outside supported range'});
      }
    }catch(e){setError(e instanceof Error?e.message:'Check the inputs.');}
  }
  return <div className="rounded-2xl border border-border bg-card p-5"><form className="space-y-4" onSubmit={e=>{e.preventDefault();calculate();}}>
    {ohm?<>
      <label htmlFor={`${id}-pair`} className="block text-sm">Known quantities<select id={`${id}-pair`} className={inputClass} value={pair} onChange={e=>{const p=e.target.value as OhmPair,vals:Record<string,string>={V:'12',I:'2',R:'6',P:'24'};setPair(p);setA(vals[p.split(',')[0]]);setB(vals[p.split(',')[1]]);clear();}}>{OHM_PAIRS.map(p=><option key={p}>{p}</option>)}</select></label>
      <label htmlFor={`${id}-a`} className="block text-sm">{labels[pair.split(',')[0]]}<input id={`${id}-a`} className={inputClass} inputMode="decimal" value={a} onChange={e=>{setA(e.target.value);clear();}}/></label>
      <label htmlFor={`${id}-b`} className="block text-sm">{labels[pair.split(',')[1]]}<input id={`${id}-b`} className={inputClass} inputMode="decimal" value={b} onChange={e=>{setB(e.target.value);clear();}}/></label>
    </>:<>
      <label htmlFor={`${id}-format`} className="block text-sm">Conductor size display<select id={`${id}-format`} className={inputClass} value={format} onChange={e=>{setFormat(e.target.value as typeof format);clear();}}>{['AWG','mm²','kcmil','cmil'].map(u=><option key={u}>{u}</option>)}</select></label>
      {format==='AWG'?<label htmlFor={`${id}-awg`} className="block text-sm">Nominal AWG<select id={`${id}-awg`} className={inputClass} value={selected?String(selected.gauge):'custom'} onChange={e=>{const wire=AWG_SIZES.find(w=>String(w.gauge)===e.target.value);if(wire)setArea(String(wire.areaMm2));clear();}}><option value="custom">Custom area retained: {area} mm²</option>{AWG_SIZES.map(w=><option key={String(w.gauge)}>{w.gauge}</option>)}</select></label>:<label htmlFor={`${id}-area`} className="block text-sm">Nominal conductor area ({format})<input id={`${id}-area`} className={inputClass} inputMode="decimal" value={display} onChange={e=>{setArea(convertEntry(e.target.value,n=>convertArea(n,areaUnit,'mm²')));clear();}}/></label>}
    </>}
    <div className="flex gap-3"><button type="submit" className="min-h-11 rounded-lg bg-primary px-5 text-white">Calculate</button><button type="button" className="min-h-11 rounded-lg border border-border px-5" onClick={()=>{setPair('V,I');setA('12');setB('2');setFormat('AWG');setArea(String(nominalAwg(12).areaMm2));clear();}}>Reset</button></div>
  </form>{error?<p role="alert" className="mt-4 text-danger-ink">{error}</p>:null}{result?<div data-testid="us-result" aria-live="polite" className="mt-6 space-y-4"><h2 className="text-lg font-semibold">Results</h2><dl className="space-y-3">{Object.entries(result).map(([label,value])=><div key={label}><dt className="text-sm text-muted">{label}</dt><dd className="break-words text-lg font-medium">{value}</dd></div>)}</dl><p className="text-sm text-muted">{ohm?'Ideal DC passive-resistor calculation. Verify component ratings and operating temperature separately.':'Nominal geometry only. This does not determine ampacity, cable outside diameter or code compliance.'}</p></div>:null}</div>;
}
