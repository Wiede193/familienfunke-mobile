// Staging-only synthetic read workload for Familienfunke.
// Run with k6 ONLY after provisioning a separate Supabase staging project
// with synthetic approved adult accounts. Never reuse production credentials.
import http from 'k6/http';
import {check,sleep} from 'k6';

const stagingUrl=String(__ENV.FF_STAGING_SUPABASE_URL||'').replace(/\/$/,'');
const match=stagingUrl.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i);
if(__ENV.FF_CONFIRM_STAGING!=='STAGING_READS_ONLY')throw new Error('Explicit staging confirmation required.');
if(!match)throw new Error('A separate https://<id>.supabase.co staging URL is required.');
if(match[1]==='cycqdhjvbikrlzgliloo')throw new Error('Production project is explicitly forbidden.');
const publishableKey=String(__ENV.FF_STAGING_PUBLISHABLE_KEY||'');
const tokens=String(__ENV.FF_STAGING_TEST_TOKENS||'').split(';').map(x=>x.trim()).filter(Boolean);
if(!publishableKey||tokens.length<2)throw new Error('Staging publishable key and at least two distinct synthetic-account access tokens are required.');
if(tokens.some(x=>x.length<40)||new Set(tokens).size!==tokens.length)throw new Error('Invalid or duplicate staging tokens.');

export const options={
 vus:5,
 duration:'45s',
 thresholds:{
  http_req_failed:['rate<0.05'],
  http_req_duration:['p(95)<1500'],
  checks:['rate>0.98']
 },
 tags:{service:'familienfunke-staging-readiness'}
};
const paths=[
 '/rest/v1/profiles?select=user_id%2Cregion_label&limit=20',
 '/rest/v1/events?select=id%2Cstarts_at&order=starts_at.asc&limit=10',
 '/rest/v1/ff_market_listings?select=id%2Ctitle&order=created_at.desc&limit=20'
];
export default function(){
 const token=tokens[(__VU-1)%tokens.length];
 const headers={apikey:publishableKey,Authorization:'Bearer '+token,Accept:'application/json','Cache-Control':'no-store'};
 const responses=http.batch(paths.map(path=>['GET',stagingUrl+path,null,{headers,tags:{endpoint:path.split('?')[0]}}]));
 responses.forEach((response,index)=>{
  check(response,{'read succeeds with staging account':r=>r.status===200,'response is JSON':r=>String(r.headers['Content-Type']||'').includes('json')},{endpoint:paths[index].split('?')[0]});
 });
 sleep(1+Math.random());
}
