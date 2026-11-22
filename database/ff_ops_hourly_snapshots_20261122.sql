-- Familienfunke Phase 5: free-plan database health snapshots.
-- No user identifiers, content, messages, IP addresses or private files.
-- All data and job entry points remain in the non-API "private" schema.
-- The cron job runs as postgres; anonymous and authenticated API roles get no access.

create table if not exists private.ff_ops_snapshots (
  observed_at timestamptz primary key default clock_timestamp(),
  database_bytes bigint not null,
  connection_count integer not null,
  active_queries integer not null,
  max_connections integer not null,
  waiting_locks integer not null,
  transactions_committed bigint not null,
  transactions_rolled_back bigint not null,
  deadlocks bigint not null,
  temporary_bytes bigint not null,
  cron_runs_last_hour integer not null,
  cron_failures_last_hour integer not null
);

revoke all on table private.ff_ops_snapshots from public, anon, authenticated;

create or replace function private.ff_ops_capture_snapshot()
returns void
language plpgsql volatile security invoker
set search_path = ''
as $$
begin
  insert into private.ff_ops_snapshots (
    database_bytes,connection_count,active_queries,max_connections,waiting_locks,
    transactions_committed,transactions_rolled_back,deadlocks,temporary_bytes,
    cron_runs_last_hour,cron_failures_last_hour
  )
  select
    pg_database_size(current_database()),
    (select count(*)::integer from pg_stat_activity a where a.datname=current_database()),
    (select count(*)::integer from pg_stat_activity a where a.datname=current_database() and a.state='active'),
    current_setting('max_connections')::integer,
    (select count(*)::integer from pg_locks where not granted),
    d.xact_commit,d.xact_rollback,d.deadlocks,d.temp_bytes,
    (select count(*)::integer from cron.job_run_details
      where start_time>now()-interval '1 hour'),
    (select count(*)::integer from cron.job_run_details
      where start_time>now()-interval '1 hour'
        and end_time is not null and status<>'succeeded')
  from pg_stat_database d where d.datname=current_database();

  -- Small bounded history. PostgreSQL cron metadata is NOT deleted.
  delete from private.ff_ops_snapshots
  where observed_at < now() - interval '14 days';
end;
$$;

revoke all on function private.ff_ops_capture_snapshot() from public, anon, authenticated;

-- Run once now to establish a baseline; then hourly at minute 17.
select private.ff_ops_capture_snapshot();
select cron.schedule(
  'ff_ops_hourly_snapshot',
  '17 * * * *',
  'select private.ff_ops_capture_snapshot();'
);
