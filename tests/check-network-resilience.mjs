import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../NetworkResilience.js',import.meta.url),'utf8');
const {isTransientFailure,retryRead,createActionGate}=await import(
 'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
);
for (const problem of [
  {error:{message:'Network request failed'}},
  {error:{message:'Failed to fetch'}},
  {error:{message:'gateway temporarily unavailable'},status:503},
  {error:{message:'Gateway Timeout'},status:504},
  {status:502,message:'Bad gateway'},
  Object.assign(new Error('socket hang up'),{code:'ECONNRESET'}),
  new TypeError('fetch failed')
]) assert.equal(isTransientFailure(problem),true,'Transient read must be recoverable: '+JSON.stringify(problem));
for (const problem of [
  {error:{message:'Permission denied'},status:403},
  {error:{message:'Too many requests'},status:429},
  {error:{message:'Wrong password'},status:401},
  {error:{message:'constraint violated'},status:409},
  {error:{message:'RLS policy check failed'},status:400},
  {data:[],error:null,status:200}
]) assert.equal(isTransientFailure(problem),false,'Non-transient failure must not be repeated: '+JSON.stringify(problem));
{
 let calls=0,pauses=0;
 const result=await retryRead(async()=>++calls===1
  ?{data:null,error:{message:'Network request failed'}}
  :{data:[7],error:null},{pause:async()=>{pauses++;}});
 assert.deepEqual(result.data,[7]);assert.equal(calls,2);assert.equal(pauses,1);
}
{
 let calls=0;
 const result=await retryRead(async()=>{calls++;return {error:{message:'Network request failed'}};},
  {pause:async()=>{}});
 assert.equal(calls,2,'Never issue a third retry after repeated HTTP failure');
 assert.ok(result.error);
}
{
 let calls=0;
 await assert.rejects(
  retryRead(async()=>{calls++;throw new TypeError('fetch failed');},{pause:async()=>{}}),
  /fetch failed/
 );
 assert.equal(calls,2,'Never issue a third retry after thrown transient errors');
}
{
 let calls=0;let active=true;
 const result=await retryRead(async()=>{calls++;return {error:{message:'Network request failed'}};},
  {pause:async()=>{active=false;},isCurrent:()=>active});
 assert.equal(calls,1,'No retry after a session or screen is invalidated');
 assert.ok(result.error);
}
{
 let calls=0;
 const failure=await retryRead(async()=>{calls++;return {error:{message:'Rate limit'},status:429};},
  {pause:async()=>{throw new Error('Do not wait for 429');}});
 assert.equal(calls,1);assert.equal(failure.status,429);
}
{
 let calls=0;
 const success=await retryRead(async()=>{calls++;return {data:[1],error:null};},
  {pause:async()=>{throw new Error('Healthy reads do not wait');}});
 assert.equal(calls,1);assert.deepEqual(success.data,[1]);
}
{
 const gate=createActionGate();
 const a=gate.acquire();
 assert.equal(typeof a,'number');
 assert.equal(gate.acquire(),null,'Rapid double taps must not create parallel writes');
 assert.equal(gate.isActive(a),true);
 assert.equal(gate.release(a),true);
 const b=gate.acquire();
 assert.ok(b>a);gate.reset();
 const c=gate.acquire();
 assert.ok(c>b);
 assert.equal(gate.release(b),false,'Old account completion may not unlock new user action');
 assert.equal(gate.isActive(c),true);
 assert.equal(gate.release(c),true);
 assert.equal(gate.acquire()!==null,true);
}
console.log('Read-only retry limits, nonretryable errors and cross-account write locking passed.');
