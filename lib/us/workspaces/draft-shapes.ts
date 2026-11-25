import type {FlowBus,FlowBranch,LoadRow,CableRow} from '@/lib/calculations/schedules';
import type {SldNode,SldEdge} from '@/lib/data/sld';
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
export type UsFlowDraft={vBase:number;buses:FlowBus[];branches:FlowBranch[]};
export function decodeUsFlow(value:unknown):UsFlowDraft|undefined {
 if(!record(value)||!finite(value.vBase)||!Array.isArray(value.buses)||!Array.isArray(value.branches))return;
 if(!value.buses.every(b=>record(b)&&typeof b.id==='string'&&finite(b.loadKw)&&finite(b.loadKvar)))return;
 if(!value.branches.every(b=>record(b)&&typeof b.from==='string'&&typeof b.to==='string'&&finite(b.r)&&finite(b.x)))return;
 return value as UsFlowDraft;
}
export type UsLoadDraft={version:number;rows:LoadRow[];equipment:{transformerKva:number;generatorKw:number}};
export function decodeUsLoads(value:unknown):UsLoadDraft|undefined{
 const rows=Array.isArray(value)?value:record(value)&&Array.isArray(value.rows)?value.rows:null;
 if(!rows||!rows.every(r=>record(r)&&typeof r.id==='string'&&typeof r.name==='string'&&finite(r.qty)&&finite(r.unitKw)&&finite(r.demand)&&finite(r.pf)&&finite(r.voltage)))return;
 return {version:1,rows:rows as LoadRow[],equipment:{transformerKva:0,generatorKw:0}};
}
export function decodeUsCables(value:unknown):CableRow[]|undefined{
 if(!Array.isArray(value)||!value.every(r=>record(r)&&typeof r.id==='string'&&typeof r.tag==='string'&&finite(r.voltage)&&finite(r.current)&&finite(r.length)&&finite(r.vdPct)))return;
 return value as CableRow[];
}
export type UsSldDraft={nodes:SldNode[];edges:SldEdge[]};
export function decodeUsSld(value:unknown):UsSldDraft|undefined{
 if(!record(value)||!Array.isArray(value.nodes)||!Array.isArray(value.edges))return;
 if(!value.nodes.every(n=>record(n)&&typeof n.id==='string'&&typeof n.kind==='string'&&typeof n.name==='string'))return;
 if(!value.edges.every(e=>record(e)&&typeof e.id==='string'&&typeof e.from==='string'&&typeof e.to==='string'))return;
 return value as UsSldDraft;
}
