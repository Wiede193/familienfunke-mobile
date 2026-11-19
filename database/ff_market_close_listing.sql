-- Familienfunke: Ein Inserat abschließen, ohne Online-Bezahlung
-- Sicherheitsregel: Nur ein aktives erwachsenes Verkäuferkonto darf sein
-- bereits veröffentlichtes Inserat auf "sold" setzen.
-- Keine Kundeneingabe kann den Status "approved" erzeugen.
create or replace function public.ff_market_mark_sold(p_listing_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    return false;
  end if;

  if not private.is_active_adult(v_user_id) then
    return false;
  end if;

  update public.ff_market_listings
     set moderation_status = 'sold'
   where id = p_listing_id
     and seller_id = v_user_id
     and moderation_status = 'approved';

  return found;
end;
$function$;

-- PostgreSQL gibt bei neuen Funktionen sonst EXECUTE an PUBLIC frei.
revoke all on function public.ff_market_mark_sold(uuid) from public;
revoke all on function public.ff_market_mark_sold(uuid) from anon;
grant execute on function public.ff_market_mark_sold(uuid) to authenticated;

comment on function public.ff_market_mark_sold(uuid) is
  'Schließt nur das eigene veröffentlichte Inserat ab. Kein Bezahlvorgang.';
