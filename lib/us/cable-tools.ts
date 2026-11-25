import { acVoltageDrop, cableImpedance, theoreticalResistance } from '@/lib/calculations/impedance';
import { calculatePathVoltageDrop, type PathVoltageDropSegmentInput } from '@/lib/calculations/path-voltage-drop';
import { convertLength, convertResistanceDensity, convertTemperature, type LengthUnit, type ResistanceDensityUnit, type TemperatureUnit } from './units';
import type { CalculationOutcome } from '@/lib/types';

export const US_CABLE_TOOLS = [
  {slug:'cable-impedance',title:'Cable Impedance Calculator'},
  {slug:'cable-resistance',title:'Conductor Resistance Calculator'},
  {slug:'voltage-drop',title:'Voltage Drop Calculator'},
  {slug:'path-voltage-drop',title:'Multi-Segment Voltage Drop Calculator'},
  {slug:'cable-parallel',title:'Parallel Conductor Calculator'},
] as const;
export type CableRow={length:string;lengthUnit:LengthUnit;area:string;material:'cu'|'al';temperature:string;temperatureUnit:TemperatureUnit;resistance:string;reactance:string;densityUnit:ResistanceDensityUnit;current:string;pf:string;direction:'leading'|'lagging';mode:'basic'|'detailed';data:'theory'|'manufacturer';inductance:string};
export type CableValues={phase:'1'|'3';connection:'single'|'split-ll'|'split-ln'|'three';voltage:string;frequency:string;parallel:string;rows:CableRow[]};
export const cableDefaults=():CableValues=>({phase:'1',connection:'single',voltage:'120',frequency:'60',parallel:'2',rows:[{length:'100',lengthUnit:'ft',area:'3.308772876111477',material:'cu',temperature:'68',temperatureUnit:'°F',resistance:'0.1',reactance:'0.02',densityUnit:'Ω/kft',current:'20',pf:'0.9',direction:'lagging',mode:'detailed',data:'theory',inductance:'0.25'}]});
function number(raw:string,label:string,min=0,max=1e12) {
  const n=raw.trim()===''?NaN:Number(raw);
  if(!Number.isFinite(n)||n<min||n>max) throw new RangeError(`Check ${label}: enter a finite value from ${min} to ${max}.`);
  return n;
}
export function canonicalCableRow(row:CableRow,index=0):PathVoltageDropSegmentInput {
  if(!['cu','al'].includes(row.material)||!['basic','detailed'].includes(row.mode)||!['theory','manufacturer'].includes(row.data)||!['leading','lagging'].includes(row.direction)) throw new RangeError('Choose a valid material, mode and power factor direction.');
  const lengthM=convertLength(number(row.length,'one-way length',1e-9,1e7),row.lengthUnit,'m');
  const temperature=convertTemperature(number(row.temperature,'conductor temperature',-459.67,1000),row.temperatureUnit,'°C');
  if(temperature< -50||temperature>250) throw new RangeError('The resistivity model supports −50 to 250 °C only.');
  return {id:`segment-${index}`,name:`Segment ${index+1}`,phase:'1',voltageV:120,currentA:number(row.current,'current',0,1e8),pf:number(row.pf,'power factor',0,1),lengthM,mode:row.mode,
    rMode:row.data==='theory'?'size':'ohm',resistanceOhmKm:convertResistanceDensity(number(row.resistance,'AC resistance'),row.densityUnit,'Ω/km'),reactanceOhmKm:convertResistanceDensity(number(row.reactance,'reactance'),row.densityUnit,'Ω/km'),direction:row.direction,temperature,material:row.material,areaMm2:number(row.area,'nominal conductor area',1e-9,1e6)};
}
export function runUsCable(slug:string,values:CableValues,precision=6):CalculationOutcome {
  try {
    const voltage=number(values.voltage,'load voltage',1e-9),frequency=number(values.frequency,'frequency',1e-9);
    if(!['single','split-ll','split-ln','three'].includes(values.connection)) throw new RangeError('Choose a load connection.');
    const phase:'1'|'3'=values.connection==='three'?'3':'1';
    const rows=values.rows.map((row,i)=>({...canonicalCableRow(row,i),phase,voltageV:voltage,
      ...(row.data==='theory'?{reactanceOhmKm:2*Math.PI*frequency*number(row.inductance,'inductance per km',0,1e6)*1e-3}:{}),
    }));
    if(!rows.length) throw new RangeError('Add at least one segment.');
    const results:{id:string;label:string;value:number;unit:string}[]=[];
    const add=(id:string,label:string,value:number,unit:string)=>results.push({id,label,value,unit});
    if(slug==='path-voltage-drop') {
      const out=calculatePathVoltageDrop({startKind:'custom',startLabel:'Source terminals',kecReview:false,kecScope:'utility',kecSupply:'',kecLoad:'',kecDuty:'normal',segments:rows},precision);
      if(!out.ok) throw new RangeError('The segment conditions are inconsistent or outside the numerical range.');
      add('dv','Total accumulated voltage drop',out.path.totalDropV,'V');
      add('pct','Accumulated voltage drop',out.path.totalDropPct,'%');
      out.path.segments.forEach((s,i)=>{add(`segment${i+1}`,`Segment ${i+1} drop`,s.dropV,'V');add(`loss${i+1}`,`Segment ${i+1} conductor loss`,s.lossW,'W');});
      add('loss','Total conductor losses',out.path.segments.reduce((n,s)=>n+s.lossW,0),'W');
    } else {
      const row=rows[0],raw=values.rows[0];
      const theoretical=theoreticalResistance(row.material!,row.areaMm2!,row.temperature!);
      const r=row.rMode==='size'?theoretical.r:row.resistanceOhmKm!;
      const x=row.rMode==='size'?2*Math.PI*frequency*number(raw.inductance,'inductance per km',0,1e6)*1e-3:row.reactanceOhmKm!;
      if(slug==='cable-impedance') {
        const z=cableImpedance({mode:raw.data,material:raw.material,area:row.areaMm2!,length:row.lengthM,temperature:row.temperature!,frequency,inductance:number(raw.inductance,'inductance per km'),resistance:r,reactance:x});
        add('z','Impedance magnitude, one conductor',z.z,'Ω');add('r',raw.data==='theory'?'Theoretical DC resistance at conductor temperature':'Manufacturer AC resistance',z.r,'Ω');add('x','Reactance, one conductor',z.x,'Ω');
        if(z.r20!==null) add('r20','Theoretical DC resistance at 20 °C',z.r20,'Ω');
      } else if(slug==='cable-resistance') {
        add('r','Theoretical one-conductor DC resistance',theoretical.r*row.lengthM/1000,'Ω');add('r20','DC resistance at 20 °C',theoretical.r20*row.lengthM/1000,'Ω');
      } else if(slug==='cable-parallel') {
        const n=number(values.parallel,'identical parallel conductors',1,1000);
        if(!Number.isInteger(n)) throw new RangeError('The parallel conductor count must be an integer.');
        add('ieach','Current per identical parallel conductor',row.currentA/n,'A');add('req','Equivalent DC resistance of identical parallel conductors',theoretical.r*row.lengthM/1000/n,'Ω');
      } else {
        const out=acVoltageDrop({phase,voltage,current:row.currentA,length:row.lengthM,r,x:raw.mode==='basic'?0:x,pf:raw.mode==='basic'?1:row.pf!,direction:raw.direction});
        add('dv','Voltage drop',out.drop,'V');add('pct','Voltage drop percentage',out.percent,'%');add('vend','Estimated load terminal voltage',out.loadVoltage,'V');add('loss','Conductor losses',out.lossW,'W');
      }
    }
    if(results.some(m=>!Number.isFinite(m.value))) throw new RangeError('The result is outside the numerical range.');
    return {ok:true,metrics:results.map((m,i)=>({...m,value:m.value.toLocaleString('en-US',{maximumFractionDigits:precision}),primary:i===0})),inputSummary:[],interpretation:'Conductor model results; review the circuit assumptions and warnings.',formulaUsed:'R = ρ20 [1+α(T−20)] L/A; X = 2π f L; ΔV = k I ℓ (R cosφ ± X sinφ), k = 2 or √3',warnings:[
      {level:'warning',title:'Conductor model and AC effects',message:'Theoretical resistance is DC resistance using the shared material model (Cu ρ20=0.01724 Ω·mm²/m, α20=0.00393/°C; Al 0.02826 and 0.00403). It does not include skin or proximity effects. Manufacturer mode uses the supplied AC R/X without temperature correction; match its frequency and operating temperature.'},
      {level:'warning',title:'Geometry and installation',message:'AWG and kcmil describe nominal conductor area. They do not determine insulation diameter, stranded overall diameter, ampacity or conduit occupancy. Inductance/reactance depends on frequency and conductor arrangement. Enter verified manufacturer data or a justified inductance.'},
      {level:'info',title:'Circuit assumptions',message:'Length is one-way. Single-phase and a two-wire 120/240 V split-phase line-to-line load use the two-conductor factor; a 120 V line-to-neutral branch also uses two conductors. This does not model neutral imbalance or shared-neutral multiwire circuits. Three-phase calculations assume balanced loads and line-to-line voltage. Basic drop ignores PF and reactance; detailed drop is a first-order R/X approximation.'},
      {level:'warning',title:'Engineering estimate',message:'No KEC or NEC voltage-drop or ampacity acceptance is applied. Identical parallel conductors assume equal material, area, length, temperature and terminations. Verify actual current sharing. Negative drop with a leading load represents estimated voltage rise.'},
    ]};
  }catch(error){return {ok:false,fieldErrors:{},formError:error instanceof Error&&!/[\u3131-\uD79D]/.test(error.message)?error.message:'Check the conductor, circuit and segment inputs against the model limits.'};}
}
