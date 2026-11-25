/** Independent, explicit worked examples. Never import a production engine here. */
export type ClosureCase = {
  slug: string; inputs: Record<string, string>; metric: string; expected: number;
  unit: string; formula: string; bad: Record<string, string>; boundary: Record<string, string>;
};
const c = (slug: string, inputs: Record<string, string>, metric: string, expected: number, unit: string,
  formula: string, bad: Record<string, string>, boundary: Record<string, string>): ClosureCase =>
  ({ slug, inputs, metric, expected, unit, formula, bad, boundary });
export const GROUP_A_CLOSURE: ClosureCase[] = [
  c('single-phase-current', {power:'3',powerUnit:'kW',voltage:'120',voltageUnit:'V',pf:'0.9',efficiency:'1'}, 'current',3000/(120*0.9),'A','I = P/(V PF η)',{voltage:'0'},{pf:'1'}),
  c('three-phase-current',{power:'10',powerUnit:'kW',voltage:'208',voltageUnit:'V',pf:'0.85',efficiency:'0.95'},'current',10000/(Math.sqrt(3)*208*0.85*0.95),'A','I = P/(√3 VLL PF η)',{pf:'0'},{pf:'1'}),
  c('amp-to-kw',{phase:'3',current:'100',voltage:'480',voltageUnit:'V',pf:'0.88'},'kw',Math.sqrt(3)*480*100*0.88/1000,'kW','P = √3 VLL I PF/1000',{current:'-1'},{pf:'1'}),
  c('kw-kva-hp',{mode:'from-hp',hp:'50',pf:'0.86'},'kva',50*0.746/0.86,'kVA','S = hp × 0.746/PF (legacy rounded horsepower; no efficiency input)',{hp:'-1'},{pf:'1'}),
  c('power-factor',{mode:'from-power',kw:'250',kva:'312'},'pf',250/312,'—','PF = P/S',{kva:'0'},{kva:'250'}),
  c('power-triangle',{mode:'pq',kw:'180',kvar:'120'},'s',Math.hypot(180,120),'kVA','S = √(P²+Q²)',{kw:'-1'},{kvar:'0'}),
  c('power-factor-correction',{powerKw:'45',pfNow:'0.72',pfTarget:'0.90',voltage:'480',phase:'3'},'qc',45*(Math.sqrt(1/0.72**2-1)-Math.sqrt(1/0.9**2-1)),'kvar','Qc = P [√(PF1⁻²−1) − √(PF2⁻²−1)]',{pfNow:'0'},{pfTarget:'0.72'}),
  c('thd',{kind:'current',fundamental:'100',harmonics:'3,4'},'thd',5,'%','THD = √(3²+4²)/100 × 100',{fundamental:'0'},{harmonics:'0'}),
  c('harmonic-filter',{qc:'300',voltage:'480',voltageUnit:'V',reactorPct:'7'},'n',1/Math.sqrt(0.07),'order','n = 1/√(reactorPct/100)',{reactorPct:'0'},{reactorPct:'100'}),
  c('motor-slip',{calcMode:'from-rpm',poles:'4',freqPreset:'60',rpm:'1750'},'slip',100*50/1800,'%','Ns = 120f/poles; s = (Ns−Nr)/Ns × 100',{poles:'0'},{rpm:'1800'}),
  c('motor-acceleration',{inertia:'2',rpm:'1750',torque:'50'},'time',2*(1750*2*Math.PI/60)/50,'s','t = J (2π rpm/60)/Tacc; constant average accelerating torque',{torque:'0'},{rpm:'1'}),
  c('transformer-load',{ratedKva:'1000',loadKw:'760',pf:'0.88',loadMode:'kw'},'ratio',760/0.88/1000*100,'%','Loading = (P/PF)/Srated × 100',{ratedKva:'0'},{loadKw:'0'}),
  c('transformer-current',{ratedKva:'750',vPrimary:'12470',vPrimaryUnit:'V',vSecondary:'480',vSecondaryUnit:'V'},'i2',750000/(Math.sqrt(3)*480),'A','I2 = S/(√3 V2LL)',{vSecondary:'0'},{ratedKva:'1'}),
  c('transformer-loss',{ratedKva:'500',noLoadKw:'1',loadLossKw:'6',loadKva:'250',pf:'0.9'},'ploss',2.5,'kW','Ploss = P0 + Pk (Sload/Srated)²',{ratedKva:'0'},{loadKva:'0'}),
  c('transformer-parallel',{s1:'750',z1:'5.75',s2:'500',z2:'6.25',loadKva:'900'},'p1',900*(750/5.75)/(750/5.75+500/6.25),'kVA','S1load = Sload (S1/Z1)/(S1/Z1+S2/Z2)',{z1:'0'},{loadKva:'1'}),
  c('transformer-impedance',{mode:'percent',ratedKva:'1000',voltage:'480',voltageUnit:'V',zPct:'5.5'},'z',0.055*480**2/1000000,'Ω','Zbase = VLL²/S3φ; |Z| = Zbase × %Z/100',{zPct:'0'},{zPct:'0.001'}),
  c('rlc-impedance',{circuit:'RLC',r:'10',l:'100',c:'100',frequency:'60',voltage:'208',rUnit:'Ω',lUnit:'mH',cUnit:'μF',frequencyUnit:'Hz',voltageUnit:'V'},'z',Math.hypot(10,2*Math.PI*60*0.1-1/(2*Math.PI*60*0.0001)),'Ω','|Z| = √(R²+(ωL−1/(ωC))²)',{frequency:'0'},{r:'0'}),
  c('ct-ratio',{loadCurrent:'450',primary:'600',secondary:'5'},'i2',3.75,'A','I2 = I1 Israted/Iprated; ideal CT',{primary:'0'},{loadCurrent:'1'}),
  c('pt-ratio',{vPrimary:'12470',vPrimaryUnit:'V',vSecondary:'120',vSecondaryUnit:'V'},'n',12470/120,'—','n = Vrated primary/Vrated secondary; no measured voltage field',{vSecondary:'0'},{vSecondary:'1'}),
  c('busbar',{current:'800',width:'100',thickness:'10',bars:'1'},'j',0.8,'A/mm²','J = I/(width × thickness × bars); no resistance model',{width:'0'},{current:'1'}),
  c('lux',{length:'10',width:'5',lux:'500',lumens:'5000',uf:'0.6',mf:'0.8'},'n',11,'fixtures','N = ceil(E A/(Φ UF MF))',{lumens:'0'},{uf:'1'}),
  c('lighting-density',{watts:'12000',area:'1000'},'lpd',12,'W/m²','LPD = P/A',{area:'0'},{watts:'1'}),
  c('solar-pv',{mode:'grid',dailyKwh:'360',psh:'4.5',panelW:'400',efficiency:'0.8'},'kwp',100,'kWp','PVdc = Edaily/(PSH × PR); energy balance only',{psh:'0'},{efficiency:'1'}),
  c('soil-resistivity',{spacing:'10',resistance:'8'},'rho',2*Math.PI*10*8,'Ω·m','ρa = 2π a R; shallow Wenner electrodes; homogeneous approximation',{spacing:'0'},{resistance:'0.001'}),
  c('field-compare',{designValue:'480',measuredValue:'472',toleranceMode:'percent',tolerancePct:'2',unit:'V',itemName:'Voltage'},'devpct',-8/480*100,'%','Deviation = (measured−design)/design × 100',{tolerancePct:'-1'},{measuredValue:'480'}),
  c('duty-cycle',{periodHours:'24',onHours:'12',offHours:'12',starts:'6'},'rt',50,'%','Runtime ratio = ON/observation × 100; no average-current calculation',{periodHours:'0'},{onHours:'0'}),
  c('trend-analysis',{raw:'100\n102\n101\n99\n103'},'avg',101,'input units','Mean = Σx/n = 505/5; sample SD = √(10/4)',{raw:'bad'},{raw:'100'}),
  c('retrofit-compare',{baselineKw:'300',proposedKw:'237.5',baselineHours:'4000',proposedHours:'4000'},'de',250000,'kWh','ΔE = Pbaseline tbaseline − Pproposed tproposed',{baselineKw:'-1'},{proposedKw:'300'}),
  c('equipment-load',{ratedKw:'150',avgKw:'105',runHours:'12',periodHours:'24'},'lf',70,'%','Load ratio = Paverage/Prated × 100; runtime = trun/tperiod',{ratedKw:'0'},{avgKw:'0'}),
  c('energy-intensity',{kwh:'850000',denominator:'4250',unitLabel:'m²'},'ei',200,'kWh/m²','EUI = E/A; same reporting period for comparisons',{denominator:'0'},{kwh:'0'}),
];
