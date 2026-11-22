-- Nur Metadaten, keine Nutzerdaten. Nach Installation als Administrator ausführen.
select c.relrowsecurity as rls_enabled,
 has_table_privilege('anon',c.oid,'SELECT') as anon_read,
 has_table_privilege('anon',c.oid,'INSERT') as anon_insert,
 has_any_column_privilege('anon',c.oid,'UPDATE') as anon_update,
 has_table_privilege('authenticated',c.oid,'SELECT') as authenticated_read,
 has_table_privilege('authenticated',c.oid,'INSERT') as authenticated_insert,
 has_column_privilege('authenticated',c.oid,'user_id','UPDATE') as can_reassign_owner,
 has_column_privilege('authenticated',c.oid,'revision','UPDATE') as can_update_revision
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='ff_layout_preferences';
-- Erwartet: true, false, false, false, true, true, false, true.
select policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename='ff_layout_preferences' order by policyname;
select tgname,tgenabled from pg_trigger
where tgrelid=to_regclass('public.ff_layout_preferences') and not tgisinternal;
