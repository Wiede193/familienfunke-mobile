-- Safe, additive FK indexes for the pre-launch scalability pass.
-- These cover existing foreign keys and reduce cascading DELETE / JOIN scans.
-- On very large tables, schedule index creation during a maintenance window.
-- private.familienfunke_account_suspension_log(actor_user_id)
create index if not exists ff_launch_01_actor_user_id_idx on private.familienfunke_account_suspension_log (actor_user_id);

-- private.familienfunke_account_suspension_log(subject_user_id)
create index if not exists ff_launch_02_subject_user_id_idx on private.familienfunke_account_suspension_log (subject_user_id);

-- private.familienfunke_report_actions(report_id)
create index if not exists ff_launch_03_report_id_idx on private.familienfunke_report_actions (report_id);

-- private.familienfunke_verification_audit(reviewer_user_id)
create index if not exists ff_launch_04_reviewer_user_id_idx on private.familienfunke_verification_audit (reviewer_user_id);

-- private.familienfunke_verification_audit(subject_user_id)
create index if not exists ff_launch_05_subject_user_id_idx on private.familienfunke_verification_audit (subject_user_id);

-- private.familienfunke_verification_revocations(reviewer_user_id)
create index if not exists ff_launch_06_reviewer_user_id_idx on private.familienfunke_verification_revocations (reviewer_user_id);

-- private.familienfunke_verification_revocations(subject_user_id)
create index if not exists ff_launch_07_subject_user_id_idx on private.familienfunke_verification_revocations (subject_user_id);

-- private.ff_market_manual_decisions(reviewed_by)
create index if not exists ff_launch_08_reviewed_by_idx on private.ff_market_manual_decisions (reviewed_by);

-- private.ff_market_price_events(listing_id)
create index if not exists ff_launch_09_listing_id_idx on private.ff_market_price_events (listing_id);

-- private.ff_push_attempts(user_id)
create index if not exists ff_launch_10_user_id_idx on private.ff_push_attempts (user_id);

-- private.ff_push_queue(listing_id)
create index if not exists ff_launch_11_listing_id_idx on private.ff_push_queue (listing_id);

-- private.ff_push_queue(notification_id)
create index if not exists ff_launch_12_notification_id_idx on private.ff_push_queue (notification_id);

-- private.ff_push_queue(user_id)
create index if not exists ff_launch_13_user_id_idx on private.ff_push_queue (user_id);

-- public.ff_market_listings(organization_id)
create index if not exists ff_launch_14_organization_id_idx on public.ff_market_listings (organization_id);

-- public.ff_notifications(actor_id)
create index if not exists ff_launch_15_actor_id_idx on public.ff_notifications (actor_id);

-- public.ff_notifications(contact_id)
create index if not exists ff_launch_16_contact_id_idx on public.ff_notifications (contact_id);

-- public.ff_notifications(listing_id)
create index if not exists ff_launch_17_listing_id_idx on public.ff_notifications (listing_id);

-- public.ff_notifications(message_id)
create index if not exists ff_launch_18_message_id_idx on public.ff_notifications (message_id);

-- public.ff_organizations(owner_id)
create index if not exists ff_launch_19_owner_id_idx on public.ff_organizations (owner_id);

-- public.ff_partner_events(creator_id)
create index if not exists ff_launch_20_creator_id_idx on public.ff_partner_events (creator_id);

-- public.ff_partner_events(organization_id)
create index if not exists ff_launch_21_organization_id_idx on public.ff_partner_events (organization_id);

-- public.ff_personal_calendar(family_event_id)
create index if not exists ff_launch_22_family_event_id_idx on public.ff_personal_calendar (family_event_id);

-- public.ff_personal_calendar(partner_event_id)
create index if not exists ff_launch_23_partner_event_id_idx on public.ff_personal_calendar (partner_event_id);

-- public.messages(sender_id)
create index if not exists ff_launch_24_sender_id_idx on public.messages (sender_id);

-- public.reports(reporter_id)
create index if not exists ff_launch_25_reporter_id_idx on public.reports (reporter_id);
