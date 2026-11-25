import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {target} from './us9b-auth.mjs';
const {base,buildId,headers,environment}=await target();const root='artifacts/us9b';
const data=JSON.parse(fs.readFileSync(`${root}/review-data.json`,'utf8'));

const quote=v=>`"${String(v??'').replaceAll('"','""')}"`;
const csv=(name,rows)=>fs.writeFileSync(name,Object.keys(rows[0]??{}).map(quote).join(',')+'\n'+rows.map(r=>Object.values(r).map(quote).join(',')).join('\n'));
const normalize=s=>s.replace(/\s+/g,' ').trim();
const rows=[],schemas=[],edges=[],externalLinks=[],bodies={},httpCache=new Map();
for(const route of data.routes){
 const started=performance.now(),res=await fetch(base+route.path,{headers,redirect:'manual'}),html=await res.text();
 const dom=new JSDOM(html),doc=dom.window.document;
 const meta=n=>doc.querySelector(`meta[name="${n}"]`)?.content??'';
 const canonical=doc.querySelector('link[rel="canonical"]')?.href??'';
 const main=doc.querySelector('main')??doc.body;
 const visible=main.cloneNode(true);visible.querySelectorAll('script,style').forEach(n=>n.remove());
 const body=normalize(visible.textContent??'');bodies[route.path]=body;
 const ld=[];for(const node of doc.querySelectorAll('script[type="application/ld+json"]')){
  try{const value=JSON.parse(node.textContent);ld.push(...(Array.isArray(value)?value:[value]));}catch(e){schemas.push({path:route.path,type:'INVALID_JSON',status:'FAIL',notes:String(e),build_id:buildId});}
 }
 const flat=ld.flatMap(v=>v['@graph']??[v]);
 for(const schema of flat){
  const issues=[];
  if(!schema['@type'])issues.push('missing type');
  if(schema.aggregateRating||schema.review)issues.push('unsupported ratings/reviews require evidence');
  if(schema['@type']==='FAQPage') for(const q of schema.mainEntity??[]){if(!body.includes(normalize(q.name??''))||!body.includes(normalize(q.acceptedAnswer?.text??'')))issues.push('FAQ text does not match initial visible content');}
  schemas.push({path:route.path,type:schema['@type']??'',status:issues.length?'FAIL':'PASS',notes:issues.join(';')||'JSON parse and content correspondence checked; not a Google rich-result eligibility guarantee',build_id:buildId});
 }
 if(!flat.length) schemas.push({path:route.path,type:'none',status:'N/A',notes:'No structured data emitted; no unsupported schema invented',build_id:buildId});
 const negative=route.kind==='negative_404';
 const self=canonical&&new URL(canonical,base).pathname===route.path;
 const h1=[...doc.querySelectorAll('h1')].map(n=>normalize(n.textContent??'')).join(' | ');
 const title=doc.title,desc=meta('description'),og=doc.querySelector('meta[property="og:title"]')?.content??'';
 const issues=[];
 if(res.status!==(negative?404:200))issues.push('HTTP');
 if(!negative&&doc.documentElement.lang!=='en-US')issues.push('lang');
 if(!/noindex/i.test(meta('robots')))issues.push('noindex');
 if(!negative){if(!self)issues.push('canonical');if(!title)issues.push('title');if(!desc||/[\u3131-\uD79D]/.test(desc))issues.push('description');if(!h1)issues.push('H1');if(!og)issues.push('OG');if(body.length<80)issues.push('initial body');}
 if(doc.querySelector('link[hreflang]'))issues.push('public hreflang');
 httpCache.set(route.path,res.status);
 rows.push({path:route.path,kind:route.kind,status:res.status,lang:doc.documentElement.lang,noindex:/noindex/i.test(meta('robots'))?'PASS':'FAIL',canonical,self_canonical:negative?'N/A':self?'PASS':'FAIL',title,description:desc,h1,og_title:og,initial_html_bytes:Buffer.byteLength(html),initial_main_chars:body.length,breadcrumb:doc.querySelector('nav[aria-label*="readcrumb"]')||flat.some(s=>s['@type']==='BreadcrumbList')?'PRESENT':'N/A',cache_control:res.headers.get('cache-control')??'',ttfb_and_body_ms:+(performance.now()-started).toFixed(2),result:issues.length?'FAIL':'PASS',notes:issues.join(';'),build_id:buildId});
 for(const a of doc.querySelectorAll('a[href]')){
  const raw=a.getAttribute('href');if(/^https?:/.test(raw??''))externalLinks.push({from:route.path,url:raw,label:normalize(a.textContent??'')});if(!raw?.startsWith('/us'))continue;
  const target=new URL(raw,base).pathname;edges.push({from:route.path,target,label:normalize(a.textContent??'')});
 }
 dom.window.close();
}
const uniqueEdges=[...new Map(edges.map(e=>[`${e.from}|${e.target}`,e])).values()];
for(const edge of uniqueEdges){if(!httpCache.has(edge.target)){const r=await fetch(base+edge.target,{method:'HEAD',headers,redirect:'manual'});httpCache.set(edge.target,r.status);}edge.status=httpCache.get(edge.target);edge.result=edge.status===200?'PASS':'FAIL';edge.build_id=buildId;}
const duplicates={titles:[],descriptions:[]};
for(const [key,prop] of [['titles','title'],['descriptions','description']]){
 const map=new Map();for(const row of rows.filter(r=>r.kind!=='negative_404')){const list=map.get(row[prop])??[];list.push(row.path);map.set(row[prop],list);}duplicates[key]=[...map].filter(([v,list])=>v&&list.length>1).map(([value,paths])=>({value,paths}));
}
const processInfo='Actual protected Vercel deployment';
const report={buildId,environment,base,cwd:process.cwd(),checkedAt:new Date().toISOString(),processInfo,rows,schemas,edges:uniqueEdges,externalLinks,duplicates};
fs.writeFileSync(`${root}/http-audit.json`,JSON.stringify(report,null,2));fs.writeFileSync(`${root}/initial-bodies.json`,JSON.stringify(bodies,null,2));
csv('PHASE-US9B-HTTP-SEO-QA.csv',rows);csv(`${root}/structured-data-qa.csv`,schemas);csv(`${root}/internal-links.csv`,uniqueEdges);
console.log(JSON.stringify({buildId,http:rows.length,failed:rows.filter(r=>r.result==='FAIL'),schemaFailures:schemas.filter(r=>r.status==='FAIL'),duplicates,links:uniqueEdges.length,broken:uniqueEdges.filter(e=>e.result==='FAIL')},null,2));
