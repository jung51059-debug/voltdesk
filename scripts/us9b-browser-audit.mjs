import fs from 'node:fs';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url);
import {target,authorizeContext} from './us9b-auth.mjs';
const {base,buildId,headers,environment}=await target();const root='artifacts/us9b';
const data=JSON.parse(fs.readFileSync(`${root}/review-data.json`,'utf8'));


const routes=data.routes.filter(r=>r.kind!=='negative_404');
const widths=[360,390,768,1280,1440],rows=[],accessibility=[],network=[];
const quote=v=>`"${String(v??'').replaceAll('"','""')}"`;
function csv(name,items){fs.writeFileSync(name,Object.keys(items[0]??{}).map(quote).join(',')+'\n'+items.map(r=>Object.values(r).map(quote).join(',')).join('\n'));}
async function clickCalculate(page,slug){
 const button=page.getByRole('button',{name:slug==='trend-analysis'?/Analyze trend/i:/^Calculate(?: impedance)?$/i}).first();
 if(await button.count())await button.click();
 await page.waitForTimeout(70);
}
async function applyExample(page,route){
 const example=data.groupAExamples?.find(c=>c.slug===route.slug);if(!example)return;
 if(route.slug==='trend-analysis'){await page.locator('#trend-data').fill(example.inputs.raw);return;}
 // Set selection/mode first, then units, then numeric values; changing units converts existing values.
 const entries=Object.entries(example.inputs);
 for(const group of [entries.filter(([k])=>!k.endsWith('Unit')),entries.filter(([k])=>k.endsWith('Unit'))]){
  for(const [key,value]of group){const loc=page.locator(`main select[id$="-${key}"],main select[name="${key}"]`).first();if(!await loc.count())continue;
   if(await loc.locator(`option[value="${value}"]`).count()||await loc.locator('option').filter({hasText:value}).count()) await loc.selectOption(value);
  }
 }
 for(const [key,value]of entries){const loc=page.locator(`main input[id$="-${key}"],main input[name="${key}"],main textarea[id$="-${key}"]`).first();if(!await loc.count())continue;
  await loc.evaluate(el=>{let d=el.closest('details');while(d){d.open=true;d=d.parentElement?.closest('details');}});await loc.fill(value);
 }
}
async function numericResult(page,route){
 const exp=data.expectations[route.slug];if(!exp)return null;
 let loc=page.locator(`[data-us-metric="${exp.metric}"]`).first();
 if(!await loc.count()){
  if(route.slug==='rlc-impedance')loc=page.locator('dt').filter({hasText:/^Impedance magnitude/}).locator('..').locator('dd');
  else if(route.slug==='ohms-law')loc=page.locator('dt').filter({hasText:/^Power \(W\)/}).locator('..').locator('dd');
  else if(route.slug==='wire-size-converter')loc=page.locator('dt').filter({hasText:/^Nominal area \(mm²\)/}).locator('..').locator('dd');
  else if(route.slug==='conduit-fill-physical')loc=page.getByTestId('us-result');
 }
 if(!await loc.count())return {expected:exp.value,actual:null,pass:false,reason:'Result metric element missing'};
 const text=await loc.innerText(),actual=Number(text.replaceAll(',','').match(/[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?/i)?.[0]);
 // Most forms display two decimals. Fault current explicitly displays whole amperes.
 const tolerance=route.slug==='short-circuit'?0.5:0.00501;
 return {metric:exp.metric,expected:exp.value,actual,tolerance,pass:Number.isFinite(actual)&&Math.abs(actual-exp.value)<=tolerance,text};
}
const browser=await chromium.launch({headless:true});
let cursor=0;
const jobs=routes.flatMap(route=>widths.map(width=>({route,width}))).filter(j=>!process.env.US7_SMOKE||['home','search','wire-size-converter','ohms-law','short-circuit','single-phase-current','trend-analysis','load-schedule','cable-schedule','load-flow','sld','conduit-fill-physical','privacy'].includes(j.route.slug)&&j.width===390);
async function run({route,width}){
 const context=await browser.newContext({viewport:{width,height:900},colorScheme:'light'}),page=await context.newPage(),errors=[],requests=[];
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()??'',type:r.resourceType()}));
 const result={path:route.path,slug:route.slug,kind:route.kind,width,page_load:'NOT_RUN',english:'NOT_RUN',light_accessibility:'NOT_RUN',noindex:'NOT_RUN',overflow:'NOT_RUN',calculation:'N/A',independent_expected:'N/A',unit_invariance:'NOT_RUN',reset:'NOT_RUN',invalid_input:'NOT_RUN',keyboard:'NOT_RUN',dark_mode:'NOT_RUN',hydration:'NOT_RUN',console:'NOT_RUN',status:'PASS',notes:'',build_id:buildId};
 await authorizeContext(context,base,headers);
 try{
  const res=await page.goto(base+route.path,{waitUntil:'networkidle',timeout:30000});
  result.page_load=res?.status()===200?'PASS':'FAIL';
  result.noindex=/noindex/i.test(await page.locator('meta[name="robots"]').getAttribute('content')??'')?'PASS':'FAIL';
  result.english=await page.locator('html').getAttribute('lang')==='en-US'&&!/[\u3131-\uD79D]/.test((await page.locator('main').innerText()).replaceAll('정현준',''))?'PASS':'FAIL';
  result.overflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)?'PASS':'FAIL';
  if(route.kind==='calculator'){
   const initialValues=await page.locator('main input,main select,main textarea').evaluateAll(nodes=>nodes.map(n=>({id:n.id,name:n.name,value:n.value})));
   await applyExample(page,route);
   await clickCalculate(page,route.slug);const numeric=await numericResult(page,route);
   result.calculation=numeric?.actual!==null?'PASS':'FAIL';result.independent_expected=numeric?.pass?'PASS':'FAIL';result.notes=JSON.stringify(numeric);
   if(width===390){
    const selects=page.locator('main select');let unitTested=false;
    for(const sel of await selects.all()){
     const options=await sel.locator('option').evaluateAll(nodes=>nodes.map(n=>({value:n.value,text:n.textContent})));
     const value=await sel.inputValue();
     let next=null;
     for(const pair of [['ft','m'],['°F','°C'],['kW','hp'],['kW','W'],['hp','kW'],['US gal/h','L/h'],['mm²','in²'],['mm²','kcmil'],['Ω','kΩ'],['mH','H']])if(options.some(o=>o.value===pair[0])&&options.some(o=>o.value===pair[1])){next=value===pair[0]?pair[1]:pair[0];break;}
     if(!next)continue;
     const before=await numericResult(page,route);await sel.selectOption(next);await clickCalculate(page,route.slug);const after=await numericResult(page,route);
     result.unit_invariance=before&&after&&Math.abs(before.actual-after.actual)<=before.tolerance?'PASS':'FAIL';unitTested=true;break;
    }
    if(!unitTested)result.unit_invariance='N/A';
    const reset=page.getByRole('button',{name:/^Reset(?: inputs)?$/i}).first();
    if(await reset.count()){
     await reset.click();const dialog=page.getByRole('dialog');if(await dialog.count())await dialog.getByRole('button',{name:'Reset',exact:true}).click();
     await page.waitForTimeout(40);
     const resetValues=await page.locator('main input,main select,main textarea').evaluateAll(nodes=>nodes.map(n=>({id:n.id,name:n.name,value:n.value})));
     result.reset=JSON.stringify(initialValues)===JSON.stringify(resetValues)?'PASS':'FAIL';
     await applyExample(page,route);await clickCalculate(page,route.slug);
    }else result.reset='N/A';
    if(route.slug==='wire-size-converter')await page.locator('select[id$="-format"]').selectOption('mm²');
    const input=page.locator(route.slug==='field-compare'?'main input[id$="-designValue"]':route.slug==='conduit-fill-physical'?'main input[aria-label="Raceway internal area"]':'main input[inputmode="decimal"],main input[type="number"],main textarea').first();
    if(await input.count()){
     const original=await input.inputValue();const invalid=route.slug==='trend-analysis'?'bad,not-a-number':route.slug==='conduit-fill-physical'||await input.getAttribute('type')==='number'?'-5':'bad';
     await input.fill(invalid);await clickCalculate(page,route.slug);
     const alerts=page.locator('main [role="alert"],main [aria-invalid="true"]');
     result.invalid_input=await alerts.count()?'PASS':'FAIL';
     await input.fill(original);
    }else result.invalid_input='N/A';
   }else{result.unit_invariance='NOT_RUN';result.reset='NOT_RUN';result.invalid_input='NOT_RUN';}
  }else{result.unit_invariance='N/A';result.reset='N/A';result.invalid_input='N/A';}
  let lightAxe=null;
  if(width===390){await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});lightAxe=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));}
  await page.keyboard.press('Tab');result.keyboard=await page.evaluate(()=>document.activeElement!==document.body)?'PASS':'FAIL';
  result.focus_visible=await page.evaluate(()=>{const el=document.activeElement;if(!el||el===document.body)return false;const s=getComputedStyle(el);return (s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0)||s.boxShadow!=='none';})?'PASS':'FAIL';
  if(/[\u3131-\uD79D]/.test((await page.locator('main').innerText()).replaceAll('정현준','')))result.english='FAIL';
  const light=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({colorScheme:'dark'});
  // Wait for the actual React/media update rather than assume a fixed 40 ms CPU budget.
  await page.waitForFunction(previous=>getComputedStyle(document.body).backgroundColor!==previous,light,{timeout:3000}).catch(()=>{});
  const dark=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  result.dark_mode=light!==dark?'PASS':'FAIL';
  result.hydration=errors.some(e=>/hydration|Minified React error #418|#423|#425/i.test(e))?'FAIL':'PASS';
  result.console=errors.length?'FAIL':'PASS';
  if(errors.length)result.notes+='; '+errors.join(' | ').slice(0,700);
  if(width===390){
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const axe=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
   const lightUnresolved=lightAxe.violations.flatMap(v=>v.nodes.filter(n=>!(v.id==='color-contrast'&&n.html.includes('#FFC107')&&n.html.replace(/<[^>]+>/g,'').trim()==='ORY')).map(n=>({id:v.id,target:n.target,html:n.html,reason:n.failureSummary})));
   result.light_accessibility=lightUnresolved.length?'FAIL':'PASS';
   accessibility.push({path:route.path,width,lightViolationsRaw:lightAxe.violations,lightUnresolved,lightIncomplete:lightAxe.incomplete,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:axe.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),passes:axe.passes.length,build_id:buildId});
  }
  const external=requests.filter(r=>/^https?:/.test(r.url)&&new URL(r.url).origin!==base);
  network.push({path:route.path,width,external,analytics_or_ads:external.filter(r=>/google-analytics|googletagmanager|googlesyndication|doubleclick|\/collect/.test(r.url)),build_id:buildId});
 }catch(e){result.status='FAIL';result.notes+=String(e.stack??e).slice(0,800);}
 if(Object.values(result).includes('FAIL'))result.status='FAIL';
 rows.push(result);await context.close();
 if(rows.length%25===0){fs.writeFileSync(`${root}/browser-progress.json`,JSON.stringify({completed:rows.length,total:jobs.length,failed:rows.filter(r=>r.status==='FAIL').length,buildId}));console.log(`${rows.length}/${jobs.length}`);}
}
async function worker(){while(cursor<jobs.length){const job=jobs[cursor++];await run(job);}}
await Promise.all(Array.from({length:Number(process.env.US7_CONCURRENCY??3)},worker));await browser.close();
const suffix=process.env.US7_SMOKE?'-smoke':'';
fs.writeFileSync(`${root}/browser${suffix}.json`,JSON.stringify({buildId,environment,checkedAt:new Date().toISOString(),rows,accessibility,network},null,2));
csv(process.env.US7_SMOKE?`${root}/browser-smoke.csv`:'PHASE-US9B-BROWSER-QA.csv',rows);
csv(process.env.US7_SMOKE?`${root}/accessibility-smoke.csv`:'PHASE-US9B-ACCESSIBILITY-QA.csv',accessibility.map(r=>({path:r.path,viewport:r.width,automatic_axe:r.violations.length?'FAIL':'PASS',violations:JSON.stringify(r.violations),incomplete:JSON.stringify(r.incomplete),keyboard:'See browser matrix; tab focus only',focus_visibility:rows.find(x=>x.path===r.path&&x.width===390)?.focus_visible??'NOT_RUN',focus_scope:'One Tab target; computed outline/shadow, not every control',screen_reader:'NOT_RUN',build_id:buildId})));
console.log(JSON.stringify({buildId,jobs:rows.length,failures:rows.filter(r=>r.status==='FAIL'),axeViolations:accessibility.filter(r=>r.violations.length).map(r=>({path:r.path,violations:r.violations.map(v=>v.id)}))},null,2));
