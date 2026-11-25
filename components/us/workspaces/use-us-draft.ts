'use client';
import {useCallback,useMemo,useState,useSyncExternalStore,type SetStateAction} from 'react';
import {subscribeStorage,writeJson} from '@/lib/storage/local';
/** Read persisted drafts after hydration; never initialize server markup from browser-only storage. */
export function useUsDraft<T>(key:string,fallback:T,decode:(value:unknown)=>T|undefined){
 const fallbackRaw=JSON.stringify(fallback);
 const getSnapshot=useCallback(()=>{try{return localStorage.getItem(key)??fallbackRaw;}catch{return fallbackRaw;}},[key,fallbackRaw]);
 const serverSnapshot=useCallback(()=>fallbackRaw,[fallbackRaw]);
 const raw=useSyncExternalStore(subscribeStorage,getSnapshot,serverSnapshot);
 const parsed=useMemo(()=>{try{const value=decode(JSON.parse(raw));return value?{value,error:''}:{value:fallback,error:'Saved draft has an unsupported format. It was not deleted; review or export your browser data before replacing it.'};}catch{return {value:fallback,error:'Saved draft could not be read. It was not deleted; review your browser data before replacing it.'};}},[raw,decode,fallback]);
 const [saveError,setSaveError]=useState('');
 const set=useCallback((next:SetStateAction<T>)=>{const value=typeof next==='function'?(next as (prior:T)=>T)(parsed.value):next;try{writeJson(key,value);setSaveError('');}catch{setSaveError('Browser storage is unavailable or full. This edit could not be saved.');}},[parsed.value,key]);
 return [parsed.value,set,saveError||parsed.error] as const;
}
