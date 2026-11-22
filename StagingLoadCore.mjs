// Read-only staging workload primitives. No production URL is ever accepted.
export const PRODUCTION_PROJECT_REF = 'cycqdhjvbikrlzgliloo';
export const DEFAULT_TARGET_P95_MS = 2000;
export const DEFAULT_MAX_ERROR_RATE = 0.01;

export function requireStagingTarget(env) {
  if (env.FF_STAGE_CONFIRM !== 'STAGING_ONLY') {
    throw new Error('Explicit FF_STAGE_CONFIRM=STAGING_ONLY is required.');
  }
  const ref = String(env.FF_STAGE_REF || '').trim();
  if (!/^[a-z0-9]{15,30}$/.test(ref)) throw new Error('A separate Supabase staging project ref is required.');
  if (ref === PRODUCTION_PROJECT_REF) throw new Error('PRODUCTION is forbidden as a load-test target.');
  let url;
  try { url = new URL(String(env.FF_STAGE_URL || '')); }
  catch { throw new Error('Invalid staging URL.'); }
  if (url.protocol !== 'https:' || url.hostname !== ref + '.supabase.co' ||
      url.port || url.username || url.password || url.search || url.hash ||
      (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error('Staging URL must be the exact HTTPS Supabase project root for FF_STAGE_REF.');
  }
  return url.origin;
}

export function parseLoadSettings(env) {
  const checkInt = (value,fallback,min,max,name) => {
    const n = value === undefined || value === '' ? fallback : Number(value);
    if (!Number.isSafeInteger(n) || n < min || n > max) {
      throw new Error(name + ' must be an integer between ' + min + ' and ' + max + '.');
    }
    return n;
  };
  const concurrency = checkInt(env.FF_STAGE_CONCURRENCY,10,1,2000,'Concurrency');
  const durationSeconds = checkInt(env.FF_STAGE_DURATION_SECONDS,30,5,300,'Duration');
  const requestsPerSecond = checkInt(env.FF_STAGE_RPS,5,1,100,'RPS');
  if ((concurrency > 50 || requestsPerSecond > 10 || durationSeconds > 60) &&
    env.FF_STAGE_HIGH_LOAD_CONFIRM !== 'HIGH_LOAD_ON_STAGING_ONLY') {
    throw new Error('Higher workload requires FF_STAGE_HIGH_LOAD_CONFIRM=HIGH_LOAD_ON_STAGING_ONLY.');
  }
  return {concurrency,durationSeconds,requestsPerSecond};
}

export function readonlyScenarios(userId) {
  return [
    {name:'discover',rpc:'ff_discover_page',args:{p_limit:40}},
    {name:'contacts',rpc:'ff_contacts_page',args:{p_limit:40}},
    {name:'events',rpc:'ff_events_page',args:{p_limit:20}},
    {name:'my_market',rpc:'ff_my_market_page',args:{p_limit:30}},
    {name:'partners',rpc:'ff_partner_events_page',args:{p_limit:20}},
    {name:'my_photos',rpc:'ff_profile_photos_page',args:{p_owner_id:userId,p_limit:20}},
    {name:'market_search',rpc:'ff_market_search',args:{
      p_query:'Kinder',p_category:'Alle',p_trade_type:'all',p_min_cents:null,
      p_max_cents:null,p_favorites_only:false,p_sort:'relevance',p_limit:40,p_offset:0
    }}
  ];
}

export function percentile(samples,p) {
  if (!samples.length) return null;
  if (p < 0 || p > 1) throw new Error('Invalid percentile');
  const sorted=[...samples].sort((a,b)=>a-b);
  return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];
}

export function summarizeLoad(samples,{p95TargetMs=DEFAULT_TARGET_P95_MS,maxErrorRate=DEFAULT_MAX_ERROR_RATE}={}) {
  const total=samples.length;
  const errors=samples.filter(s=>s.status===0||s.status>=400).length;
  const statusCounts={};const byScenario={};
  for(const s of samples) {
    statusCounts[s.status]=(statusCounts[s.status]||0)+1;
    const key=s.scenario;
    if(!byScenario[key])byScenario[key]={requests:0,errors:0};
    byScenario[key].requests++;
    if(s.status===0||s.status>=400)byScenario[key].errors++;
  }
  const p95=percentile(samples.map(s=>s.elapsedMs),0.95);
  return {requests:total,errors,errorRate:total?errors/total:1,
    p50Ms:percentile(samples.map(s=>s.elapsedMs),0.5),
    p95Ms:p95,p99Ms:percentile(samples.map(s=>s.elapsedMs),0.99),
    statusCounts,byScenario,passed:total>0 && errors/total<=maxErrorRate && p95<=p95TargetMs};
}
