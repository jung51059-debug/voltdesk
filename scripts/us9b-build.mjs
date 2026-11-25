import fs from 'node:fs';import {spawn} from 'node:child_process';
const mode=process.env.US9B_BUILD_MODE??'public',dist=`artifacts/us9b/next-${mode}-v3`,results=[];
for(const [name,script,args] of [['lint','node_modules/eslint/bin/eslint.js',['.']],['typescript','node_modules/typescript/bin/tsc',['--noEmit']],['build','node_modules/next/dist/bin/next',['build','--webpack']]]){
 const startedAt=new Date().toISOString(),fd=fs.openSync(`artifacts/us9b/${mode}-${name}.log`,'w');const exitCode=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,[script,...args],{windowsHide:true,env:{...process.env,AMPORY_QA_DIST_DIR:dist,AMPORY_US_LOCAL_MODE:mode},stdio:['ignore',fd,fd]});p.on('error',reject);p.on('exit',resolve);});fs.closeSync(fd);results.push({name,startedAt,exitCode,finishedAt:new Date().toISOString()});console.log(name,exitCode);if(exitCode)break;
}
const record={mode,dist,node:process.version,results,buildId:fs.existsSync(`${dist}/BUILD_ID`)?fs.readFileSync(`${dist}/BUILD_ID`,'utf8').trim():null};fs.writeFileSync(`artifacts/us9b/build-${mode}.json`,JSON.stringify(record,null,2));if(results.some(r=>r.exitCode))process.exitCode=1;
