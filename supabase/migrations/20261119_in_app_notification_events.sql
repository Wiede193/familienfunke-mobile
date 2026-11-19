-- Familienfunke: Ereignisse für Neuigkeiten ohne Nachrichteninhalt und mit Opt-out.
-- Echte Betriebssystem-Pushs benötigen ein separat freigegebenes Development Build;
-- diese Migration erzeugt KEINE externen Push-Nachrichten.
BEGIN;
CREATE TABLE IF NOT EXISTS public.ff_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('match','request','message')),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contact_requests(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT ff_notification_no_self CHECK(user_id<>actor_id),
  CONSTRAINT ff_notification_message_ref CHECK ((kind='message')=(message_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ff_notifications_owner_recent
  ON public.ff_notifications(user_id,created_at DESC,id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ff_notifications_unique_message
  ON public.ff_notifications(user_id,message_id) WHERE message_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ff_notifications_unique_connection
  ON public.ff_notifications(user_id,kind,contact_id) WHERE kind IN ('match','request');
ALTER TABLE public.ff_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ff_notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ff_notifications TO authenticated;
GRANT UPDATE(read_at) ON public.ff_notifications TO authenticated;
CREATE POLICY ff_notifications_owner_select ON public.ff_notifications
 FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY ff_notifications_owner_mark_read ON public.ff_notifications
 FOR UPDATE TO authenticated
 USING(user_id=(SELECT auth.uid()))
 WITH CHECK(user_id=(SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.ff_notification_preferences(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 notify_matches boolean NOT NULL DEFAULT true,
 notify_requests boolean NOT NULL DEFAULT true,
 notify_messages boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ff_notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ff_notification_preferences FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.ff_notification_preferences TO authenticated;
GRANT UPDATE(notify_matches,notify_requests,notify_messages) ON public.ff_notification_preferences TO authenticated;
CREATE POLICY ff_notification_prefs_owner_read ON public.ff_notification_preferences
 FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY ff_notification_prefs_owner_insert ON public.ff_notification_preferences
 FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()));
CREATE POLICY ff_notification_prefs_owner_update ON public.ff_notification_preferences
 FOR UPDATE TO authenticated USING(user_id=(SELECT auth.uid()))
 WITH CHECK(user_id=(SELECT auth.uid()));

CREATE OR REPLACE FUNCTION private.ff_create_notification(
 p_user_id uuid,p_kind text,p_actor_id uuid,p_contact_id uuid,p_message_id uuid DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE should_notify boolean;
BEGIN
 IF p_user_id IS NULL OR p_actor_id IS NULL OR p_user_id=p_actor_id THEN RETURN; END IF;
 IF p_kind NOT IN ('request','match','message') THEN RETURN; END IF;
 IF NOT private.is_active_adult(p_user_id) OR
    NOT private.not_blocked(p_user_id,p_actor_id) THEN RETURN; END IF;
 SELECT CASE p_kind WHEN 'match' THEN notify_matches
                    WHEN 'request' THEN notify_requests
                    WHEN 'message' THEN notify_messages END
 INTO should_notify FROM public.ff_notification_preferences
 WHERE user_id=p_user_id;
 IF should_notify IS FALSE THEN RETURN; END IF;
 INSERT INTO public.ff_notifications(user_id,kind,actor_id,contact_id,message_id)
 VALUES(p_user_id,p_kind,p_actor_id,p_contact_id,p_message_id)
 ON CONFLICT DO NOTHING;
END
$body$;
REVOKE ALL ON FUNCTION private.ff_create_notification(uuid,text,uuid,uuid,uuid)
 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.ff_notify_contact_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
BEGIN
 IF TG_OP='INSERT' AND NEW.status='pending' THEN
   PERFORM private.ff_create_notification(NEW.recipient_id,'request',NEW.sender_id,NEW.id);
 ELSIF NEW.status='accepted' AND
     (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
   PERFORM private.ff_create_notification(NEW.sender_id,'match',NEW.recipient_id,NEW.id);
   PERFORM private.ff_create_notification(NEW.recipient_id,'match',NEW.sender_id,NEW.id);
 END IF;
 RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION private.ff_notify_contact_change() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_notify_new_contact ON public.contact_requests;
CREATE TRIGGER ff_notify_new_contact
 AFTER INSERT OR UPDATE OF status ON public.contact_requests
 FOR EACH ROW EXECUTE FUNCTION private.ff_notify_contact_change();

CREATE OR REPLACE FUNCTION private.ff_notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE other_id uuid;
BEGIN
 SELECT CASE WHEN c.sender_id=NEW.sender_id THEN c.recipient_id
             WHEN c.recipient_id=NEW.sender_id THEN c.sender_id
             ELSE NULL END
 INTO other_id FROM public.contact_requests c
 WHERE c.id=NEW.contact_id AND c.status='accepted';
 IF other_id IS NOT NULL THEN
   PERFORM private.ff_create_notification(other_id,'message',NEW.sender_id,NEW.contact_id,NEW.id);
 END IF;
 RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION private.ff_notify_new_message() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_notify_new_message ON public.messages;
CREATE TRIGGER ff_notify_new_message AFTER INSERT ON public.messages
 FOR EACH ROW EXECUTE FUNCTION private.ff_notify_new_message();

-- A block also erases previously queued relationship notifications, while
-- deleting an account automatically removes its own notifications.
CREATE OR REPLACE FUNCTION private.ff_erase_blocked_notifications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
BEGIN
 DELETE FROM public.ff_notifications n
 WHERE (n.user_id=NEW.blocker_id AND n.actor_id=NEW.blocked_id)
    OR (n.user_id=NEW.blocked_id AND n.actor_id=NEW.blocker_id);
 RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION private.ff_erase_blocked_notifications() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_erase_notifications_on_block ON public.blocks;
CREATE TRIGGER ff_erase_notifications_on_block AFTER INSERT ON public.blocks
 FOR EACH ROW EXECUTE FUNCTION private.ff_erase_blocked_notifications();
COMMIT;
