import {useEffect,useRef,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from './supabase';
import {layoutKey,normalizeLayout} from './FamilyLayoutModel';
import {decodeLocalLayout,resolveLayout,encodeLocalLayout} from './FamilyLayoutSync';

async function readRemote(userId){
 try{
  const {data,error}=await supabase.from('ff_layout_preferences').select('home,bottom,revision').eq('user_id',userId).maybeSingle();
  return {available:!error,remote:error?null:data};
 }catch{return {available:false,remote:null};}
}
export function useFamilyLayout(userId){
 const [state,setState]=useState(null);
 const owner=useRef(userId);owner.current=userId;
 const pending=useRef(null);
 const key=layoutKey(userId);
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  let alive=true;
  if(!key)return;
  const valid=()=>alive&&owner.current===userId;
  (async()=>{
   let local;
   try{const raw=await AsyncStorage.getItem(key);local=decodeLocalLayout(raw?JSON.parse(raw):null);}
   catch{if(valid())setState({owner:userId,value:normalizeLayout(null),ready:false,error:'Die lokalen Einstellungen konnten nicht gelesen werden. Bitte versuche es erneut.'});return;}
   const {available,remote}=await readRemote(userId);
   if(!valid())return;
   const resolved=resolveLayout(local,remote,available);
   // Cache the server state locally without overwriting a pending local choice.
   if(available&&!resolved.pending)try{
    await AsyncStorage.setItem(key,encodeLocalLayout(resolved.value,false,resolved.revision));
   }catch{}
   if(valid())setState({owner:userId,...resolved,ready:true,error:''});
  })();
  return ()=>{alive=false;};
 },[key,userId,reload]);
 const current=state?.owner===userId?state:null;
 async function save(raw,{confirmConflict=false}={}){
  if(!key||owner.current!==userId||!current?.ready||pending.current?.owner===userId)return {saved:false};
  if(current.conflict&&!confirmConflict)return {saved:false,conflict:true};
  const token={owner:userId};pending.current=token;
  const value=normalizeLayout(raw);
  const valid=()=>owner.current===userId&&pending.current===token;
  try{
   // First keep an explicit local backup. Never silently discard offline edits.
   await AsyncStorage.setItem(key,encodeLocalLayout(value,true,current.revision));
   if(!valid())return {saved:false};
   let synced=false,revision=current.revision,available=current.available,remoteRevision=current.remoteRevision,conflict=false;
   if(available){
    try{
     const response=remoteRevision===null
      ?await supabase.from('ff_layout_preferences').insert({user_id:userId,home:value.home,bottom:value.bottom,revision:1}).select('revision').single()
      :await supabase.from('ff_layout_preferences').update({home:value.home,bottom:value.bottom,revision:remoteRevision+1}).eq('user_id',userId).eq('revision',remoteRevision).select('revision').maybeSingle();
     if(!valid())return {saved:false};
     if(!response.error&&Number.isInteger(response.data?.revision)){
      revision=response.data.revision;remoteRevision=revision;synced=true;
     }else{
      // Compare-and-swap rejected a competing update; keep the local copy.
      const latest=await readRemote(userId);
      if(!valid())return {saved:false};
      available=latest.available;remoteRevision=latest.remote?.revision??null;
      conflict=available&&remoteRevision!==revision;
     }
    }catch{available=false;}
   }
   if(!valid())return {saved:false};
   if(synced)try{await AsyncStorage.setItem(key,encodeLocalLayout(value,false,revision));}catch{}
   if(!valid())return {saved:false};
   setState({owner:userId,value,ready:true,error:'',pending:!synced,revision,remoteRevision,available,conflict});
   return {saved:true,synced,conflict};
  }catch{return {saved:false};}
  finally{if(pending.current===token)pending.current=null;}
 }
 async function useAccountLayout(){
  if(!key||!current?.conflict||pending.current?.owner===userId||owner.current!==userId)return false;
  const token={owner:userId};pending.current=token;
  const valid=()=>owner.current===userId&&pending.current===token;
  try{
   const {available,remote}=await readRemote(userId);
   if(!valid()||!available)return false;
   const value=remote?normalizeLayout({version:1,home:remote.home,bottom:remote.bottom}):normalizeLayout(null);
   const revision=remote?.revision??null;
   await AsyncStorage.setItem(key,encodeLocalLayout(value,false,revision));
   if(!valid())return false;
   setState({owner:userId,value,ready:true,error:'',pending:false,revision,remoteRevision:revision,available:true,conflict:false});return true;
  }catch{return false;}finally{if(pending.current===token)pending.current=null;}
 }
 function refresh(){if(pending.current?.owner===userId)return;setState(old=>old?.owner===userId?{...old,ready:false}:null);setReload(n=>n+1);}
 return {layout:current?.value||normalizeLayout(null),ready:!!current?.ready,error:current?.error||'',pending:!!current?.pending,available:!!current?.available,conflict:!!current?.conflict,save,refresh,useAccountLayout};
}
