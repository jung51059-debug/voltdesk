import fs from 'node:fs';import {project,vercelGet} from './us9b-auth.mjs';
const id='dpl_H6AVAFwg4Zx6gGdA93T9r9bBVSNd',team='team_nl057QRThUg9esXeygjDokDL';const p=await project(),d=await vercelGet(`/v13/deployments/${id}?teamId=${team}`),alias=await vercelGet(`/v4/aliases/ampory.vercel.app?teamId=${team}`);
if(d.projectId!==p.id||d.target||!['all_except_custom_domains','preview','all'].includes(p.ssoProtection?.deploymentType))throw new Error('Wrong target or protection');
const productionAfter=alias.deploymentId??alias.deployment?.id;if(productionAfter!=='dpl_75hZUXW4Fa6Y1YDjSdBk6U8syV9J')throw new Error('Production changed');
const events=await vercelGet(`/v3/deployments/${id}/events?teamId=${team}&direction=forward&follow=0`);const log=events.map(e=>e.text??e.payload?.text??'').join('\n');fs.writeFileSync('artifacts/us9b/cloud-build.log',log);
const line=log.match(/AMPORY_US9B_BUILD_PROOF (\{[^\n]+\})/),proof=line?JSON.parse(line[1]):null;
const record={deploymentId:id,previewUrl:'https://'+d.url,projectId:p.id,environment:'preview',target:d.target??null,status:d.readyState,checkedAt:new Date().toISOString(),buildId:proof?.buildId??null,node:proof?.node??null,proofEnvironment:proof?.environment??null,sourceSha256:d.meta?.sourceSha256,protection:p.ssoProtection,productionAfter};
fs.writeFileSync('artifacts/us9b/deployment.json',JSON.stringify(record,null,2));console.log(JSON.stringify(record));
if(d.readyState==='READY'){
 if(!proof||proof.environment!=='preview')throw new Error('Build proof missing');const entry=Object.entries(p.protectionBypass??{}).find(([,v])=>v.scope==='automation-bypass');if(!entry)throw new Error('No existing automation token');
 const anon=await fetch(record.previewUrl+'/us',{redirect:'manual'}),auth=await fetch(record.previewUrl+'/us',{headers:{'x-vercel-protection-bypass':entry[0]},redirect:'manual'});
 const html=await auth.text();const boundary={buildId:proof.buildId,checkedAt:new Date().toISOString(),anonymous:anon.status,authorized:auth.status,authorizedApp:html.includes('en-US'),productionUnchanged:true,credentialOriginOnly:true};fs.writeFileSync('artifacts/us9b/protection-boundary.json',JSON.stringify(boundary,null,2));console.log(JSON.stringify(boundary));if(![302,401].includes(anon.status)||auth.status!==200)throw new Error('Protection boundary failed');
}
