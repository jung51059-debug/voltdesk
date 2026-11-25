import inventory from './release-allowlist.json';
export type UsReleaseMode='disabled'|'protected-preview'|'public';
const allowed=new Set(inventory.filter(r=>r.status==='READY_FOR_RELEASE'||r.status==='READY_NOINDEX').map(r=>r.path));
export function usBuildMode():UsReleaseMode {
 const mode=process.env.AMPORY_US_BUILD_MODE;
 return mode==='public'||mode==='protected-preview'?mode:'disabled';
}
export function isUsPublicPath(path:string){return allowed.has(path.replace(/\/$/,'')||'/');}
/** Static review inventories remain complete; only the public navigation view is filtered. */
export function isUsNavigationVisible(path:string,mode:UsReleaseMode=usBuildMode()) {return mode!=='public'||isUsPublicPath(path);}
export function usNavigationTarget(path:string,mode:UsReleaseMode=usBuildMode()) {
 if(!path.startsWith('/us')||isUsNavigationVisible(path,mode))return path;
 return path.startsWith('/us/references/')?'/us/references':path.startsWith('/us/workspaces/')?'/us/workspaces':path.startsWith('/us/tools/')?'/us/tools':'/us';
}
export function usAccessDecision(rawPath:string,mode:UsReleaseMode=usBuildMode()) {
 let path=rawPath;
 try{for(let i=0;i<3;i++){const decoded=decodeURIComponent(path);if(decoded===path)break;path=decoded;}}catch{return {isUs:rawPath.startsWith('/us'),allowed:false};}
 path=path.replaceAll('\\','/').replace(/\/{2,}/g,'/');
 const isUs=path==='/us'||path.startsWith('/us/');
 if(!isUs)return {isUs:false,allowed:true};
 if(path!==rawPath)return {isUs:true,allowed:false};
 return {isUs:true,allowed:mode==='protected-preview'||mode==='public'&&isUsPublicPath(path)};
}
export function usRuntimeMode(env:Record<string,string|undefined>=process.env):UsReleaseMode {
 const mode=usBuildMode();
 // A protected Preview artifact must fail closed if it is ever promoted to Production.
 if(env.VERCEL==='1'&&mode==='protected-preview'&&env.VERCEL_ENV!=='preview')return 'disabled';
 return mode;
}
