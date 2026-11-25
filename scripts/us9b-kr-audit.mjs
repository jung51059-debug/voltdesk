import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {target} from './us9b-auth.mjs';const t=await target();const root='artifacts/us9b',checks={buildId:t.buildId,buildDirectory:JSON.parse(fs.readFileSync('artifacts/us9b/build-public.json')).dist},data=JSON.parse(fs.readFileSync(`${root}/review-data.json`));
const baseline='artifacts/us3/baseline-770b7dd/.next/server/app';
const xml=fs.readFileSync(`${baseline}/sitemap.xml.body`,'utf8'),currentXml=await(await fetch(t.base+'/sitemap.xml',{headers:t.headers})).text();
const urls=s=>[...s.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]).sort();
const old=urls(xml),now=urls(currentXml),rows=[];
const parse=html=>{const d=new JSDOM(html),doc=d.window.document;const value={title:doc.title,description:doc.querySelector('meta[name="description"]')?.content??'',canonical:doc.querySelector('link[rel="canonical"]')?.href??'',lang:doc.documentElement.lang};d.window.close();return value;};
for(const url of now){
 const pathname=new URL(url).pathname,res=await fetch(t.base+pathname,{headers:t.headers}),html=await res.text(),current=parse(html);
 const oldFile=`${baseline}/${pathname==='/'?'index':pathname.slice(1)}.html`;
 const previous=fs.existsSync(oldFile)?parse(fs.readFileSync(oldFile,'utf8')):null;
 rows.push({path:pathname,http:res.status,metadata:previous?(JSON.stringify(previous)===JSON.stringify(current)?'PASS':'FAIL'):'NOT_RUN',previous,current,staticInSameSourceLocalPublicBuild:!!JSON.parse(fs.readFileSync(`${checks.buildDirectory}/prerender-manifest.json`)).routes[pathname],buildId:checks.buildId});
}
const tracked=execFileSync('git',['ls-tree','-r','--name-only','770b7dd','lib/calculations','lib/math'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>!p.includes('.test.')&&p.endsWith('.ts'));
const engines=tracked.map(path=>({path,unchanged:fs.existsSync(path)&&execFileSync('git',['show',`770b7dd:${path}`],{encoding:'utf8'}).replaceAll('\r\n','\n')===fs.readFileSync(path,'utf8').replaceAll('\r\n','\n')}));
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),origin=execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim();
const report={buildId:checks.buildId,checkedAt:new Date().toISOString(),head,origin,baseline:'770b7dd',sitemap:{baseline:old.length,current:now.length,setEqual:JSON.stringify(old)===JSON.stringify(now),us:now.filter(p=>new URL(p).pathname.startsWith('/us')).length},published:data.kr.published.length,articles:data.kr.articles,rows,engines};
fs.writeFileSync(`${root}/kr-regression.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({head,sitemap:report.sitemap,published:report.published,articles:report.articles,httpFailures:rows.filter(r=>r.http!==200),metadataFailures:rows.filter(r=>r.metadata==='FAIL'),notStatic:rows.filter(r=>!r.staticInSameSourceLocalPublicBuild),engineChanges:engines.filter(e=>!e.unchanged)},null,2));
