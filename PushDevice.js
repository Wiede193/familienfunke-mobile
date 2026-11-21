import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import {supabase} from './supabase';
const DEVICE_KEY='familienfunke.push.device.v1';
const PROJECT_ID='b869a908-353f-489f-bdf4-b3e8d91a8ba1';
let operation=Promise.resolve();
const serial=fn=>{const next=operation.then(fn,fn);operation=next.catch(()=>{});return next;};
export async function localPushDevice(){
 const raw=await AsyncStorage.getItem(DEVICE_KEY);
 try{const value=JSON.parse(raw||'null');return value?.token&&value?.userId?value:null;}catch{return null;}
}
async function rpc(name,params){
 const {data,error}=await supabase.rpc(name,params);
 if(error)throw Error('Server konnte die Benachrichtigungseinstellung nicht bestätigen.');
 return data;
}
async function assertAccount(userId){
 const {data,error}=await supabase.auth.getSession();
 if(error||data.session?.user?.id!==userId)throw Error('Die Anmeldung hat sich geändert.');
}
async function nativeModule(){
 if(Platform.OS!=='ios'&&Platform.OS!=='android')throw Error('Push benötigt die installierte iOS- oder Android-App.');
 return await import('expo-notifications');
}
const categoryArgs=c=>({p_matches:!!c.matches,p_requests:!!c.requests,p_messages:!!c.messages,p_market:!!c.market});
export async function pushStatus(userId){
 await assertAccount(userId);
 const local=await localPushDevice();
 return rpc('ff_push_device_status',{p_token:local?.userId===userId?local.token:null});
}
// Only the explicit enable action requests system permission. No auto enrollment.
export const enablePush=(userId,categories)=>serial(async()=>{
 await assertAccount(userId);
 const N=await nativeModule();
 if(Platform.OS==='android')await N.setNotificationChannelAsync('familienfunke',{name:'Familienfunke',importance:N.AndroidImportance.DEFAULT,showBadge:false,lockscreenVisibility:N.AndroidNotificationVisibility.PRIVATE});
 let permission=await N.getPermissionsAsync();
 if(!permission.granted)permission=await N.requestPermissionsAsync();
 if(!permission.granted)throw Error('Keine Systemfreigabe. Du kannst sie in den Geräteeinstellungen ändern.');
 const token=(await N.getExpoPushTokenAsync({projectId:PROJECT_ID})).data;
 if(typeof token!=='string'||!token)throw Error('Geräteanmeldung fehlt. Bitte einen installierten App-Build verwenden.');
 await assertAccount(userId);
 const last=await localPushDevice();
 // Persist before RPC so a network timeout can still be revoked on logout.
 await AsyncStorage.setItem(DEVICE_KEY,JSON.stringify({userId,token}));
 if(await rpc('ff_push_enroll_device',{p_token:token,...categoryArgs(categories)})!==true)throw Error('Geräteanmeldung nicht bestätigt.');
 if(last?.userId===userId&&last.token!==token)await rpc('ff_push_unregister',{p_expo_token:last.token});
 await assertAccount(userId);
 return true;
});
export const changePushCategories=(userId,categories)=>serial(async()=>{
 await assertAccount(userId);
 return rpc('ff_push_update_categories',categoryArgs(categories));
});
export const disablePush=(userId)=>serial(async()=>{
 await assertAccount(userId);
 const local=await localPushDevice();
 if(local?.userId===userId){
  await rpc('ff_push_unregister',{p_expo_token:local.token});
  await AsyncStorage.removeItem(DEVICE_KEY);
 }
 try{const N=await nativeModule();await N.dismissAllNotificationsAsync();}catch{}
});
// Logout must not silently leave a registered token behind.
export async function signOutWithPush(userId){
 await disablePush(userId);
 const {error}=await supabase.auth.signOut();
 if(error)throw error;
}
