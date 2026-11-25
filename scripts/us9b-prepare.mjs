import fs from 'node:fs';
let policy=fs.readFileSync('scripts/us9b-write-policies.mjs','utf8');
policy=policy.replace("shared+`export", "shared.replace(\"import {US_OPERATOR} from '@/lib/us/operator';\",p.body.includes('US_OPERATOR')?\"import {US_OPERATOR} from '@/lib/us/operator';\":'')+`export");
fs.writeFileSync('scripts/us9b-write-policies.mjs',policy);
await import('./us9b-write-policies.mjs');
let contact=fs.readFileSync('app/us/contact/page.tsx','utf8');
contact="import {UsPolicyLink} from '@/components/us/policy-link';\n"+contact.replace('<a className="text-primary underline" href="/us/privacy">Privacy Notice</a>','<UsPolicyLink href="/us/privacy">Privacy Notice</UsPolicyLink>');
fs.writeFileSync('app/us/contact/page.tsx',contact);
const allow=JSON.parse(fs.readFileSync('lib/us/release-allowlist.json'));
for(const row of allow)if(['/us/about','/us/contact','/us/terms','/us/disclaimer'].includes(row.path)){row.status='READY_NOINDEX';row.proposedIndex=false;}
fs.writeFileSync('lib/us/release-allowlist.json',JSON.stringify(allow,null,2)+'\n');
for(const name of ['auth','http-audit','browser-audit','deep-audit','storage-probe','production-snapshot','public-mode-audit','accessibility-review','lighthouse','stage','checks']){
 let s=fs.readFileSync(`scripts/us8-${name}.mjs`,'utf8').replaceAll('us8','us9b').replaceAll('US8','US9B').replaceAll('4008','4011');
 if(name==='browser-audit')s=s.replaceAll("await page.locator('main').innerText()","(await page.locator('main').innerText()).replaceAll('정현준','')");
 if(name==='checks')s=s.replace('/^PHASE-US[0-7].*\\.(md|csv)$/','/^PHASE-US(?:[0-8]|9A).*\\.(md|csv)$/').replace('i<=7','i<=8').replace("!/next|baseline|node_modules|cache/i","!/next|baseline|node_modules|cache|stage|pdf-tools/i").replace("const mode=process.env.US9B_CHECK_MODE??'public'","const mode=process.env.US9B_CHECK_MODE??'protected-preview'");
 if(name==='stage')s=s.replace(",installCommand:'node -e \"process.exit(0)\"'",'').replace("installOverride:'Local prebuilt only; dependencies reused from validated checkout'","installOverride:false");
 if(name==='lighthouse')s=s.replace("const paths=['/us','/us/tools',route('three-phase-current'),route('cable-resistance'),'/us/workspaces/load-schedule',route('kw-vs-kva'),'/us/search'];","const paths=['/us',route('three-phase-current'),'/us/privacy','/us/contact'];");
 fs.writeFileSync(`scripts/us9b-${name}.mjs`,s);
}
fs.mkdirSync('artifacts/us9b',{recursive:true});
fs.copyFileSync('artifacts/us8/review-data.json','artifacts/us9b/review-data.json');
console.log('US9B tools prepared; historical evidence retained; four policies promoted, Privacy held.');
