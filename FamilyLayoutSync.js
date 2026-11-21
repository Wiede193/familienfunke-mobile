// The sync payload contains only page IDs. No personal text, photos or roles.
import {normalizeLayout} from './FamilyLayoutModel';
export function decodeLocalLayout(raw){
 if(raw?.cacheVersion===1)return {value:normalizeLayout(raw.value),pending:raw.pending===true,revision:Number.isInteger(raw.revision)?raw.revision:null};
 return {value:normalizeLayout(raw),pending:!!raw,revision:null};
}
export function resolveLayout(local,remote,available){
 const remoteRevision=Number.isInteger(remote?.revision)?remote.revision:null;
 if(!available)return {...local,available:false,remoteRevision:null,conflict:false};
 if(local.pending){
  return {...local,available:true,remoteRevision,conflict:remoteRevision!==null&&remoteRevision!==local.revision};
 }
 if(remoteRevision!==null)return {value:normalizeLayout({version:1,home:remote.home,bottom:remote.bottom}),pending:false,revision:remoteRevision,available:true,remoteRevision,conflict:false};
 return {...local,available:true,remoteRevision:null,conflict:false};
}
export function encodeLocalLayout(value,pending,revision){
 return JSON.stringify({cacheVersion:1,value:normalizeLayout(value),pending:!!pending,revision:revision??null});
}
