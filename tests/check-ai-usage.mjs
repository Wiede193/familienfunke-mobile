import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sql=read('database/ff_ai_usage_monitoring.sql');
assert.match(sql,/alter table private\.ff_ai_usage_daily enable row level security/);
assert.match(sql,/grant execute on function public\.ff_ai_usage_record\(date,text,text,text,integer,integer,integer\) to service_role/);
assert.match(sql,/coalesce\(auth\.jwt\(\)->>'aal',''\)<>'aal2'/);
assert.match(sql,/s\.role='owner'/);
assert.match(sql,/private\.ff_admin_mfa_required/);
assert.match(sql,/p_cached not between 0 and p_input/);
assert.match(sql,/measured<attempts/);
for(const slug of ['ff-app-assistant','ff-market-scan','ff-market-review']){
 const source=read('supabase/functions/'+slug+'/index.ts');
 const a=source.indexOf('usageModel,"attempt"');
 const b=source.indexOf('await fetch("https://api.openai.com/v1/chat/completions"');
 const c=source.indexOf('usageModel,"measured"');
 assert.ok(a>=0&&a<b&&b<c,slug+' tracks attempts and tokens around model request');
}
console.log('KI-Verbrauch: geschützte Messung aller drei Modellaufrufe geprüft.');
