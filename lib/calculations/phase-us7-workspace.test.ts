import {it,expect} from 'vitest';
import {usRadialLoadFlow} from '@/lib/us/workspaces/load-flow-en';
import {decodeUsFlow,decodeUsLoads,decodeUsCables,decodeUsSld} from '@/lib/us/workspaces/draft-shapes';
import {exportUsLoadScheduleCsv,usEmptyLoadRow} from '@/lib/us/workspaces/load-schedule-en';
it('US export keeps distinct English category totals without changing KR grouping',()=>{
 const base={...usEmptyLoadRow(),qty:1,unitKw:10,demand:1,pf:1};
 const text=exportUsLoadScheduleCsv([{...base,id:'motor',category:'Motor'},{...base,id:'hvac',category:'HVAC',unitKw:2}]);
 expect(text).toContain('category,Motor,10,10,10,');expect(text).toContain('category,HVAC,2,2,2,');
 expect(text).not.toMatch(/[\u3131-\uD79D]/);
});
it('US load-flow result matches an independent one-branch voltage and loss calculation',()=>{
 const out=usRadialLoadFlow([{id:'SRC',loadKw:0,loadKvar:0},{id:'LD',loadKw:50,loadKvar:20}],[{from:'SRC',to:'LD',r:0.08,x:0.04}],480);
 expect(out.ok).toBe(true);if(!out.ok)return;
 expect(out.buses[1].vPu).toBeCloseTo(Math.sqrt(480**2-2*(0.08*50000+0.04*20000))/480,12);
 expect(out.totalLossKw).toBeCloseTo((50000**2+20000**2)/480**2*0.08/1000,12);
});
it('US load-flow rejects invalid input without altering the shared KR solver',()=>{
 const buses=[{id:'SRC',loadKw:0,loadKvar:0},{id:'LD',loadKw:50,loadKvar:20}],branches=[{from:'SRC',to:'LD',r:0.08,x:0.04}];
 expect(usRadialLoadFlow(buses,branches,NaN).ok).toBe(false);
 expect(usRadialLoadFlow([...buses,{...buses[1]}],branches,480).ok).toBe(false);
 expect(usRadialLoadFlow(buses,[{...branches[0],r:-1}],480).ok).toBe(false);
});
it('malformed persisted workspace data is detected rather than treated as a valid draft',()=>{
 for(const decode of [decodeUsFlow,decodeUsLoads,decodeUsCables,decodeUsSld])for(const value of [null,'bad',42,{broken:true}])expect(decode(value)).toBeUndefined();
 const flow={vBase:480,buses:[{id:'SRC',loadKw:0,loadKvar:0}],branches:[]};expect(decodeUsFlow(flow)).toEqual(flow);
});
