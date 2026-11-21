-- A calendar belongs to a single account. No contact or public visibility.
create table public.ff_personal_calendar (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('personal','outing','family','partner')),
 title text not null default '' check(char_length(title)<=100),
 day date check(day between date '1900-01-01' and date '2100-12-31'),
 local_time time(0) without time zone,
 note text not null default '' check(char_length(note)<=500),
 place_id text check(char_length(place_id)<=100),
 family_event_id uuid references public.events(id) on delete cascade,
 partner_event_id uuid references public.ff_partner_events(id) on delete cascade,
 created_at timestamptz not null default now(),
 constraint ff_calendar_shape check(
  (kind in ('personal','outing') and day is not null and char_length(btrim(title))>=2
   and family_event_id is null and partner_event_id is null and (kind='outing' or place_id is null))
  or (kind='family' and family_event_id is not null and partner_event_id is null
   and day is null and local_time is null and title='' and note='' and place_id is null)
  or (kind='partner' and partner_event_id is not null and family_event_id is null
   and day is null and local_time is null and title='' and note='' and place_id is null)
 )
);
alter table public.ff_personal_calendar enable row level security;
revoke all on public.ff_personal_calendar from public,anon,authenticated;
grant select,delete on public.ff_personal_calendar to authenticated;
grant insert(user_id,kind,title,day,local_time,note,place_id,family_event_id,partner_event_id) on public.ff_personal_calendar to authenticated;
grant update(title,day,local_time,note) on public.ff_personal_calendar to authenticated;
create index ff_calendar_owner on public.ff_personal_calendar(user_id);
create unique index ff_calendar_family_once on public.ff_personal_calendar(user_id,family_event_id) where family_event_id is not null;
create unique index ff_calendar_partner_once on public.ff_personal_calendar(user_id,partner_event_id) where partner_event_id is not null;
create policy ff_calendar_read on public.ff_personal_calendar for select to authenticated using(user_id=(select auth.uid()));
create policy ff_calendar_remove on public.ff_personal_calendar for delete to authenticated using(user_id=(select auth.uid()));
create policy ff_calendar_insert on public.ff_personal_calendar for insert to authenticated with check(
 user_id=(select auth.uid()) and
 (kind in ('personal','outing') or
  (kind='family' and exists(select 1 from public.events e where e.id=family_event_id
   and e.moderation_status='approved' and e.ends_at>statement_timestamp()))
  or (kind='partner' and exists(select 1 from public.ff_partner_events e where e.id=partner_event_id
   and e.moderation_status='approved' and e.starts_at>statement_timestamp())))
);
create policy ff_calendar_update on public.ff_personal_calendar for update to authenticated
 using(user_id=(select auth.uid()) and kind in ('personal','outing'))
 with check(user_id=(select auth.uid()) and kind in ('personal','outing'));

create or replace function private.ff_calendar_limit()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('ff_personal_calendar:'||new.user_id::text,0));
 if (select count(*) from public.ff_personal_calendar where user_id=new.user_id)>=300 then
  raise exception 'Maximal 300 Kalendereinträge' using errcode='22023';
 end if;
 return new;
end $$;
revoke all on function private.ff_calendar_limit() from public,anon,authenticated,service_role;
create trigger ff_calendar_limit before insert on public.ff_personal_calendar
 for each row execute function private.ff_calendar_limit();

-- Event data is read live under the caller's existing RLS, never copied into a private snapshot.
create or replace function public.ff_calendar_list()
returns table(id uuid,kind text,title text,day date,local_time time without time zone,note text,
 place_id text,source_id uuid,starts_at timestamptz,region_label text,available boolean)
language sql stable security invoker set search_path='' as $$
 select c.id,c.kind,
 case when c.kind='family' then coalesce(e.title,'') when c.kind='partner' then coalesce(p.title,'') else c.title end,
 c.day,c.local_time,c.note,c.place_id,coalesce(c.family_event_id,c.partner_event_id),
 coalesce(e.starts_at,p.starts_at),coalesce(e.region_label,p.region_label,''),
 case when c.kind='family' then e.id is not null when c.kind='partner' then p.id is not null else true end
 from public.ff_personal_calendar c
 left join public.events e on c.family_event_id=e.id and e.moderation_status='approved'
 left join public.ff_partner_events p on c.partner_event_id=p.id and p.moderation_status='approved'
 where c.user_id=(select auth.uid())
 order by c.created_at desc limit 300
$$;
revoke all on function public.ff_calendar_list() from public,anon,authenticated;
grant execute on function public.ff_calendar_list() to authenticated;
