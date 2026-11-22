-- Familienfunke Phase 8: secure contact writes through narrowly scoped private
-- SECURITY DEFINER functions. Do not grant direct INSERT/UPDATE on contact_requests.
-- The existing unique unordered pair index already prevents duplicate contacts.
--
-- The exposed public RPCs are SECURITY INVOKER only and delegate to a separate,
-- non-exposed schema that contains only these two reviewed, permission-checked
-- definer functions. This avoids granting broad private-schema usage to clients.

create schema if not exists ff_contact_internal;
revoke all on schema ff_contact_internal from public, anon, authenticated;
grant usage on schema ff_contact_internal to authenticated;

create or replace function ff_contact_internal.create_request(p_recipient_id uuid)
returns public.contact_requests
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  existing public.contact_requests;
begin
  if actor is null then
    raise exception 'FF_AUTH_REQUIRED' using errcode='28000';
  end if;
  if p_recipient_id is null or p_recipient_id=actor then
    raise exception 'FF_CONTACT_INVALID_TARGET' using errcode='22023';
  end if;

  -- A repeated request for the same unordered pair must never produce
  -- another notification or try to re-open an already finalised request.
  select c.* into existing
    from public.contact_requests c
   where least(c.sender_id,c.recipient_id)=least(actor,p_recipient_id)
     and greatest(c.sender_id,c.recipient_id)=greatest(actor,p_recipient_id)
   limit 1;
  if found then
    if existing.status in ('pending','accepted') then return existing; end if;
    raise exception 'FF_CONTACT_ALREADY_CLOSED' using errcode='P0001';
  end if;

  -- Match or strengthen the prior RLS insert requirements without using the
  -- broad authenticated table write grants previously revoked for safety.
  if not private.is_active_adult(actor)
     or not private.is_active_adult(p_recipient_id)
     or not private.not_blocked(actor,p_recipient_id) then
    raise exception 'FF_CONTACT_NOT_ALLOWED' using errcode='42501';
  end if;
  if not exists (
    select 1 from public.profiles p
     where p.user_id=p_recipient_id and p.is_discoverable
  ) then
    raise exception 'FF_CONTACT_NOT_DISCOVERABLE' using errcode='42501';
  end if;

  insert into public.contact_requests (sender_id,recipient_id,status)
    values (actor,p_recipient_id,'pending')
    on conflict do nothing
    returning * into existing;

  -- If another device inserted the same pair concurrently, return its
  -- authoritatively stored row.  Nothing is inserted twice.
  if existing.id is null then
    select c.* into existing
      from public.contact_requests c
     where least(c.sender_id,c.recipient_id)=least(actor,p_recipient_id)
       and greatest(c.sender_id,c.recipient_id)=greatest(actor,p_recipient_id)
     limit 1;
  end if;
  if existing.id is null then
    raise exception 'FF_CONTACT_CONFLICT' using errcode='P0001';
  end if;
  if existing.status not in ('pending','accepted') then
    raise exception 'FF_CONTACT_ALREADY_CLOSED' using errcode='P0001';
  end if;
  return existing;
end;
$$;

create or replace function ff_contact_internal.respond_request(
  p_contact_id uuid,p_status text
)
returns public.contact_requests
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_contact public.contact_requests;
  updated public.contact_requests;
begin
  if actor is null then
    raise exception 'FF_AUTH_REQUIRED' using errcode='28000';
  end if;
  if p_contact_id is null or p_status not in ('accepted','declined','cancelled') then
    raise exception 'FF_CONTACT_BAD_STATUS' using errcode='22023';
  end if;
  select c.* into current_contact
    from public.contact_requests c
   where c.id=p_contact_id
     and actor in (c.sender_id,c.recipient_id);
  if not found then
    raise exception 'FF_CONTACT_NOT_FOUND' using errcode='42501';
  end if;

  if current_contact.status=p_status then return current_contact; end if;
  if current_contact.status<>'pending' then
    raise exception 'FF_CONTACT_ALREADY_CHANGED' using errcode='P0001';
  end if;
  if not private.is_active_adult(actor) then
    raise exception 'FF_CONTACT_NOT_ALLOWED' using errcode='42501';
  end if;

  -- Receiver may accept/reject; sender may cancel, or use the existing
  -- mutual-swipe exception guarded again by contact_status_guard().
  if not (
    (actor=current_contact.recipient_id and p_status in ('accepted','declined'))
    or (actor=current_contact.sender_id and p_status in ('cancelled','accepted'))
  ) then
    raise exception 'FF_CONTACT_STATUS_FORBIDDEN' using errcode='42501';
  end if;

  update public.contact_requests c
     set status=p_status
   where c.id=p_contact_id and c.status='pending'
   returning * into updated;

  if updated.id is not null then return updated; end if;

  -- Competing client already applied the same transition.
  select c.* into updated
    from public.contact_requests c
   where c.id=p_contact_id and actor in (c.sender_id,c.recipient_id);
  if updated.id is not null and updated.status=p_status then return updated; end if;
  raise exception 'FF_CONTACT_ALREADY_CHANGED' using errcode='P0001';
end;
$$;

revoke all on function ff_contact_internal.create_request(uuid) from public, anon, authenticated;
revoke all on function ff_contact_internal.respond_request(uuid,text) from public, anon, authenticated;
grant execute on function ff_contact_internal.create_request(uuid) to authenticated;
grant execute on function ff_contact_internal.respond_request(uuid,text) to authenticated;

create or replace function public.ff_contact_create(p_recipient_id uuid)
returns public.contact_requests
language sql volatile security invoker
set search_path = ''
as $$ select ff_contact_internal.create_request(p_recipient_id); $$;

create or replace function public.ff_contact_respond(p_contact_id uuid,p_status text)
returns public.contact_requests
language sql volatile security invoker
set search_path = ''
as $$ select ff_contact_internal.respond_request(p_contact_id,p_status); $$;

create or replace function public.ff_message_request_id()
returns uuid
language sql volatile security invoker
set search_path = ''
as $$ select case when auth.uid() is not null then gen_random_uuid() else null::uuid end; $$;

revoke all on function public.ff_contact_create(uuid) from public,anon,authenticated;
revoke all on function public.ff_contact_respond(uuid,text) from public,anon,authenticated;
revoke all on function public.ff_message_request_id() from public,anon,authenticated;
grant execute on function public.ff_contact_create(uuid) to authenticated;
grant execute on function public.ff_contact_respond(uuid,text) to authenticated;
grant execute on function public.ff_message_request_id() to authenticated;

-- No direct table write grants are introduced.
