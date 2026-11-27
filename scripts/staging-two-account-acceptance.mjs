#!/usr/bin/env node
// Live, low-volume integration test. Synthetic staging accounts ONLY.
// Run once per fresh triple; contacts/market rows are retained for inspection.
import {requireStagingTarget} from '../StagingLoadCore.mjs';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';

const env=process.env;
let passed=0;
const requireOK=(value,label)=>{if(!value)throw new Error(label);};
function check(label,ok){requireOK(ok,label);passed++;console.log('PASS '+label);}
function data(result,label){requireOK(!result.error,label);return result.data;}
function denied(result){return !!result.error && ([400,401,403,404].includes(Number(result.error.statusCode??result.error.status??result.status??0)) || ['42501','P0002','PGRST116'].includes(result.error.code));}
const jpeg=Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAABP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKwAEp//2Q==','base64');

async function run(){
 const url=requireStagingTarget(env);
 requireOK(env.FF_STAGE_WRITE_CONFIRM==='FRESH_SYNTHETIC_ACCOUNTS_ONLY','Write confirmation missing');
 const key=String(env.FF_STAGE_PUBLISHABLE_KEY||'');
 requireOK(key.startsWith('sb_publishable_'),'Staging publishable key required');
 let creds;try{creds=JSON.parse(env.FF_STAGE_USERS_JSON||'');}catch{throw new Error('Invalid credentials JSON');}
 requireOK(Array.isArray(creds)&&creds.length===3&&creds.every(x=>typeof x?.email==='string'&&/^qa-[^@]+@[^@]+$/i.test(x.email)&&typeof x.password==='string'&&x.password.length>=12)&&new Set(creds.map(x=>x.email.toLowerCase())).size===3,'Three distinct qa- test accounts required');
 const clients=creds.map(()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}));
 let accounts=[];
 try{
  for(let i=0;i<clients.length;i++){
   const client=clients[i], auth=data(await client.auth.signInWithPassword(creds[i]),'Login '+(i+1));
   requireOK(auth.user?.id&&auth.session?.access_token,'Missing authenticated session');
   accounts.push({client,id:auth.user.id});
  }
  check('Three separate real sessions',new Set(accounts.map(x=>x.id)).size===3);
  const [a,b,c]=accounts;
  const rpc=(actor,name,args={})=>actor.client.rpc(name,args);
  const read=(actor,table,col,id)=>actor.client.from(table).select('*').eq(col,id);
  const photos=(actor,bucket)=>actor.client.storage.from(bucket);
  for(const actor of accounts){
   const p=data(await actor.client.from('profiles').select('user_id,is_discoverable,moderation_status').eq('user_id',actor.id).single(),'Own profile');
   const v=data(await actor.client.from('verifications').select('status').eq('user_id',actor.id).single(),'Own verification');
   const m=data(await actor.client.from('memberships').select('status').eq('user_id',actor.id).single(),'Own membership');
   requireOK(p.is_discoverable&&p.moderation_status==='approved'&&v.status==='verified'&&m.status!=='suspended','Test accounts must be approved and discoverable');
   requireOK(data(await actor.client.from('contact_requests').select('id').limit(1),'Fresh contacts check').length===0,'Use fresh test accounts with no contacts');
   requireOK(data(await actor.client.from('blocks').select('blocked_id').limit(1),'Fresh blocks check').length===0,'Use fresh test accounts with no blocks');
  }
  check('Foreign membership hidden',data(await read(b,'memberships','user_id',a.id),'Foreign membership').length===0);
  const contact=data(await rpc(a,'ff_contact_create',{p_recipient_id:b.id}),'Create contact');
  requireOK(contact?.id&&contact.status==='pending','Contact must be pending');
  check('Contact created',true);
  const ct=contact.id;
  const respond=(actor,status)=>rpc(actor,'ff_contact_respond',{p_contact_id:ct,p_status:status});
  const send=(actor,body)=>actor.client.functions.invoke('send-message',{body:{contact_id:ct,body,request_id:randomUUID()}});
  // Do not treat service outages as successful denials.
  const edgeDenied=x=>x.error?.context?.status===403;
  check('Sender cannot accept own request',!!(await respond(a,'accepted')).error);
  check('Pending contact cannot send message',edgeDenied(await send(a,'QA harmless before acceptance')));
  check('Recipient accepts contact',data(await respond(b,'accepted'),'Accept contact').status==='accepted');
  check('Message sent through actual moderation service',!!data(await send(a,'Hallo, dies ist eine künstliche QA-Testnachricht.'),'Moderated message A').message?.id);
  check('Reply through moderation service',!!data(await send(b,'Danke, dies ist die künstliche Testantwort.'),'Moderated message B').message?.id);
  const chat=actor=>rpc(actor,'ff_chat_page',{p_contact_id:ct});
  check('Participant sees both messages',data(await chat(b),'Participant chat').length===2);
  check('Third account sees no chat',data(await chat(c),'Outsider chat').length===0);
  check('Third account cannot send into chat',edgeDenied(await send(c,'QA outsider')));
  const tag=randomUUID(), path=a.id+'/qa-'+tag+'.jpg';
  const bucket='familienfunke-photos';
  data(await photos(a,bucket).upload(path,jpeg,{contentType:'image/jpeg',cacheControl:'0',upsert:false}),'Actual profile photo upload');
  check('Actual profile photo upload',true);
  const ph=data(await a.client.from('profile_photos').insert({owner_id:a.id,storage_path:path,caption:'QA synthetic photo'}).select('id').single(),'Photo metadata');
  const ownerDownload=data(await photos(a,bucket).download(path),'Owner file download');
  check('Owner can read actual file',ownerDownload.size===jpeg.length);
  check('Other contact cannot sign pending photo',denied(await photos(b,bucket).createSignedUrl(path,60)));
  check('Outsider cannot download private photo',denied(await photos(c,bucket).download(path)));
  check('Foreign folder upload denied',denied(await photos(b,bucket).upload(a.id+'/qa-foreign-'+tag+'.jpg',jpeg,{contentType:'image/jpeg',upsert:false})));
  const listing=data(await a.client.from('ff_market_listings').insert({seller_id:a.id,title:'QA synthetic listing '+tag.slice(0,8),category:'Spielzeug'}).select('id').single(),'Listing insert');
  const marketPath=a.id+'/'+listing.id+'.jpg';
  data(await photos(a,'ff-market-photos').upload(marketPath,jpeg,{contentType:'image/jpeg',cacheControl:'0',upsert:false}),'Actual market photo upload');
  data(await a.client.from('ff_market_listings').update({photo_path:marketPath}).eq('id',listing.id),'Listing photo metadata');
  check('Listing plus photo upload',true);
  check('Pending listing hidden',data(await read(b,'ff_market_listings','id',listing.id),'Pending listing read').length===0);
  check('Pending market photo hidden',denied(await photos(b,'ff-market-photos').createSignedUrl(marketPath,60)));
  check('Foreign listing modification denied',data(await rpc(b,'ff_market_mark_sold',{p_listing_id:listing.id}),'Foreign listing change')===false);
  // A second pending contact tests accepting after block.
  const bc=data(await rpc(b,'ff_contact_create',{p_recipient_id:c.id}),'Second contact');
  data(await b.client.from('blocks').insert({blocker_id:b.id,blocked_id:c.id}),'Block pending contact');
  check('Blocked pending contact cannot accept',denied(await rpc(c,'ff_contact_respond',{p_contact_id:bc.id,p_status:'accepted'})));
  data(await a.client.from('blocks').insert({blocker_id:a.id,blocked_id:b.id}),'Block accepted contact');
  check('New message denied A to B',edgeDenied(await send(a,'QA blocked A')));
  check('New message denied B to A',edgeDenied(await send(b,'QA blocked B')));
  check('Both original participants retain old chat',data(await chat(a),'Old chat A').length===2&&data(await chat(b),'Old chat B').length===2);
  check('Blocked profile hidden',data(await read(b,'profiles','user_id',a.id),'Blocked profile read').length===0);
  check('Admin overview denied',denied(await rpc(b,'familienfunke_admin_overview')));
  data(await a.client.from('profile_photos').delete().eq('id',ph.id),'Remove synthetic profile metadata');
  data(await photos(a,bucket).remove([path]),'Remove synthetic profile file');
  // The pending market listing and contact fixtures are intentionally retained in staging.
  // Never expose credentials, IDs, JWTs, signed links, or content in logs.
  console.log('Live staging tests passed: '+passed+'; manual moderation/approved-media and native device checks still required.');
 }finally{
  await Promise.allSettled(clients.map(client=>client.auth.signOut({scope:'local'})));
 }
}
run().catch(error=>{console.error('QA stopped after '+passed+' successful checks: '+(error instanceof Error&&error.message.match(/^[A-Za-z0-9 .()-]{1,100}$/)?error.message:'request failed'));process.exitCode=1;});
