import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../database/ff_ops_hourly_snapshots_20261122.sql',import.meta.url),'utf8');
const script=readFileSync(new URL('../scripts/staging-readonly-load.mjs',import.meta.url),'utf8');
for(const expression of [
 'create table if not exists private.ff_ops_snapshots',
 'create or replace function private.ff_ops_capture_snapshot()',
 'security invoker',
 'revoke all on table private.ff_ops_snapshots from public, anon, authenticated',
 'revoke all on function private.ff_ops_capture_snapshot() from public, anon, authenticated',
 'cron.schedule(',
 'ff_ops_hourly_snapshot',
 "delete from private.ff_ops_snapshots",
 "interval '14 days'",
 'pg_stat_database',
 'pg_stat_activity',
 'cron.job_run_details'
])assert.ok(sql.includes(expression),'Expected private monitoring guard '+expression);
assert.ok(!sql.includes('delete from cron.job_run_details'),'Do not delete shared Cron diagnostics');
const view=readFileSync(new URL('../database/ff_ops_private_status_view_20261122.sql',import.meta.url),'utf8');
assert.ok(view.includes('create or replace view private.ff_ops_latest_status'));
assert.ok(view.includes('security_invoker = true'),'Operator-only view must not bypass permissions');
assert.ok(view.includes('revoke all on private.ff_ops_latest_status from public, anon, authenticated'));
assert.ok(view.includes("then 'critical'")&&view.includes("then 'warning'")&&view.includes("else 'ok'"));
assert.ok(view.includes("interval '4 hours'"),'Detect a stalled hourly cron job');
assert.ok(!sql.includes('auth.users'),'Do not persist user information in metrics');
assert.ok(!sql.includes('security definer'),'No privileged function in an exposed schema');
assert.ok(script.includes('requireStagingTarget(env)'),'Production rejection must precede any network operation');
assert.ok(script.indexOf('requireStagingTarget(env)')<script.indexOf('await fetch('),'Guard must run before fetch');
assert.ok(script.includes("method:'POST'"),'RPCs use body-based PostgREST requests');
assert.ok(script.includes('FF_STAGE_USERS_JSON'),'Staging only needs synthetic accounts');
assert.ok(!script.includes('service_role_key'),'Never rely on service-role keys for simulated users');
console.log('Private free-tier ops snapshot and staging test guard checks passed');
