-- Source-observed changes are NOT published legal changes.
-- Existing user-facing decision_status changes only after an explicit verified review.
alter table public.ff_official_decisions
 add column if not exists dip_vorgang_id text,
 add column if not exists status_review_pending boolean not null default false,
 add column if not exists last_official_check_at timestamptz;
alter table public.ff_official_decisions
 drop constraint if exists ff_decisions_dip_id_shape;
alter table public.ff_official_decisions
 add constraint ff_decisions_dip_id_shape check (dip_vorgang_id is null or dip_vorgang_id ~ '^[0-9]{3,12}$');
create unique index if not exists ff_decisions_dip_id_unique
 on public.ff_official_decisions(dip_vorgang_id) where dip_vorgang_id is not null;

-- These specific procedure IDs match independently checked, official DIP links.
update public.ff_official_decisions set dip_vorgang_id='333136'
 where source_key='editorial:kindergeld-2026-10-20-verkuendung';
update public.ff_official_decisions set dip_vorgang_id='338785'
 where source_key='editorial:kita-startchancen-2026-11-20-vermittlung';

create table if not exists public.ff_decision_source_snapshots (
 decision_id uuid not null references public.ff_official_decisions(id) on delete cascade,
 source_kind text not null check(source_kind in ('dip','website')),
 last_checked_at timestamptz,
 last_success_at timestamptz,
 last_http_status int,
 content_fingerprint text,
 failure_count int not null default 0,
 last_error text,
 checked_source_url text,
 primary key(decision_id,source_kind)
);
alter table public.ff_decision_source_snapshots enable row level security;
revoke all on public.ff_decision_source_snapshots from public,anon,authenticated;
grant all on public.ff_decision_source_snapshots to service_role;

create table if not exists public.ff_decision_change_candidates (
 id uuid primary key default gen_random_uuid(),
 decision_id uuid not null references public.ff_official_decisions(id) on delete cascade,
 source_kind text not null check(source_kind in ('dip','website')),
 evidence_url text not null check(evidence_url ~ '^https://'),
 fingerprint text not null check(length(fingerprint)=64),
 observed_source_status text,
 proposed_status text check(proposed_status is null or proposed_status in
  ('kabinett','parlament','vermittlung','vereinbarung','verkuendet','inkraft','unklar')),
 observed_source_updated_at timestamptz,
 first_seen_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 review_state text not null default 'pending' check(review_state in ('pending','accepted','dismissed')),
 review_note text,
 reviewed_at timestamptz,
 unique(decision_id,source_kind,fingerprint)
);
create index if not exists ff_decision_change_pending
 on public.ff_decision_change_candidates(first_seen_at)
 where review_state='pending';
alter table public.ff_decision_change_candidates enable row level security;
revoke all on public.ff_decision_change_candidates from public,anon,authenticated;
grant all on public.ff_decision_change_candidates to service_role;

create table if not exists public.ff_decision_tracking_runs (
 id bigint generated always as identity primary key,
 started_at timestamptz not null default now(),
 completed_at timestamptz,
 checked_pages int not null default 0,
 checked_dip int not null default 0,
 new_candidates int not null default 0,
 dip_configured boolean not null default false,
 errors text[] not null default '{}'::text[]
);
alter table public.ff_decision_tracking_runs enable row level security;
revoke all on public.ff_decision_tracking_runs from public,anon,authenticated;
grant all on public.ff_decision_tracking_runs to service_role;

create table if not exists public.ff_decision_status_history (
 id uuid primary key default gen_random_uuid(),
 decision_id uuid not null references public.ff_official_decisions(id) on delete cascade,
 status text not null check(status in
  ('kabinett','parlament','vermittlung','vereinbarung','verkuendet','inkraft','unklar')),
 event_kind text not null check(event_kind in ('baseline','update')),
 previous_status text,
 evidence_url text not null check(evidence_url ~ '^https://'),
 evidence_note text not null check(length(evidence_note) between 20 and 750),
 verified_at timestamptz not null default now(),
 unique(decision_id,verified_at,event_kind)
);
create index if not exists ff_decision_history_recent on public.ff_decision_status_history(decision_id,verified_at desc);
alter table public.ff_decision_status_history enable row level security;
revoke all on public.ff_decision_status_history from public,anon,authenticated;
grant select on public.ff_decision_status_history to authenticated;
grant all on public.ff_decision_status_history to service_role;
drop policy if exists ff_history_published_decision on public.ff_decision_status_history;
create policy ff_history_published_decision on public.ff_decision_status_history
 for select to authenticated using (
  exists(select 1 from public.ff_official_decisions d
   where d.id=decision_id and d.published=true)
 );

-- Baselines reflect precisely the existing editorial status, not fictitious historical events.
insert into public.ff_decision_status_history
 (decision_id,status,event_kind,evidence_url,evidence_note,verified_at)
select d.id,d.decision_status,'baseline',d.source_url,
 'Dokumentierter Ausgangsstand des Familienfunke-Beschlussmonitors; keine behauptete frühere Statusänderung.',
 coalesce(d.status_checked_at,now())
from public.ff_official_decisions d
where d.editorial_reviewed=true
and not exists(select 1 from public.ff_decision_status_history h where h.decision_id=d.id);

-- New status events are a separate notification identity. One notice per change,
-- not merely one notice per bill, and only for users who have opted in.
alter table public.ff_notifications
 add column if not exists decision_revision_id uuid
 references public.ff_decision_status_history(id) on delete cascade;
alter table public.ff_notifications drop constraint if exists ff_notifications_kind_check;
alter table public.ff_notifications add constraint ff_notifications_kind_check check (
 kind in ('match','request','message','market','search','price','decision','decision_update'));
alter table public.ff_notifications drop constraint if exists ff_notification_market_shape;
alter table public.ff_notifications add constraint ff_notification_market_shape check (
 ((kind='market') and actor_id is null and contact_id is null and message_id is null
  and listing_id is not null and listing_status in ('approved','rejected')
  and decision_id is null and decision_revision_id is null)
 or ((kind in ('search','price')) and actor_id is null and contact_id is null and message_id is null
  and listing_id is not null and listing_status='approved'
  and decision_id is null and decision_revision_id is null)
 or ((kind='decision') and actor_id is null and contact_id is null and message_id is null
  and listing_id is null and listing_status is null and decision_id is not null and decision_revision_id is null)
 or ((kind='decision_update') and actor_id is null and contact_id is null and message_id is null
  and listing_id is null and listing_status is null and decision_id is not null and decision_revision_id is not null)
 or ((kind in ('match','request','message')) and actor_id is not null
  and listing_id is null and listing_status is null and decision_id is null and decision_revision_id is null)
);
create unique index if not exists ff_notification_decision_revision_unique
 on public.ff_notifications(user_id,decision_revision_id)
 where kind='decision_update';

create or replace function private.ff_decision_history_notification()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.event_kind='update' and new.status is distinct from new.previous_status then
  insert into public.ff_notifications(user_id,kind,decision_id,decision_revision_id)
  select s.user_id,'decision_update',d.id,new.id
  from public.ff_decision_subscriptions s
  join public.ff_official_decisions d on d.id=new.decision_id
  where s.enabled=true and d.published=true
    and (cardinality(s.topics)=0 or d.family_topic=any(s.topics))
  on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function private.ff_decision_history_notification() from public,anon,authenticated;
drop trigger if exists ff_decision_history_notice on public.ff_decision_status_history;
create trigger ff_decision_history_notice after insert
 on public.ff_decision_status_history for each row
 execute function private.ff_decision_history_notification();

-- Editorial release happens in one transaction; no client or monitoring job can call it.
create or replace function private.ff_confirm_decision_status(
 p_candidate_id uuid,p_new_status text,p_evidence_note text)
returns boolean language plpgsql security definer set search_path='' as $$
declare c record; d record;
begin
 if p_new_status not in ('kabinett','parlament','vermittlung','vereinbarung','verkuendet','inkraft','unklar')
    or length(btrim(coalesce(p_evidence_note,'')))<30 then return false; end if;
 select * into c from public.ff_decision_change_candidates
  where id=p_candidate_id and review_state='pending' for update;
 if not found then return false;end if;
 select * into d from public.ff_official_decisions where id=c.decision_id for update;
 if not found then return false;end if;
 if c.evidence_url !~ '^https://' then return false;end if;
 if p_new_status is distinct from d.decision_status then
  update public.ff_official_decisions set
    decision_status=p_new_status,status_checked_at=now(),updated_at=now()
  where id=d.id;
  insert into public.ff_decision_status_history
   (decision_id,status,previous_status,event_kind,evidence_url,evidence_note)
  values (d.id,p_new_status,d.decision_status,'update',c.evidence_url,p_evidence_note);
 else
  update public.ff_official_decisions set status_checked_at=now() where id=d.id;
 end if;
 update public.ff_decision_change_candidates set review_state='accepted',
  review_note=p_evidence_note,reviewed_at=now() where id=c.id;
 update public.ff_official_decisions set status_review_pending=exists(
  select 1 from public.ff_decision_change_candidates x
  where x.decision_id=d.id and x.review_state='pending'
 ) where id=d.id;
 return true;
end $;
revoke all on function private.ff_confirm_decision_status(uuid,text,text) from public,anon,authenticated;
grant execute on function private.ff_confirm_decision_status(uuid,text,text) to service_role;

create or replace function public.ff_inbox_page_by_kind(
 p_kind text,p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language sql stable set search_path='' as $$
select jsonb_build_object(
 'unread',coalesce(c.unread,0),'total',coalesce(c.total,0),
 'price_unread',coalesce(c.price_unread,0),'decision_unread',coalesce(c.decision_unread,0),
 'rows',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc)
  from (select id,kind,contact_id,listing_id,listing_status,decision_id,decision_revision_id,
    (select d.title from public.ff_official_decisions d
     where d.id=n.decision_id and d.published=true) as decision_title,
    (select h.status from public.ff_decision_status_history h
     where h.id=n.decision_revision_id) as updated_status,
    created_at,read_at,old_price_cents,new_price_cents
   from public.ff_notifications n
   where n.user_id=(select auth.uid())
     and (p_kind='all' or n.kind=p_kind
      or (p_kind='decision' and n.kind='decision_update'))
     and (p_before is null or (n.created_at,n.id)<(p_before,p_before_id))
   order by n.created_at desc,n.id desc limit 40) x),'[]'::jsonb),
 'as_of',statement_timestamp())
from (select count(*) as total,
 count(*) filter(where read_at is null) as unread,
 count(*) filter(where kind='price' and read_at is null) as price_unread,
 count(*) filter(where kind in ('decision','decision_update') and read_at is null) as decision_unread
 from public.ff_notifications where user_id=(select auth.uid())) c
where p_kind in ('all','price','decision') and auth.uid() is not null
$$;
revoke all on function public.ff_inbox_page_by_kind(text,timestamptz,uuid)
 from public,anon,authenticated;
grant execute on function public.ff_inbox_page_by_kind(text,timestamptz,uuid) to authenticated;


-- Website timestamps and page layout changes often do NOT mean new law.
-- Allow editors to dismiss false positives without sending any notice.
create or replace function private.ff_dismiss_decision_candidate(
 p_candidate_id uuid,p_explanation text)
returns boolean language plpgsql security definer set search_path='' as $
declare c record;
begin
 if length(btrim(coalesce(p_explanation,'')))<20 then return false; end if;
 select * into c from public.ff_decision_change_candidates
  where id=p_candidate_id and review_state='pending' for update;
 if not found then return false;end if;
 update public.ff_decision_change_candidates set
  review_state='dismissed',review_note=p_explanation,reviewed_at=now()
  where id=c.id;
 update public.ff_official_decisions d set status_review_pending=exists(
  select 1 from public.ff_decision_change_candidates x
   where x.decision_id=d.id and x.review_state='pending'
 ) where d.id=c.decision_id;
 return true;
end $;
revoke all on function private.ff_dismiss_decision_candidate(uuid,text)
 from public,anon,authenticated;
grant execute on function private.ff_dismiss_decision_candidate(uuid,text)
 to service_role;

-- Cycle through the least recently checked entries so older but unresolved
-- legislation never starves after the first 15 cards have been added.
create or replace function public.ff_decision_tracking_due(p_limit integer default 15)
returns table(id uuid,source_url text,dip_vorgang_id text,decision_status text)
language sql stable security invoker set search_path='' as $$
 select d.id,d.source_url,d.dip_vorgang_id,d.decision_status
 from public.ff_official_decisions d
 left join public.ff_decision_source_snapshots s
  on s.decision_id=d.id and s.source_kind='website'
 where d.published=true
 order by s.last_checked_at asc nulls first,d.published_at desc
 limit least(greatest(coalesce(p_limit,15),1),15)
$$;
revoke all on function public.ff_decision_tracking_due(integer) from public,anon,authenticated;
grant execute on function public.ff_decision_tracking_due(integer) to service_role;
