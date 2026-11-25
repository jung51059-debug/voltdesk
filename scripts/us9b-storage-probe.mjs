import {chromium} from 'playwright';
import fs from 'node:fs';
import {target,authorizeContext} from './us9b-auth.mjs';
const {base,buildId,headers}=await target();const browser=await chromium.launch({headless:true}),rows=[];
for(const slug of ['load-flow','load-schedule','cable-schedule','sld']){
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
 await authorizeContext(context,base,headers);
 await page.goto(`${base}/us/workspaces/${slug}`,{waitUntil:'networkidle'});
 const add=page.getByRole('button',{name:slug==='load-flow'?'Add bus':slug==='load-schedule'?'Add row':slug==='cable-schedule'?'Add feeder':'Add Utility',exact:true}).first();await add.click();await page.waitForTimeout(100);
 const before=await page.locator('main').innerText();await page.reload({waitUntil:'networkidle'});const after=await page.locator('main').innerText();
 rows.push({slug,retained:before===after,errors,buildId:buildId});await context.close();
}
await browser.close();fs.writeFileSync('artifacts/us9b/storage-probe.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
