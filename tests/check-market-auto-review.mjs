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
assert.match(review,/withSupabase\(\{auth:"user"\}/,'Only authenticated sellers may trigger review');
assert.match(review,/model:"omni-moderation-latest"/,'Moderation API must run');
assert.match(review,/model:"gpt-4o-mini"/,'Contextual product review must run');
assert.match(review,/itemDecision==="review"/,'Uncertain results must not auto-publish');
assert.match(review,/flagged && itemDecision!=="block"/,'Flagged content must not auto-publish');
assert.match(review,/const newStatus=itemDecision==="block"\?"rejected":"approved"/,'Ordinary listings must automatically become approved');
assert.match(review,/eq\("review_version",listing\.review_version\)/,'Stale review results must not publish changed listings');
assert.match(app,/retryReview=\{\(id\)=>execute/,'Owners must be able to retry a failed check');
assert.match(app,/KI-Prüfung erneut starten/,'Retry control must exist in the listing details');
assert.match(app,/Die KI konnte keine sichere Freigabe erteilen/,'Review cases must be visible');
assert.match(app,/die automatische KI-Prüfung ist gerade nicht verfügbar/,'Technical errors must not masquerade as human review');
console.log('Automatische Basarfreigabe: Dienstrechte, KI-Grenzfälle und Fehlerwiederholung geprüft.');
