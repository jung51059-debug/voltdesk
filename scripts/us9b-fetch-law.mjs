import fs from 'node:fs';import {JSDOM}from'jsdom';
const records=[];fs.mkdirSync('artifacts/us9b/legal',{recursive:true});
for(const article of [15,16,21,26,29,30,31,34,35,36,37]){
 const url='https://www.law.go.kr/lsBdyPrint.do?chrClsCd=010202&efYd=20260911&joNo='+encodeURIComponent(String(article).padStart(4,'0')+':00')+'&lsiSeq=283839';let response,text;
 for(let n=0;n<3;n++){try{response=await fetch(url);const d=new JSDOM(await response.text());text=d.window.document.body.textContent;d.window.close();if(text.includes('제'+article+'조('))break;}catch{}}
 if(!text?.includes('제'+article+'조('))throw new Error('Official body not verified '+article);
 fs.writeFileSync('artifacts/us9b/legal/pipa-'+article+'.txt',text);records.push({article,url,http:response.status,edition:'Act 21445, effective 2026-09-11',checkedAt:new Date().toISOString()});console.log(text.slice(text.indexOf('제'+article+'조(')).trim());
}
fs.writeFileSync('artifacts/us9b/legal/pipa-provenance.json',JSON.stringify(records,null,2));
