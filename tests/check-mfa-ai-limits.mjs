import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const quota=read('database/ff_moderation_limits.sql');
const mfa=read('database/ff_admin_mfa_staged.sql');
assert.match(quota,/pg_advisory_xact_lock/);
assert.match(quota,/when 'text' then u_day:=250;g_day:=4000;u_min:=15;g_min:=120/);
assert.match(quota,/when 'photo' then u_day:=25;g_day:=300;u_min:=5;g_min:=30/);
assert.match(quota,/when 'market_review' then u_day:=40;g_day:=300;u_min:=5;g_min:=30/);
assert.match(quota,/grant execute on function public\.ff_moderation_claim\(text,uuid\) to service_role/);
for(const name of ['moderate-content','moderate-photo','ff-market-review']){
 const edge=read('supabase/functions/'+name+'/index.ts');
 assert.match(edge,/ff_moderation_claim/);
 assert.ok(edge.indexOf('ff_moderation_claim')<edge.indexOf('await fetch("https://api.openai.com/'));
 assert.match(edge,/429/);
}
const market=read('supabase/functions/ff-market-review/index.ts');
assert.ok(market.indexOf('if(!own)return fail')<market.indexOf('if(result.status!==429)await recordOutcome'));
assert.match(mfa,/auth\.jwt\(\)->>'aal'/);
assert.match(mfa,/f\.status='verified' and f\.factor_type='totp'/);
assert.match(mfa,/revoke all on private\.ff_admin_mfa_required/);
const existing=[...mfa.matchAll(/CREATE OR REPLACE FUNCTION public\.familienfunke_admin_[\s\S]*?\$function\$[\s\S]*?\$function\$/g)];
assert.equal(existing.length,13);
for(const [functionBody] of existing)assert.match(functionBody,/private\.ff_admin_mfa_ok\(\)/);
console.log('MFA- und KI-Limits: serverseitige Schutzverträge geprüft.');
