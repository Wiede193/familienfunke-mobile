import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {supabase} from './supabase';

const empty=()=>({owner:null,rows:[],unread:null,asOf:null,hasMore:false,loading:false,error:''});
const pageSize=40;
export function useNotificationCenter(userId){
 const owner=useRef(userId);owner.current=userId;
 const seq=useRef(0),running=useRef(false),snapshot=useRef(empty());
 const [state,setState]=useState(empty);
 const publish=useCallback(next=>{snapshot.current=next;setState(next);},[]);
 const refresh=useCallback(async({more=false}={})=>{
  if(!userId||!supabase||running.current)return false;
  const old=snapshot.current.owner===userId?snapshot.current:empty();
  if(more&&(!old.hasMore||!old.rows.length))return false;
  const cursor=more?old.rows[old.rows.length-1]:null;
  const request=++seq.current;running.current=true;
  publish({...old,owner:userId,loading:true,error:''});
  try{
   const {data,error}=await supabase.rpc('ff_inbox_page',{
    p_before:cursor?.created_at??null,p_before_id:cursor?.id??null});
   if(error||!Array.isArray(data?.rows)||!Number.isFinite(Number(data.unread))||!data.as_of)throw Error();
   if(owner.current!==userId||request!==seq.current)return false;
   const rows=more?[...old.rows,...data.rows.filter(r=>!old.rows.some(x=>x.id===r.id))]:data.rows;
   publish({owner:userId,rows,unread:Number(data.unread),asOf:more?old.asOf:data.as_of,
    hasMore:data.rows.length===pageSize,loading:false,error:''});
   return true;
  }catch{
   if(owner.current===userId&&request===seq.current)publish({...old,owner:userId,loading:false,error:'Neuigkeiten konnten nicht geladen werden. Bitte erneut versuchen.'});
   return false;
  }finally{if(request===seq.current)running.current=false;}
 },[userId,publish]);
 useEffect(()=>{
  seq.current++;running.current=false;publish(empty());
  if(!userId||!supabase)return;
  refresh();
  // Foreground only. Do not poll or send network traffic for this feature in the background.
  const timer=setInterval(()=>{if(AppState.currentState==='active'&&snapshot.current.rows.length<=pageSize)refresh();},45000);
  const sub=AppState.addEventListener('change',next=>{if(next==='active')refresh();});
  return()=>{seq.current++;running.current=false;clearInterval(timer);sub.remove();};
 },[userId,publish,refresh]);
 const markRead=useCallback(async(id=null)=>{
  if(!userId||owner.current!==userId)return false;
  const before=snapshot.current;
  if(before.owner!==userId||(!id&&!before.asOf))return false;
  try{
   const {data,error}=await supabase.rpc('ff_inbox_mark_read',{p_id:id,p_through:id?null:before.asOf});
   if(error||!Number.isFinite(Number(data)))throw Error();
   if(owner.current!==userId)return false;
   // Invalidate any outstanding stale read before rendering updated state.
   seq.current++;running.current=false;
   const current=snapshot.current;
   const stamp=new Date().toISOString();
   publish({...current,owner:userId,loading:false,rows:current.rows.map(r=>!r.read_at&&
    (id?r.id===id:r.created_at<=before.asOf)?{...r,read_at:stamp}:r),
    unread:Math.max(0,(current.unread??0)-Number(data)),error:''});
   await refresh();
   return true;
  }catch{
   if(owner.current===userId)publish({...snapshot.current,owner:userId,error:'Lesestatus konnte nicht gespeichert werden.'});
   return false;
  }
 },[userId,publish,refresh]);
 const visible=state.owner===userId?state:empty();
 return {...visible,refresh,markRead};
}
