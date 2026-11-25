import fs from 'node:fs';import path from 'node:path';
const projectId='prj_yiJVIAEYHjzA3PALYFjtdfSRFW7a',teamId='team_nl057QRThUg9esXeygjDokDL';
export async function vercelGet(route){const auth=JSON.parse(fs.readFileSync(path.join(process.env.APPDATA,'com.vercel.cli/Data/auth.json'),'utf8'));const r=await fetch('https://api.vercel.com'+route,{headers:{Authorization:'Bearer '+(process.env.VERCEL_TOKEN||auth.token)}});if(!r.ok)throw new Error(`Read-only Vercel API ${r.status}`);return r.json();}
export async function project(){const p=await vercelGet(`/v9/projects/${projectId}?teamId=${teamId}`);if(p.id!==projectId||p.name!=='ampory'||p.accountId!==teamId)throw new Error('Project identity mismatch');return p;}
export async function target(){
 const deployment=JSON.parse(fs.readFileSync('artifacts/us9b/deployment.json','utf8'));
 const base=process.env.US9B_BASE_URL??deployment.previewUrl;
 if(new URL(base).hostname==='127.0.0.1')return {base,buildId:deployment.buildId,headers:{},environment:'SAME_SOURCE_LOCAL'};
 if(base!==deployment.previewUrl)throw new Error('Refuse credentials outside verified deployment origin');
 const p=await project();if(!['all_except_custom_domains','preview','all'].includes(p.ssoProtection?.deploymentType))throw new Error('Deployment protection not verified');
 const entry=Object.entries(p.protectionBypass??{}).find(([,value])=>value.scope==='automation-bypass');
 if(!entry)throw new Error('No existing approved automation credential; do not create or disable protection');
 return {base,buildId:deployment.buildId,headers:{'x-vercel-protection-bypass':entry[0]},environment:'VERCEL_PROTECTED_PREVIEW'};
}
/** Only the exact Preview origin receives its credential. Never set global browser headers. */
export async function authorizeContext(context,base,headers){await context.route('**/*',route=>{const url=new URL(route.request().url());return route.continue({headers:{...route.request().headers(),...url.origin===new URL(base).origin?headers:{}}});});}
