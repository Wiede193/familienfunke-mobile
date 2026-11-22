import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTION_PROJECT_REF,requireStagingTarget,parseLoadSettings,readonlyScenarios,percentile,summarizeLoad}
 from '../StagingLoadCore.mjs';
const safe='abcdefghijklmno';
const valid={FF_STAGE_CONFIRM:'STAGING_ONLY',FF_STAGE_REF:safe,FF_STAGE_URL:'https://'+safe+'.supabase.co'};
test('production host is explicitly forbidden even if otherwise valid',()=>{
 assert.throws(()=>requireStagingTarget({...valid,FF_STAGE_REF:PRODUCTION_PROJECT_REF,FF_STAGE_URL:'https://'+PRODUCTION_PROJECT_REF+'.supabase.co'}),/PRODUCTION/);
 assert.throws(()=>requireStagingTarget({...valid,FF_STAGE_URL:'https://'+PRODUCTION_PROJECT_REF+'.supabase.co'}),/exact HTTPS/);
 assert.throws(()=>requireStagingTarget({...valid,FF_STAGE_URL:'https://'+safe+'.supabase.co.evil.org'}),/exact HTTPS/);
 assert.throws(()=>requireStagingTarget({...valid,FF_STAGE_URL:'http://'+safe+'.supabase.co'}),/exact HTTPS/);
 assert.throws(()=>requireStagingTarget({...valid,FF_STAGE_URL:'https://'+safe+'.supabase.co/rest/v1'}),/exact HTTPS/);
 assert.throws(()=>requireStagingTarget({...valid,FF_STAGE_CONFIRM:''}),/Explicit/);
 assert.equal(requireStagingTarget(valid),'https://'+safe+'.supabase.co');
});
test('separate consent and bounded work rate for larger workloads',()=>{
 assert.deepEqual(parseLoadSettings({}),{concurrency:10,durationSeconds:30,requestsPerSecond:5});
 assert.throws(()=>parseLoadSettings({FF_STAGE_CONCURRENCY:'2000'}),/Higher workload/);
 assert.equal(parseLoadSettings({FF_STAGE_CONCURRENCY:'2000',FF_STAGE_RPS:'20',
 FF_STAGE_HIGH_LOAD_CONFIRM:'HIGH_LOAD_ON_STAGING_ONLY'}).concurrency,2000);
 for(const invalid of ['0','1000','nan','1.5']) {
  assert.throws(()=>parseLoadSettings({FF_STAGE_RPS:invalid}),/RPS/);
 }
});
test('all workload scenarios are read-only and bounded',()=>{
 const s=readonlyScenarios('11111111-1111-4111-8111-111111111111');
 assert.equal(s.length,7);
 assert.ok(s.every(x=>x.rpc.startsWith('ff_')));
 assert.ok(s.every(x=>Object.hasOwn(x.args,'p_limit')));
 assert.ok(s.every(x=>x.args.p_limit<=40));
 assert.equal(s.find(x=>x.name==='my_photos').args.p_owner_id,'11111111-1111-4111-8111-111111111111');
 assert.equal(s.find(x=>x.name==='market_search').args.p_favorites_only,false);
});
test('p95 and errors correctly reject degraded runs',()=>{
 assert.equal(percentile([],0.95),null);
 assert.equal(percentile([100,150,200,400],0.95),400);
 const good=Array.from({length:100},()=>({scenario:'events',status:200,elapsedMs:100}));
 assert.equal(summarizeLoad(good).passed,true);
 assert.equal(summarizeLoad([...good.slice(0,98),{scenario:'events',status:503,elapsedMs:100},{scenario:'events',status:503,elapsedMs:100}]).passed,false);
 assert.equal(summarizeLoad(good.map(s=>({...s,elapsedMs:2400}))).passed,false);
 assert.equal(summarizeLoad([]).passed,false);
});
