-- Familienfunke: während der kostenfreien Entwicklung keine kostenpflichtige KI.
-- Bereits live angewendet: Supabase-Migration ff_market_zero_cost_manual_review.
-- Automatische Freigabe bleibt gesperrt; nur berechtigte Moderatoren dürfen freigeben.
create or replace function private.ff_market_review_queue_sync()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
  if tg_op='INSERT' then
    if new.moderation_status='pending' then
      insert into public.ff_market_review_jobs
        (listing_id,review_version,state,reason,due_at)
      values(new.id,new.review_version,'manual','paid_ai_disabled',now());
    end if;
  elsif new.moderation_status<>'pending' then
    delete from public.ff_market_review_jobs where listing_id=new.id;
  elsif new.review_version is distinct from old.review_version then
    update public.ff_market_review_jobs set
      review_version=new.review_version,state='manual',attempts=0,
      due_at=now(),lease_id=null,leased_until=null,
      reason='paid_ai_disabled',updated_at=now()
    where listing_id=new.id;
  end if;
  return new;
end $fn$;

-- Bestehende unveröffentlichte Warteschlangenfälle nicht mit KI bearbeiten.
update public.ff_market_review_jobs j set
  state='manual',lease_id=null,leased_until=null,
  reason='paid_ai_disabled',due_at=now(),updated_at=now()
from public.ff_market_listings l
where l.id=j.listing_id and l.moderation_status='pending'
  and j.review_version=l.review_version
  and j.state in ('queued','processing','retry');
