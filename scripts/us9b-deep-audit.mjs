import fs from 'node:fs';
import {chromium} from 'playwright';
const data=JSON.parse(fs.readFileSync('artifacts/us9b/review-data.json'));
import {target,authorizeContext} from './us9b-auth.mjs';
const {base,buildId,headers,environment}=await target();
const browser=await chromium.launch({headless:true}),rows=[],requests=[];
async function newContext(options){const c=await browser.newContext(options);await authorizeContext(c,base,headers);return c;}
const record=(test,pass,evidence)=>rows.push({test,status:pass?'PASS':'FAIL',evidence,buildId});
for(const workspace of data.workspaces){
 const context=await newContext({acceptDownloads:true}),page=await context.newPage();
 page.on('request',r=>requests.push({scope:`${workspace.slug}-functional`,url:r.url(),body:r.postData()??''}));
 await page.goto(base+workspace.href,{waitUntil:'networkidle'});
 if(workspace.slug==='load-flow'){
  const cells=await page.locator('main table tbody tr').nth(1).locator('td').allTextContents();
  const expectedVoltage=100*Math.sqrt(480**2-2*(.08*50000+.04*20000))/480,expectedLoss=(50000**2+20000**2)/480**2*.08/1000;
  record('load-flow: independent UI voltage/loss',Math.abs(Number(cells[1])-expectedVoltage)<.0051&&(await page.locator('main').innerText()).includes(expectedLoss.toFixed(3)),{expectedVoltage,expectedLoss,cells});
  await page.getByLabel('Source line-to-line voltage (V)').fill('0');record('load-flow: invalid voltage',await page.getByRole('alert').count()>0,'Zero source voltage rejected');
 }else if(workspace.slug==='load-schedule'){
  await page.getByLabel('Load 1 quantity',{exact:true}).fill('2');await page.getByLabel('Load 1 kW per unit',{exact:true}).fill('10');await page.getByLabel('Load 1 user demand factor',{exact:true}).fill('0.5');await page.getByLabel('Load 1 power factor',{exact:true}).fill('0.8');await page.getByLabel('Load 1 voltage',{exact:true}).selectOption('480');await page.getByLabel('Load 1 phase',{exact:true}).selectOption('3');
  const body=await page.locator('main').innerText(),amps=10000/(Math.sqrt(3)*480*.8);
  record('load-schedule: independent UI power/current',body.includes('Connected: 20.00 kW')&&body.includes('Demand: 10.00 kW')&&body.includes(`${amps.toFixed(1)} A`),{connected:20,demand:10,amps});
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV',exact:true}).click();const download=await event,text=fs.readFileSync(await download.path(),'utf8');record('load-schedule: local CSV export',text.includes('Load 1')&&text.includes('connectedKw')&&!/[\u3131-\uD79D]/.test(text),{filename:download.suggestedFilename(),bytes:Buffer.byteLength(text)});
  await page.getByLabel('Load 1 user demand factor',{exact:true}).fill('2');record('load-schedule: invalid factor',await page.getByRole('alert').count()>0,'Factor above 1 rejected');
 }else if(workspace.slug==='cable-schedule'){
  await page.getByLabel('FDR-1 remark',{exact:true}).fill('US7_PRIVATE_FEEDER_73919');
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV',exact:true}).click();const download=await event,text=fs.readFileSync(await download.path(),'utf8');record('cable-schedule: local CSV inventory export',text.includes('350 kcmil')&&text.includes('US7_PRIVATE_FEEDER_73919'),{filename:download.suggestedFilename(),bytes:Buffer.byteLength(text)});
  await page.getByLabel('FDR-1 current',{exact:true}).fill('-1');record('cable-schedule: invalid current',await page.getByRole('alert').count()>0,'Negative current rejected');
 }else{
  const before=await page.locator('main svg circle').count();await page.getByRole('button',{name:'Add Utility',exact:true}).click();record('sld: list and SVG edit',await page.locator('main svg circle').count()===before+1,'One actual node added to list/SVG; no electrical computation');
 }
 await context.close();
}
for(const workspace of data.workspaces){
 const context=await newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>requests.push({scope:workspace.slug,url:r.url(),body:r.postData()??''}));
 await context.addInitScript(({key})=>{localStorage.setItem(key,'{broken-json-US7_PRIVATE_DRAFT');localStorage.setItem('voltdesk:load-schedule','KR_SENTINEL_US7');},{key:workspace.storageKey});
 await page.goto(base+workspace.href,{waitUntil:'networkidle'});
 record(`${workspace.slug}: malformed draft`,await page.getByRole('alert').count()>0&&await page.evaluate(key=>localStorage.getItem(key),workspace.storageKey)==='{broken-json-US7_PRIVATE_DRAFT','Warning shown; raw malformed data retained');
const add=page.getByRole('button',{name:workspace.slug==='load-flow'?'Add bus':workspace.slug==='load-schedule'?'Add row':workspace.slug==='cable-schedule'?'Add feeder':'Add Utility',exact:true}).first();await add.click();
 record(`${workspace.slug}: KR isolation`,await page.evaluate(()=>localStorage.getItem('voltdesk:load-schedule'))==='KR_SENTINEL_US7','KR sentinel unchanged');
 record(`${workspace.slug}: malformed-draft hydration`,errors.length===0,errors);
 await context.close();
 const quotaContext=await newContext(),quotaPage=await quotaContext.newPage();
 await quotaContext.addInitScript(key=>{const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Quota exceeded','QuotaExceededError');return native.call(this,k,v);};},workspace.storageKey);
 await quotaPage.goto(base+workspace.href,{waitUntil:'networkidle'});
 await quotaPage.getByRole('button',{name:workspace.slug==='load-flow'?'Add bus':workspace.slug==='load-schedule'?'Add row':workspace.slug==='cable-schedule'?'Add feeder':'Add Utility',exact:true}).first().click();
 record(`${workspace.slug}: quota failure`,await quotaPage.getByRole('alert').filter({hasText:/storage.*unavailable or full/}).count()>0,'Save failure is visible');await quotaContext.close();
}
const context=await newContext({viewport:{width:390,height:900}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('request',r=>requests.push({scope:'region-and-services',url:r.url(),body:r.postData()??''}));
await page.goto(base+'/us/search',{waitUntil:'networkidle'});
console.log('Service controls',await page.locator('main input').evaluateAll(ns=>ns.map(n=>({placeholder:n.placeholder,type:n.type}))));
const search=page.locator('main input').first();await search.fill('US7_PRIVATE_SEARCH_73919');record('search private query local',!(new URL(page.url()).search.includes('US7_PRIVATE_SEARCH')),page.url());
await search.fill('fault current');await page.waitForTimeout(150);record('fault current actual links',await page.locator(`main a[href="${data.routes.find(r=>r.slug==='short-circuit').path}"]`).count()>0,'Actual short-circuit route rendered');
await page.goto(base+'/us/settings',{waitUntil:'networkidle'});await page.getByLabel('Default voltage (V)').fill('208');await page.getByLabel('Frequency (Hz)').selectOption('60');await page.reload({waitUntil:'networkidle'});record('settings persisted',await page.getByLabel('Default voltage (V)').inputValue()==='208','208 V, 60 Hz');
const favoritePath=data.routes.find(r=>r.slug==='three-phase-current').path;
await page.goto(base+'/us/tools',{waitUntil:'networkidle'});
const title=data.index.find(i=>i.href===favoritePath).title;
const fav=page.getByRole('button',{name:`Add ${title} to favorites`,exact:true});if(await fav.count()){await fav.click();await page.goto(base+'/us/favorites',{waitUntil:'networkidle'});record('favorite persisted',await page.locator(`main a[href="${favoritePath}"]`).count()>0,'Calculator starred in hub; favorite list actual route');}else record('favorite persisted',false,'Favorite control missing');
await page.goto(base+'/us',{waitUntil:'networkidle'});
console.log('region links',await page.locator('header a').evaluateAll(ns=>ns.map(n=>({text:n.textContent,href:n.getAttribute('href')}))));
await page.getByRole('link',{name:'Switch to South Korea site'}).click();await page.waitForURL(base+'/');await page.waitForLoadState('networkidle');record('KR switch target',await page.locator('html').getAttribute('lang')==='ko','Actual country-switch link, full document navigation US → KR');
record('KR public menu US hidden',await page.locator('header a[href^="/us"]').count()===0,'No US links in KR public header');
await page.goto(base+'/us',{waitUntil:'networkidle'});record('US switch target',await page.locator('html').getAttribute('lang')==='en-US','Full document navigation KR → US');
const menu=page.getByRole('button',{name:'Open menu'});if(await menu.count()){await menu.click();record('mobile menu',await page.getByRole('button',{name:'Close menu'}).getAttribute('aria-expanded')==='true','Accessible name and expanded state');}
record('region/service console',errors.filter(e=>!e.includes('net::ERR_NETWORK_ACCESS_DENIED')).length===0,{errors,scope:'Sandbox-blocked KR ad script is retained as evidence; US-only console errors separately strict in 530 matrix'});
const external=requests.filter(r=>/^https?:/.test(r.url)&&!r.url.startsWith(base));
record('US private sentinel network',!external.some(r=>/US7_PRIVATE/.test(r.url+r.body)),external);
await context.close();await browser.close();fs.writeFileSync('artifacts/us9b/deep-audit.json',JSON.stringify({buildId,environment,checkedAt:new Date().toISOString(),rows,external,requests},null,2));console.log(JSON.stringify(rows,null,2));
