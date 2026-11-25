import fs from 'node:fs';import {JSDOM} from 'jsdom';
const inventory=JSON.parse(fs.readFileSync('lib/us/release-allowlist.json')),rows=[],links=[];
for(const r of inventory){const response=await fetch('http://127.0.0.1:4011'+r.path),html=await response.text(),expected=r.status.startsWith('READY_')?200:404,dom=new JSDOM(html),doc=dom.window.document;
 const noindex=expected===404?/noindex/.test(response.headers.get('x-robots-tag')??''):/noindex/.test(doc.querySelector('meta[name="robots"]')?.content??'');
 rows.push({path:r.path,expected,actual:response.status,noindex,result:response.status===expected&&noindex?'PASS':'FAIL',environment:'LOCAL_ISOLATED_PUBLIC_MODE'});
 if(expected===200)for(const a of doc.querySelectorAll('a[href^="/us"]')){const target=new URL(a.getAttribute('href'),'http://localhost').pathname,entry=inventory.find(r=>r.path===target);links.push({from:r.path,target,result:entry?.status.startsWith('READY_')?'PASS':'FAIL'});}dom.window.close();
}
const blocked=inventory.filter(r=>r.status.startsWith('BLOCKED'));
for(const r of blocked){const response=await fetch('http://127.0.0.1:4011'+r.path+'?mode=protected-preview&preview=true',{headers:{'x-ampory-mode':'protected-preview','x-ampory-region':'KR','x-ampory-pathname':'/us','x-middleware-subrequest':'proxy:proxy:proxy:proxy:proxy',cookie:'AMPORY_US_BUILD_MODE=protected-preview'}});rows.push({path:r.path,expected:404,actual:response.status,noindex:/noindex/.test(response.headers.get('x-robots-tag')??''),result:response.status===404?'PASS':'FAIL',environment:'LOCAL_FORGED_REQUEST'});}
fs.writeFileSync('artifacts/us9b/public-mode-audit.json',JSON.stringify({buildId:JSON.parse(fs.readFileSync('artifacts/us9b/build-public.json')).buildId,checkedAt:new Date().toISOString(),rows,links},null,2));console.log(JSON.stringify({checks:rows.length,failed:rows.filter(r=>r.result==='FAIL'),links:links.length,blockedLinks:links.filter(r=>r.result==='FAIL')},null,2));
