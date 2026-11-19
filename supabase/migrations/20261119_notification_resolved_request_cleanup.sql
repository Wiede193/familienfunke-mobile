-- Notifications: stop showing obsolete pending-request alerts when a request
-- was accepted, declined or cancelled. Otherwise users would see stale cards.
CREATE OR REPLACE FUNCTION private.ff_notify_contact_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
BEGIN
 IF TG_OP='INSERT' THEN
   IF NEW.status='pending' THEN
     PERFORM private.ff_create_notification(NEW.recipient_id,'request',NEW.sender_id,NEW.id);
   ELSIF NEW.status='accepted' THEN
     PERFORM private.ff_create_notification(NEW.sender_id,'match',NEW.recipient_id,NEW.id);
     PERFORM private.ff_create_notification(NEW.recipient_id,'match',NEW.sender_id,NEW.id);
   END IF;
 ELSIF TG_OP='UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
   IF OLD.status='pending' AND NEW.status IN ('accepted','declined','cancelled') THEN
     DELETE FROM public.ff_notifications
     WHERE kind='request' AND contact_id=NEW.id;
   END IF;
   IF NEW.status='accepted' THEN
     PERFORM private.ff_create_notification(NEW.sender_id,'match',NEW.recipient_id,NEW.id);
     PERFORM private.ff_create_notification(NEW.recipient_id,'match',NEW.sender_id,NEW.id);
   END IF;
 END IF;
 RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION private.ff_notify_contact_change() FROM PUBLIC,anon,authenticated;
