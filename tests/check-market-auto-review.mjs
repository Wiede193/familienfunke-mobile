import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const grants=readFileSync(new URL('../database/ff_market_review_service_grants.sql',import.meta.url),'utf8');
const review=readFileSync(new URL('../supabase/functions/ff-market-review/index.ts',import.meta.url),'utf8');
const app=readFileSync(new URL('../App.jsx',import.meta.url),'utf8');

assert.match(grants,/grant select on table public\.ff_market_listings to service_role;/i,'Server must be able to read listings');
assert.match(grants,/grant update \(moderation_status\) on table public\.ff_market_listings to service_role;/i,'Only the status may be updated');
assert.match(grants,/grant select on table public\.ff_market_photos to service_role;/i,'Server must inspect all photos');
assert.match(grants,/grant select on table public\.ff_organizations to service_role;/i,'Partner listings need verified organizations');
assert.match(grants,/has_column_privilege\('authenticated'.*'moderation_status'.*'UPDATE'\)/,'Members must not self-approve');
assert.match(review,/withSupabase\(\{auth:\["user","none"\]\}/,'Seller JWTs and separately signed cron requests are the only supported entry paths');
assert.match(review,/if\(ctx\.authMode==="none"\)/,'Anonymous scheduling path must validate a signature');
assert.match(review,/ff_market_review_cron_verify/,'Cron signature must be verified server-side');
assert.match(review,/if\(!uid\)return fail\("Anmeldung erforderlich"/,'Seller path must reject unauthenticated requests');
assert.match(review,/model:"omni-moderation-latest"/,'Moderation API must run');
assert.match(review,/model:"gpt-4o-mini"/,'Contextual product review must run');
assert.match(review,/itemDecision==="review"/,'Uncertain results must not auto-publish');
assert.match(review,/flagged && itemDecision!=="block"/,'Flagged content must not auto-publish');
assert.match(review,/const newStatus=itemDecision==="block"\?"rejected":"approved"/,'Ordinary listings must automatically become approved');
assert.match(review,/eq\("review_version",listing\.review_version\)/,'Stale review results must not publish changed listings');
assert.doesNotMatch(app,/functions\.invoke\('ff-market-review'/,'App must never trigger priced automatic review');
assert.match(app,/bis zur manuellen Freigabe/,'Listings must remain unpublished pending a human review');
assert.match(review,/if\(true\)return Response\.json\(\{checked:0,paused:true\}/,'Scheduled jobs must pause before paid review');
assert.match(review,/if\(true\)return Response\.json\(\{status:"review_required"/,'New listings must await manual review');
console.log('Basarprüfung: bisherige Sicherheitsregeln und kostenfreie manuelle Freigabe geprüft.');
