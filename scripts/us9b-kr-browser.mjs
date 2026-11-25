import fs from 'node:fs';
import {chromium} from 'playwright';
import {target,authorizeContext} from './us9b-auth.mjs';const t=await target(),buildId=t.buildId;
const browser=await chromium.launch({headless:true}),rows=[];
const paths=['/','/tools/electrical/single-phase-current','/tools/electrical/rlc-impedance','/tools/electrical/load-flow','/tools/schedules/load','/tools/schedules/cable','/tools/advanced/sld','/search','/favorites','/settings'];
for(const width of [390,1440])for(const path of paths){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],failedRequests=[];
 await authorizeContext(context,t.base,t.headers);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
 const res=await page.goto(t.base+path,{waitUntil:'networkidle'});let numeric='N/A';
 if(path.endsWith('single-phase-current')){
  for(const [key,value]of Object.entries({power:'3',voltage:'220',pf:'1',efficiency:'1'})){const loc=page.locator(`main input[id$="-${key}"]`).first();if(await loc.count()){await loc.evaluate(el=>{const d=el.closest('details');if(d)d.open=true;});await loc.fill(value);}}
  const calc=page.locator('main button[type="submit"]').first();if(await calc.count())await calc.click();
  const actualText=await page.locator('main section[aria-live="polite"] p.text-4xl').first().innerText(),actual=Number(actualText.replaceAll(',','').match(/[\d.]+/)?.[0]);numeric=Math.abs(actual-3000/220)<=.00501?'PASS':'FAIL';
 }
 const unexpected=errors.filter(e=>!e.includes('net::ERR_NETWORK_ACCESS_DENIED')&&!e.includes('net::ERR_NAME_NOT_RESOLVED'));
 const lang=await page.locator('html').getAttribute('lang'),overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 rows.push({path,width,http:res.status(),lang,overflow,numeric,errors,unexpected,failedRequests,status:res.status()===200&&lang==='ko'&&!overflow&&numeric!=='FAIL'&&!unexpected.length?'PASS':'FAIL',buildId});await context.close();
}
await browser.close();fs.writeFileSync('artifacts/us9b/kr-browser.json',JSON.stringify({buildId,checkedAt:new Date().toISOString(),rows},null,2));console.log(JSON.stringify({buildId,total:rows.length,failures:rows.filter(r=>r.status==='FAIL')},null,2));
