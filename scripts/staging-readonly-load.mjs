#!/usr/bin/env node
// Manual synthetic READ-ONLY staging exercise. It never accepts the production project.
// Run ONLY after creating a separate staging project and synthetic approved accounts.
import {requireStagingTarget,parseLoadSettings,readonlyScenarios,summarizeLoad} from '../StagingLoadCore.mjs';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main() {
  const env=process.env;
  // Validate all guards BEFORE making even the authentication request.
  const origin=requireStagingTarget(env);
  const settings=parseLoadSettings(env);
  const key=String(env.FF_STAGE_PUBLISHABLE_KEY||'');
  if(!key.startsWith('sb_publishable_')||key.length<25) {
    throw new Error('Use a STAGING publishable key only, never a secret/service-role key.');
  }
  let users;
  try {users=JSON.parse(env.FF_STAGE_USERS_JSON||'');}
  catch {throw new Error('FF_STAGE_USERS_JSON must be a JSON array of synthetic staging credentials.');}
  if(!Array.isArray(users)||users.length<1||users.length>50||
    users.some(u=>typeof u?.email!=='string'||typeof u?.password!=='string'||!u.email.includes('@')||!u.password)) {
    throw new Error('Supply 1–50 synthetic staging-only {email,password} accounts.');
  }
  if(settings.durationSeconds*settings.requestsPerSecond>12000) {
    throw new Error('Limit manual experiments to at most 12,000 read requests per run.');
  }
  const accounts=[];
  for(const user of users) {
    // Logins are intentionally a setup step, not a measure of auth capacity.
    const response=await fetch(origin+'/auth/v1/token?grant_type=password',{
      method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
      body:JSON.stringify({email:user.email,password:user.password}),
      signal:AbortSignal.timeout(10000)
    });
    if(!response.ok)throw new Error('Synthetic staging login rejected (HTTP '+response.status+').');
    const auth=await response.json();
    if(!auth.access_token||!auth.user?.id)throw new Error('Staging login did not return a user session.');
    accounts.push({accessToken:auth.access_token,userId:auth.user.id});
  }
  async function singleRequest(account,scenario) {
    const began=performance.now();
    try{
      const response=await fetch(origin+'/rest/v1/rpc/'+scenario.rpc,{
        method:'POST',headers:{
          apikey:key,Authorization:'Bearer '+account.accessToken,
          'Content-Type':'application/json'
        },body:JSON.stringify(scenario.args),
        signal:AbortSignal.timeout(10000)
      });
      // Include body transfer in the timing, but never log or store personal data.
      await response.arrayBuffer();
      return {scenario:scenario.name,status:response.status,elapsedMs:Math.round(performance.now()-began)};
    }catch{
      return {scenario:scenario.name,status:0,elapsedMs:Math.round(performance.now()-began)};
    }
  }
  const probe=await singleRequest(accounts[0],readonlyScenarios(accounts[0].userId)[0]);
  if(probe.status!==200)throw new Error('Preflight read failed (HTTP '+probe.status+'); no load started.');
  const samples=[];
  const started=Date.now(),ends=started+settings.durationSeconds*1000;
  let nextTicket=0;
  console.log('Staging-only read test started:',JSON.stringify({
    project:env.FF_STAGE_REF,users:accounts.length,...settings
  }));
  async function worker(index) {
    const account=accounts[index%accounts.length];
    const scenarios=readonlyScenarios(account.userId);
    for(;;){
      const ticket=nextTicket++;
      const plannedAt=started+Math.floor(ticket*1000/settings.requestsPerSecond);
      if(plannedAt>=ends)break;
      await sleep(Math.max(0,plannedAt-Date.now()));
      if(Date.now()>ends)break;
      const scenario=scenarios[ticket%scenarios.length];
      samples.push(await singleRequest(account,scenario));
    }
  }
  await Promise.all(Array.from({length:settings.concurrency},(_,i)=>worker(i)));
  const report=summarizeLoad(samples);
  console.log('Staging result (no user data):\n'+JSON.stringify(report,null,2));
  if(!report.passed)process.exitCode=1;
}
main().catch(e=>{
  console.error('Staging test rejected or failed:',String(e.message||e).slice(0,240));
  process.exitCode=1;
});
