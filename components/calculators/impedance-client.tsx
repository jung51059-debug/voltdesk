"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CABLE_AREAS, UNIT_GROUPS, cableImpedance, cableAreaComparison, cableLengthComparison, rlcImpedance } from "@/lib/calculations/impedance";
import { parseCable, parseRlc } from "@/lib/calculations/impedance-engine";
import { cableDefaults, rlcDefaults } from "@/lib/calculations/impedance-schemas";
import { buildHandoffHref } from "@/lib/calculations/handoff";
import { GA_EVENT, trackGaEvent } from "@/lib/analytics/ga-events";
import { TrackCalculatorView } from "@/components/analytics/track-calculator-view";
import { ImpedanceTriangle, LineChart, PhaseWave } from "./impedance-visuals";

const inputClass="mt-1 h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-base";
const fmt=(n:number|null)=>n===null?"미적용 / 미정":n===0?"0":Math.abs(n)<1e-5||Math.abs(n)>=1e9?n.toExponential(6):Number(n.toPrecision(9)).toLocaleString("en-US",{maximumSignificantDigits:9});
function Field({label,children}:{label:string;children:ReactNode}){return <label className="block min-w-0 text-sm font-medium">{label}{children}</label>;}
function Results({rows}:{rows:[string,number|null,string][]}){return <dl className="grid min-w-0 gap-3 sm:grid-cols-2">{rows.map(([label,value,unit])=><div key={label} className="min-w-0 rounded-xl border border-border p-3"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 break-all font-medium tabular-nums">{fmt(value)} {value===null?"":unit}</dd>{unit==="Ω"&&value!==null&&value>0&&value<.01?<p className="text-xs text-muted">{fmt(value*1000)} mΩ · {fmt(value*1e6)} μΩ</p>:null}</div>)}</dl>;}
function Table({head,rows,selected}:{head:string[];rows:(string|number)[][];selected?:number}){return <div className="max-w-full overflow-x-auto rounded-lg border border-border" tabIndex={0} aria-label="비교표 가로 스크롤"><table className="w-full whitespace-nowrap text-left text-xs"><thead><tr>{head.map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i} className={row[0]===selected?"bg-info font-semibold":"border-t border-border"}>{row.map((v,j)=><td key={j} className="p-3">{typeof v==="number"?fmt(v):v}</td>)}</tr>)}</tbody></table></div>;}
function useInputs(defaults:Record<string,string>,slug:string){
  const [values,setValues]=useState(defaults),[error,setError]=useState("");
  const event=(source:string)=>trackGaEvent(GA_EVENT.calculatorInteraction,{tool_slug:slug,source});
  return {values,setValues,error,setError,event};
}
export function CableImpedanceClient(){
  const {values,setValues,error,setError,event}=useInputs(cableDefaults,"cable-impedance");
  const [result,setResult]=useState<ReturnType<typeof cableImpedance>|null>(null);
  const [areas,setAreas]=useState<ReturnType<typeof cableAreaComparison>>([]),[lengths,setLengths]=useState<ReturnType<typeof cableLengthComparison>>([]);
  const set=(key:string,value:string)=>{setValues({...values,[key]:value});setResult(null);setAreas([]);setLengths([]);setError("");if(key==="mode")event("mode_change");};
  const number=(key:string,label:string,extra?:{min?:number;max?:number;list?:string})=><Field label={label}><input className={inputClass} name={key} type="number" step="any" value={values[key]} onChange={e=>set(key,e.target.value)} {...extra}/></Field>;
  function run(){try{setResult(cableImpedance(parseCable(values)));setError("");trackGaEvent(GA_EVENT.calculationRun,{tool_slug:"cable-impedance",source:values.mode});}catch(e){setResult(null);setError(e instanceof Error?e.message:"입력값을 확인하세요.");}}
  function compare(kind:"area"|"length"){try{const input=parseCable(values);if(kind==="area")setAreas(cableAreaComparison(input));else setLengths(cableLengthComparison(input));event(`${kind}_comparison`);}catch(e){setError(String(e));}}
  const theory=values.mode==="theory";
  const href=result?buildHandoffHref("/tools/electrical/voltage-drop",{mode:"detailed",rMode:"ohm",resistance:String(result.rUnit),resistanceUnit:"ohm/km",reactance:String(result.xUnit),length:values.length,lengthUnit:"m",resistanceBasis:theory?"theoretical-dc":"manufacturer-ac"}):"";
  return <><TrackCalculatorView toolSlug="cable-impedance" category="cable"/><div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
    <form onSubmit={e=>{e.preventDefault();run();}} noValidate className="grid min-w-0 gap-5 lg:grid-cols-2"><div className="min-w-0 space-y-4">
      <Field label="계산 모드"><select className={inputClass} name="mode" value={values.mode} onChange={e=>set("mode",e.target.value)}><option value="theory">도체 이론값 (직류저항 기반)</option><option value="manufacturer">제조사 교류저항·리액턴스 직접 입력</option></select></Field>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">{number("length","케이블 편도 길이 (m)")}{theory?<>
        <Field label="도체 재질"><select className={inputClass} name="material" value={values.material} onChange={e=>set("material",e.target.value)}><option value="cu">구리 Cu</option><option value="al">알루미늄 Al</option></select></Field>
        {number("area","단면적 (mm²) — 직접 입력 가능",{list:"cable-areas"})}<datalist id="cable-areas">{CABLE_AREAS.map(a=><option key={a} value={a}/>)}</datalist>
        {number("frequency","주파수 (Hz) — 50·60 또는 직접 입력",{list:"cable-frequencies"})}<datalist id="cable-frequencies"><option value="50"/><option value="60"/></datalist>
        {number("temperature","도체 온도 (℃)",{min:-50,max:250})}<Field label="도체 온도 슬라이더 (℃)"><input className="mt-3 w-full" type="range" min="-50" max="250" step="1" value={values.temperature} onChange={e=>set("temperature",e.target.value)}/></Field>
        {number("inductance","단위 인덕턴스 (mH/km)")}
      </>:<>{number("resistance","제조사 교류저항 (Ω/km)")}{number("reactance","제조사 리액턴스 (Ω/km)")}{number("dataTemperature","데이터 기준 온도 (℃, 선택·기록용)")}{number("dataFrequency","데이터 기준 주파수 (Hz, 선택·기록용)")}</>}</div>
      <p className="text-xs leading-6 text-muted">{theory?"0.25mH/km는 예시 가정입니다. 이론 직류저항은 실제 교류저항과 다를 수 있습니다. −50~250℃는 수치 입력 범위이며 허용 운전온도가 아닙니다.":"제조사 데이터를 그대로 길이에 비례 적용합니다. 온도 보정이나 주파수 환산을 추가하지 않습니다."}</p>
      <button className="h-11 w-full rounded-xl bg-primary px-4 font-medium text-white" type="submit">임피던스 계산</button>
    </div><section aria-live="polite" className="min-w-0">{error?<p role="alert" className="text-danger-ink">{error}</p>:null}{result?<>
      <h2 className="mb-3 font-semibold">편도 한 도체 기준 결과</h2><Results rows={[
        ...(theory?[["20℃ 이론 직류저항",result.r20,"Ω"],["온도 보정 직류저항",result.r,"Ω"],["저항 증가율",result.increasePct,"%"],["전체 인덕턴스",result.inductanceH,"H"]] as [string,number|null,string][]:[["제조사 교류저항",result.r,"Ω"]] as [string,number|null,string][]),
        ["유도성 리액턴스",result.x,"Ω"],["임피던스 크기",result.z,"Ω"],["위상각",result.angle,"°"],["X/R 비율",result.xr,""],["단위 길이당 저항",result.rUnit,"Ω/km"],["단위 길이당 리액턴스",result.xUnit,"Ω/km"],["단위 길이당 임피던스",result.zUnit,"Ω/km"]]}/>
      <p className="mt-3 break-all text-sm">Z = {fmt(result.r)} + j{fmt(result.x)} Ω</p><ImpedanceTriangle r={result.r} x={result.x}/>
      <Link className="mt-4 block text-sm text-primary underline" href={href} onClick={()=>trackGaEvent(GA_EVENT.relatedToolClick,{tool_slug:"cable-impedance",target_tool_slug:"voltage-drop",source:theory?"theoretical_dc":"manufacturer_ac"})}>이 R·X와 길이로 상세 전압강하 검토 ({theory?"이론 직류저항 근사":"제조사 교류저항"})</Link>
      <div className="mt-4 flex flex-wrap gap-2">{theory?<button type="button" className="rounded-lg border border-border p-3 text-sm" onClick={()=>compare("area")}>굵기별 비교</button>:null}<button type="button" className="rounded-lg border border-border p-3 text-sm" onClick={()=>compare("length")}>길이별 비교</button></div>
    </>:!error?<p className="text-sm text-muted">조건을 입력하고 계산하세요. 입력 변경 시 이전 결과를 표시하지 않습니다.</p>:null}</section></form>
    {areas.length?<section className="mt-6 min-w-0 space-y-3"><h2 className="font-semibold">굵기별 이론 비교</h2><p className="text-xs text-muted">동일 인덕턴스 가정. 선택 굵기를 강조합니다. 제조사 규격표가 아닙니다.</p><Table head={["mm²","R20 Ω","Rt Ω","가정 X Ω","|Z| Ω","선택 대비 R %"]} rows={areas.map(a=>[a.area,a.r20!,a.r,a.x,a.z,a.changePct])} selected={Number(values.area)}/><LineChart title="굵기(mm²)별 저항·임피던스" rows={areas.map(a=>({x:a.area,y:a.r,z:a.z}))}/></section>:null}
    {lengths.length?<section className="mt-6 min-w-0 space-y-3"><h2 className="font-semibold">길이별 임피던스 비교</h2><Table head={["길이 m","R Ω","X Ω","|Z| Ω"]} rows={lengths.map(a=>[a.length,a.r,a.x,a.z])} selected={Number(values.length)}/><LineChart title="길이(m)별 저항·임피던스" rows={lengths.map(a=>({x:a.length,y:a.r,z:a.z}))}/></section>:null}
  </div></>;
}
export function RlcImpedanceClient(){
  const {values,setValues,error,setError,event}=useInputs(rlcDefaults,"rlc-impedance");
  const [result,setResult]=useState<ReturnType<typeof rlcImpedance>|null>(null),[sweep,setSweep]=useState<{x:number;y:number}[]>([]);
  const set=(key:string,value:string)=>{setValues({...values,[key]:value});setResult(null);setSweep([]);setError("");if(key==="circuit")event("mode_change");};
  function run(){try{const input=parseRlc(values),r=rlcImpedance(input);setResult(r);const lo=Math.min(input.frequency,r.resonance??input.frequency)/100,hi=Math.max(input.frequency,r.resonance??input.frequency)*100;
      const freqs=[...Array.from({length:101},(_,i)=>lo*(hi/lo)**(i/100)),input.frequency,...(r.resonance?[r.resonance]:[])].sort((a,b)=>a-b);
      setSweep(freqs.map(f=>({x:f,y:rlcImpedance({...input,frequency:f}).z})));setError("");trackGaEvent(GA_EVENT.calculationRun,{tool_slug:"rlc-impedance",source:values.circuit});
    }catch(e){setResult(null);setSweep([]);setError(e instanceof Error?e.message:"입력값을 확인하세요.");}}
  return <><TrackCalculatorView toolSlug="rlc-impedance" category="electrical-basics"/><form noValidate onSubmit={e=>{e.preventDefault();run();}} className="grid min-w-0 gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6 lg:grid-cols-2"><div className="min-w-0 space-y-4">
    <Field label="직렬 회로"><select className={inputClass} name="circuit" value={values.circuit} onChange={e=>set("circuit",e.target.value)}>{["R","L","C","RL","RC","LC","RLC"].map(c=><option key={c}>{c}</option>)}</select></Field>
    {([['r','저항 R','resistance','R'],['l','인덕턴스 L','inductance','L'],['c','정전용량 C','capacitance','C'],['frequency','주파수 f','frequency',''],['voltage','교류 RMS 전압','voltage','']] as const).filter(([, , ,letter])=>!letter||values.circuit.includes(letter)).map(([key,label,group])=><div key={key} className="grid min-w-0 grid-cols-[minmax(0,1fr)_6rem] items-end gap-2"><Field label={label}><input className={inputClass} name={key} type="number" step="any" value={values[key]} onChange={e=>set(key,e.target.value)}/></Field><Field label={`${label} 단위`}><select className={inputClass} name={`${key}Unit`} value={values[`${key}Unit`]} onChange={e=>set(`${key}Unit`,e.target.value)}>{UNIT_GROUPS[group].map(u=><option key={u}>{u}</option>)}</select></Field></div>)}
    <p className="text-xs leading-6 text-muted">정현파 정상상태의 이상 직렬회로. 병렬회로·부품 공차·기생 성분·과도응답은 미지원입니다. 0Hz와 C 포함 회로의 0F는 허용하지 않습니다.</p><button className="h-11 w-full rounded-xl bg-primary font-medium text-white" type="submit">RLC 임피던스 계산</button>
  </div><section aria-live="polite" className="min-w-0">{error?<p role="alert" className="text-danger-ink">{error}</p>:null}{result?<><h2 className="mb-3 font-semibold">직렬회로 결과 · {result.relation}</h2>{result.singular?<p className="mb-3 text-sm text-danger-ink">이상적 영 임피던스: 유한한 정상상태 전류·전력은 미정입니다. 실제 회로에는 손실과 전원 임피던스가 존재합니다.</p>:null}<Results rows={[["유도성 리액턴스 XL",result.xl,"Ω"],["용량성 리액턴스 XC",result.xc,"Ω"],["합성 리액턴스 X",result.x,"Ω"],["임피던스 크기",result.z,"Ω"],["위상각",result.angle,"°"],["역률",result.pf,""],["RMS 전류",result.current,"A"],["유효전력",result.p,"W"],["무효전력",result.q,"var"],["피상전력",result.s,"VA"],["공진주파수",result.resonance,"Hz"]]}/><p className="mt-3 break-all text-sm">Z = {fmt(result.r)} {result.x<0?"−":"+"} j{fmt(Math.abs(result.x))} Ω</p><ImpedanceTriangle r={result.r} x={result.x}/><p className="mt-2 text-xs text-muted">XL={fmt(result.xl)}Ω / XC={fmt(result.xc)}Ω — 합성 X={fmt(result.x)}Ω</p><PhaseWave angle={result.angle}/></>:!error?<p className="text-sm text-muted">조건을 입력하고 계산하세요.</p>:null}</section>
    {sweep.length?<section className="min-w-0 lg:col-span-2"><h2 className="font-semibold">주파수에 따른 임피던스</h2><LineChart title="주파수(Hz)별 |Z|" rows={sweep} logX marker={result?.resonance}/><p className="text-xs text-muted">선택 주파수 {fmt(parseRlc(values).frequency)} Hz. 그래프는 이론 임피던스이며 공진 전류의 발산을 표시하지 않습니다.</p></section>:null}
  </form></>;
}
