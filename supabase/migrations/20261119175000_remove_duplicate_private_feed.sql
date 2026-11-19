-- The app already has canonical public.ff_notifications with its own RLS and
-- existing triggers. Remove the duplicate experimental private event feed.
-- Preserve private.ff_push_preferences/devices and their authenticated RPCs.
DROP TRIGGER IF EXISTS ff_notify_contact_change ON public.contact_requests;
DROP TRIGGER IF EXISTS ff_notify_new_message ON public.messages;
DROP FUNCTION IF EXISTS private.ff_notice_contacts();
DROP FUNCTION IF EXISTS private.ff_notice_messages();
DROP FUNCTION IF EXISTS public.ff_notification_feed(integer);
DROP FUNCTION IF EXISTS public.ff_notification_mark_read(bigint);
DROP TABLE IF EXISTS private.ff_notices;
-- Canonical existing notification trigger ff_notify_new_contact remains active.
-- Message alert delivery for public.ff_notifications is handled in a separate
-- migration below.
