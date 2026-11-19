-- New messages in an accepted chat produce a private notification for the
-- other family only. No message content is copied into the notice.
CREATE OR REPLACE FUNCTION private.ff_notify_message_to_existing_inbox()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE v_recipient uuid;
BEGIN
 SELECT CASE WHEN c.sender_id=NEW.sender_id THEN c.recipient_id ELSE c.sender_id END
 INTO v_recipient FROM public.contact_requests c
 WHERE c.id=NEW.contact_id AND c.status='accepted'
   AND NEW.sender_id IN(c.sender_id,c.recipient_id);
 IF v_recipient IS NOT NULL THEN
   PERFORM private.ff_create_notification(
     v_recipient,'message',NEW.sender_id,NEW.contact_id,NEW.id);
 END IF;
 RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION private.ff_notify_message_to_existing_inbox() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_message_existing_inbox ON public.messages;
CREATE TRIGGER ff_message_existing_inbox AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION private.ff_notify_message_to_existing_inbox();
