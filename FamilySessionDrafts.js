import {useRef,useState} from 'react';

// Deliberately RAM only. A new account gets a new store, never a persisted
// password, photo, private message or personal-calendar note.
export function createSessionDrafts(owner){
 const entries=new Map();
 return {owner,get:key=>entries.get(key),has:key=>entries.has(key),
  set:(key,value)=>{if(value==null)entries.delete(key);else entries.set(key,value);},
  clear:key=>entries.delete(key),clearAll:()=>entries.clear()};
}
export function useSessionDraft(store,key,initial){
 const [value,setValue]=useState(()=>store.get(key)??initial);
 const latest=useRef(value);latest.current=value;
 function change(next){
  const updated=typeof next==='function'?next(latest.current):next;
  latest.current=updated;store.set(key,updated);setValue(updated);
 }
 function reset(next=initial){
  latest.current=next;store.clear(key);setValue(next);
 }
 return [value,change,reset];
}
