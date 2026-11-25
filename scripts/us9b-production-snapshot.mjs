import fs from 'node:fs';import {JSDOM} from 'jsdom';import {vercelGet} from './us9b-auth.mjs';
const suffix=process.env.US9B_POSTFLIGHT?'after':'before',base='https://ampory.vercel.app';
const alias=await vercelGet('/v4/aliases/ampory.vercel.app?teamId=team_nl057QRThUg9esXeygjDokDL'),rows=[];
for(const path of ['/','/tools/electrical/three-phase-current','/references/kw-vs-kva','/tools/electrical/load-flow','/tools/schedules/load','/tools/advanced/sld','/sitemap.xml','/robots.txt','/us']){
 const r=await fetch(base+path),html=await r.text(),dom=new JSDOM(html),doc=dom.window.document;
 rows.push({path,http:r.status,title:doc.title,canonical:doc.querySelector('link[rel="canonical"]')?.href??'',lang:doc.documentElement.lang,usHeaderLink:!!doc.querySelector('header a[href^="/us"]'),adsScript:html.includes('adsbygoogle'),gaScript:html.includes('googletagmanager.com'),sitemap:path==='/sitemap.xml'?[...html.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]).sort():undefined,robots:path==='/robots.txt'?html:undefined});dom.window.close();
}
const report={checkedAt:new Date().toISOString(),environment:'ACTUAL_EXISTING_PRODUCTION',deploymentId:alias.deploymentId||alias.deployment?.id,alias:alias.alias,rows};fs.writeFileSync(`artifacts/us9b/production-${suffix}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({deploymentId:report.deploymentId,rows:rows.map(r=>({path:r.path,http:r.http})),sitemap:rows.find(r=>r.sitemap)?.sitemap.length}));
