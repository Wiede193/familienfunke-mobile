import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../ChatSendIntent.js',import.meta.url),'utf8');
const {sha256Text,uuidFromCrypto,createChatIntentRepository}=
  await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));

for(const plain of ['', 'abc', 'Familienfunke', 'Kinderkleidung 110', '👍 4 für 5 €',
 'ÄÖÜß☀', '😀'.repeat(100), 'Z'.repeat(2000), '\u0000with\nline', '\ud800'] ){
 const expected=createHash('sha256').update(plain).digest('hex');
 assert.equal(sha256Text(plain),expected,'Portable SHA-256 must match Node for '+JSON.stringify(plain.slice(0,20)));
}
const UUID_1='11111111-1111-4111-8111-111111111111';
const UUID_2='22222222-2222-4222-8222-222222222222';
const UUID_3='33333333-3333-4333-8333-333333333333';
assert.equal(uuidFromCrypto({randomUUID:()=>UUID_1}),UUID_1);
assert.equal(uuidFromCrypto({randomUUID:()=>UUID_1.replace('-4111','-1111')}),null,'UUID must be v4');
assert.equal(uuidFromCrypto(null),null,'Missing random API must require server-generated UUID');
const bytes=Array.from({length:16},(_,i)=>i);
const produced=uuidFromCrypto({getRandomValues:arr=>{
 arr.set(bytes);return arr;
}});
assert.match(produced,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

const stored=new Map();
const storage={
  getItem:async key=>stored.get(key)??null,
  setItem:async(key,value)=>{stored.set(key,value);},
  removeItem:async key=>{stored.delete(key);}
};
const owner='00000000-0000-4000-8000-000000000001';
const contactA='00000000-0000-4000-8000-000000000002';
const contactB='00000000-0000-4000-8000-000000000003';
let current=100000;
const ids=[UUID_1,UUID_2,UUID_3,'44444444-4444-4444-8444-444444444444',
 '55555555-5555-4555-8555-555555555555','66666666-6666-4666-8666-666666666666'];
let generated=0;
const factory=()=>createChatIntentRepository({
 storage,createId:async()=>ids[generated++],now:()=>current
});
const first=factory();
const id=await first.reserve(owner,contactA,' Hallo! ');
assert.equal(id,UUID_1);
assert.equal(stored.size,1);
const record=JSON.stringify([...stored.values()]);
assert.ok(!record.includes('Hallo'),'Never store plaintext chat bodies');
assert.equal(await first.reserve(owner,contactA,'Hallo!'),id,'Same draft must reuse the same intent');
const afterRestart=factory();
assert.equal(await afterRestart.reserve(owner,contactA,'Hallo!'),id,'Same draft after app restart must reuse UUID');
assert.equal(generated,1);
assert.equal(await afterRestart.reserve(owner,contactB,'Hallo!'),UUID_2,'Other contact must have different intent key');
assert.equal(await afterRestart.reserve(owner,contactA,'Anderer Text'),UUID_3,'Edited text must create new intent');
await afterRestart.acknowledge(owner,contactA,UUID_1);
assert.equal(stored.size,2,'An older reply may not clear a newer intent');
await afterRestart.acknowledge(owner,contactA,UUID_3);
assert.equal(stored.size,1,'Acknowledged intent is cleared');
assert.equal(await afterRestart.reserve(owner,contactA,'Anderer Text'),ids[3],'Intent after successful send is NEW');
current+=8*24*60*60*1000;
assert.equal(await afterRestart.reserve(owner,contactA,'Anderer Text'),ids[4],'Old pending key expires');
assert.equal(await afterRestart.reserve(owner,contactA,'Neuer Text'),ids[5]);
assert.throws(()=>sha256Text('x'.repeat(1048577)),/too large/);
const failing=createChatIntentRepository({
 storage:{getItem:async()=>null,setItem:async()=>{throw new Error('disk unavailable');},removeItem:async()=>{}},
 createId:async()=>UUID_1
});
await assert.rejects(failing.reserve(owner,contactA,'Nicht senden'),/disk unavailable/);
console.log('Persistent chat IDs, unicode SHA-256, restart, tampering and storage fail-closed checks passed.');
