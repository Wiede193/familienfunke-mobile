-- Restore the narrowly scoped service-role grants required by ff-market-review.
-- Marketplace tables intentionally revoke privileges from anon/authenticated.
-- PostgreSQL's BYPASSRLS for service_role does NOT bypass missing table grants.
-- The Edge Function uses a server-only service role and independently verifies seller,
-- verification, listing content, photos and moderation decisions.
grant select on table public.ff_market_listings to service_role;
grant update (moderation_status) on table public.ff_market_listings to service_role;
grant select on table public.ff_market_photos to service_role;
grant select on table public.ff_organizations to service_role;

do $$
begin
  if not has_table_privilege('service_role','public.ff_market_listings','SELECT')
    or not has_column_privilege('service_role','public.ff_market_listings','moderation_status','UPDATE')
    or not has_table_privilege('service_role','public.ff_market_photos','SELECT')
    or not has_table_privilege('service_role','public.ff_organizations','SELECT')
  then raise exception 'KI-Pruefdienst kann Basar-Tabellen nicht lesen/aktualisieren'; end if;
  if has_table_privilege('anon','public.ff_market_listings','SELECT')
    or has_column_privilege('authenticated','public.ff_market_listings','moderation_status','UPDATE')
  then raise exception 'Unbeabsichtigte Freigabe fuer App-Rollen'; end if;
end $$;
