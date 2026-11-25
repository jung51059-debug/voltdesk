import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root='artifacts/us9b';fs.mkdirSync(root,{recursive:true});
const history=new Map();for(const file of fs.readdirSync('.'))if(/^PHASE-US(?:[0-8]|9A).*\.(md|csv)$/.test(file))history.set(file,fs.readFileSync(file));
function backup(dir){if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory()){if(!/next|baseline|node_modules|cache|stage|pdf-tools/i.test(item.name))backup(p);}else if(/\.(json|csv|md|txt|log)$/.test(item.name)&&fs.statSync(p).size<10e6)history.set(p,fs.readFileSync(p));}}
for(let i=0;i<=8;i++)backup(`artifacts/us${i}`);
const mode=process.env.US9B_CHECK_MODE??'protected-preview',dist=process.env.US9B_DIST_DIR??`${root}/next-${mode}`,results=[];
const jobs=[['vitest','node_modules/vitest/vitest.mjs',['run']],['lint','node_modules/eslint/bin/eslint.js',['.']],['typescript','node_modules/typescript/bin/tsc',['--noEmit']],['build','node_modules/next/dist/bin/next',['build','--webpack']]];
try{for(const [name,script,args]of jobs){const start=Date.now(),fd=fs.openSync(`${root}/${name}.log`,'w');const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script,...args],{env:{...process.env,AMPORY_QA_DIST_DIR:dist,...name==='build'?{AMPORY_US_LOCAL_MODE:mode}:{}},stdio:['ignore',fd,fd],windowsHide:true});child.on('error',reject);child.on('exit',resolve);});fs.closeSync(fd);results.push({name,exitCode:code,startedAt:new Date(start).toISOString(),finishedAt:new Date().toISOString()});console.log(name,code);if(code!==0)break;}}
finally{const restored=[];for(const [p,buffer]of history)if(!fs.existsSync(p)||!buffer.equals(fs.readFileSync(p))){fs.writeFileSync(p,buffer);restored.push(p);}fs.writeFileSync(`${root}/checks.json`,JSON.stringify({mode,dist,node:process.version,results,historyFilesPreserved:history.size,restored,buildId:fs.existsSync(`${dist}/BUILD_ID`)?fs.readFileSync(`${dist}/BUILD_ID`,'utf8').trim():null},null,2));}
if(results.some(r=>r.exitCode!==0))process.exitCode=1;
