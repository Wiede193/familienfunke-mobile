import {useEffect,useRef,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {layoutKey,normalizeLayout} from './FamilyLayoutModel';

export function useFamilyLayout(userId){
 const [state,setState]=useState(null);
 const owner=useRef(userId);owner.current=userId;
 const pending=useRef(false);
 const key=layoutKey(userId);
 useEffect(()=>{
  let alive=true;
  if(!key)return;
  AsyncStorage.getItem(key).then(raw=>{
   if(!alive)return;
   let value=normalizeLayout(null);
   try{if(raw)value=normalizeLayout(JSON.parse(raw));}catch{}
   setState({owner:userId,value,ready:true,error:''});
  }).catch(()=>{if(alive)setState({owner:userId,value:normalizeLayout(null),ready:false,error:'Deine Einstellungen konnten nicht geladen werden. Bitte öffne die App erneut.'});});
  return ()=>{alive=false;};
 },[key,userId]);
 const current=state?.owner===userId?state:null;
 async function save(raw){
  if(!key||owner.current!==userId||!current?.ready||pending.current)return false;
  pending.current=true;
  try{
   const value=normalizeLayout(raw);
   await AsyncStorage.setItem(key,JSON.stringify(value));
   if(owner.current!==userId)return false;
   setState({owner:userId,value,ready:true,error:''});
   return true;
  }catch{return false;}
  finally{pending.current=false;}
 }
 return {layout:current?.value||normalizeLayout(null),ready:!!current?.ready,error:current?.error||'',save};
}
