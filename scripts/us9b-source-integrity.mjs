import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const m=JSON.parse(fs.readFileSync('artifacts/us9b/stage-manifest.json','utf8')),restored=[];
for(const file of ['tsconfig.json','next-env.d.ts']){
 const source=fs.readFileSync(path.join(m.stage,file),'utf8'),current=fs.readFileSync(file,'utf8');if(source===current)continue;
 if(file==='tsconfig.json'){const a=JSON.parse(source),b=JSON.parse(current);delete a.include;delete b.include;if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('Unrelated tsconfig mutation; refuse overwrite');const old=JSON.parse(source).include??[];if((JSON.parse(current).include??[]).some(v=>!old.includes(v)&&!v.startsWith('artifacts/us9b/next-')))throw new Error('Unexpected include change');}
 else{const normalize=s=>s.replace(/import ["']\.\/[^"']*types\/(?:routes|root-params)\.d\.ts["'];?/g,'').replaceAll('\r\n','\n');if(normalize(source)!==normalize(current))throw new Error('Unexpected next-env mutation');}
 fs.writeFileSync(file,source);restored.push({file,reason:'Restore only automatic local QA dist type-path additions to exact staged source'});
}
const rows=m.files.filter(r=>!['.vercelignore','vercel.json','us9b-build-proof.mjs'].includes(r.path)).map(r=>({path:r.path,match:fs.existsSync(r.path)&&crypto.createHash('sha256').update(fs.readFileSync(r.path)).digest('hex')===r.sha256}));
fs.writeFileSync('artifacts/us9b/source-integrity.json',JSON.stringify({checkedAt:new Date().toISOString(),sourceSha256:m.sourceSha256,restored,rows},null,2));console.log(JSON.stringify({compared:rows.length,restored,failed:rows.filter(r=>!r.match)}));if(rows.some(r=>!r.match))process.exitCode=1;
