-- An operator-only current status derived from existing private snapshots.
-- Status does not send notifications. It is intentionally NOT exposed to the Data API.
create or replace view private.ff_ops_latest_status
with (security_invoker = true)
as
select
  s.observed_at,
  s.database_bytes,
  s.connection_count,
  s.max_connections,
  s.waiting_locks,
  s.cron_failures_last_hour,
  round(s.database_bytes * 100.0 / (500 * 1024 * 1024),1) as database_quota_percent,
  round(s.connection_count * 100.0 / nullif(s.max_connections,0),1) as connections_percent,
  case
    when s.observed_at < now()-interval '4 hours'
      or s.database_bytes >= 450 * 1024 * 1024
      or s.connection_count >= s.max_connections * 0.9
      or s.cron_failures_last_hour >= 5
      or s.waiting_locks >= 5
      then 'critical'
    when s.observed_at < now()-interval '2 hours'
      or s.database_bytes >= 350 * 1024 * 1024
      or s.connection_count >= s.max_connections * 0.7
      or s.cron_failures_last_hour > 0
      or s.waiting_locks > 0
      then 'warning'
    else 'ok'
  end as technical_status
from private.ff_ops_snapshots s
order by s.observed_at desc
limit 1;

revoke all on private.ff_ops_latest_status from public, anon, authenticated;
