import AsyncStorage from '@react-native-async-storage/async-storage';
import {Directory,File,Paths} from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// Private on-device drafts, separated by authenticated account. No cloud upload.
const pending=new Map();
const key=uid=>'familienfunke.box.v2.'+uid;
function folder(uid){
 if(!/^[0-9a-f-]{36}$/i.test(String(uid)))throw new Error('Ungültiges Konto für lokale Entwürfe.');
 return new Directory(Paths.document,'ff-market-box-v2',String(uid));
}
export async function keepBoxPhoto(uid,asset){
 if(!asset?.uri)throw new Error('Kein Foto ausgewählt.');
 const dir=folder(uid);
 dir.create({idempotent:true,intermediates:true});
 if(asset.uri.startsWith(dir.uri.endsWith('/')?dir.uri:dir.uri+'/')&&new File(asset.uri).exists)return asset;
 const w=Number(asset.width)||1600,h=Number(asset.height)||1600;
 const scale=Math.min(1,2000/Math.max(w,h));
 const job=ImageManipulator.ImageManipulator.manipulate(asset.uri);
 if(scale<1)job.resize({width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale))});
 const rendered=await job.renderAsync();
 const saved=await rendered.saveAsync({format:ImageManipulator.SaveFormat.JPEG,compress:.8});
 const target=new File(dir,Date.now()+'-'+Math.random().toString(36).slice(2,12)+'.jpg');
 new File(saved.uri).copy(target);
 return {uri:target.uri,width:saved.width,height:saved.height,sourceAssetId:asset.assetId||null};
}
export function availableBoxPhoto(uid,asset){
 try{
  if(!asset?.uri)return null;
  const dir=folder(uid),prefix=dir.uri.endsWith('/')?dir.uri:dir.uri+'/';
  return asset.uri.startsWith(prefix)&&new File(asset.uri).exists?asset:null;
 }catch{return null;}
}
export async function loadBoxSnapshot(uid){
 await (pending.get(uid)||Promise.resolve()).catch(()=>{});
 const value=await AsyncStorage.getItem(key(uid));
 if(!value)return null;
 const data=JSON.parse(value);
 if(data?.version!==2||!Array.isArray(data.drafts)||!Array.isArray(data.batches))throw new Error('Lokale Kiste konnte nicht gelesen werden.');
 return data;
}
// Serialize writes, including when the screen is unmounted/remounted quickly.
export function saveBoxSnapshot(uid,data){
 const previous=pending.get(uid)||Promise.resolve();
 const next=previous.catch(()=>{}).then(()=>data?AsyncStorage.setItem(key(uid),JSON.stringify(data)):AsyncStorage.removeItem(key(uid)));
 pending.set(uid,next);
 next.finally(()=>{if(pending.get(uid)===next)pending.delete(uid);}).catch(()=>{});
 return next;
}
export async function deleteBoxStorage(uid){
 await saveBoxSnapshot(uid,null);
 const dir=folder(uid);
 if(dir.exists)dir.delete();
}
