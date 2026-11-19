-- Familienfunke: private Inbox / Push-Opt-in, keine Nachrichteninhalte.
-- Die Inbox funktioniert mit normalem App-Abruf, Push erst mit Development Build.
CREATE TABLE IF NOT EXISTS private.ff_notices(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('match','request','message')),
 contact_id uuid NOT NULL REFERENCES public.contact_requests(id) ON DELETE CASCADE,
 event_key text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 read_at timestamptz,
 UNIQUE(recipient_id,event_key)
);
CREATE INDEX IF NOT EXISTS ff_notices_recipient_time ON private.ff_notices(recipient_id,created_at DESC);
ALTER TABLE private.ff_notices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.ff_notices FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS private.ff_push_preferences(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 push_enabled boolean NOT NULL DEFAULT false,
 match_alerts boolean NOT NULL DEFAULT true,
 request_alerts boolean NOT NULL DEFAULT true,
 message_alerts boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.ff_push_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.ff_push_preferences FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS private.ff_push_devices(
 expo_token text PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ff_valid_expo_token CHECK (
   (expo_token LIKE 'ExpoPushToken[%' OR expo_token LIKE 'ExponentPushToken[%')
   AND char_length(expo_token) BETWEEN 25 AND 256
 )
);
CREATE INDEX IF NOT EXISTS ff_push_devices_user_idx ON private.ff_push_devices(user_id);
ALTER TABLE private.ff_push_devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.ff_push_devices FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.ff_notice_contacts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
BEGIN
 IF NEW.status='pending' AND TG_OP='INSERT' THEN
  INSERT INTO private.ff_notices(recipient_id,kind,contact_id,event_key)
  VALUES(NEW.recipient_id,'request',NEW.id,'request:'||NEW.id::text)
  ON CONFLICT(recipient_id,event_key) DO NOTHING;
 ELSIF NEW.status='accepted' AND
    (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
  INSERT INTO private.ff_notices(recipient_id,kind,contact_id,event_key)
  VALUES
   (NEW.sender_id,'match',NEW.id,'match:'||NEW.id::text),
   (NEW.recipient_id,'match',NEW.id,'match:'||NEW.id::text)
  ON CONFLICT(recipient_id,event_key) DO NOTHING;
 END IF;
 RETURN NEW;
END;
$body$;
REVOKE ALL ON FUNCTION private.ff_notice_contacts() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_notify_contact_change ON public.contact_requests;
CREATE TRIGGER ff_notify_contact_change AFTER INSERT OR UPDATE OF status
ON public.contact_requests FOR EACH ROW EXECUTE FUNCTION private.ff_notice_contacts();

CREATE OR REPLACE FUNCTION private.ff_notice_messages()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE v_peer uuid;
BEGIN
 SELECT CASE WHEN c.sender_id=NEW.sender_id THEN c.recipient_id ELSE c.sender_id END
 INTO v_peer FROM public.contact_requests c
 WHERE c.id=NEW.contact_id AND c.status='accepted'
   AND NEW.sender_id IN (c.sender_id,c.recipient_id);
 IF v_peer IS NOT NULL AND private.is_active_adult(v_peer)
    AND private.not_blocked(v_peer,NEW.sender_id) THEN
   INSERT INTO private.ff_notices(recipient_id,kind,contact_id,event_key)
   VALUES(v_peer,'message',NEW.contact_id,'message:'||NEW.id::text)
   ON CONFLICT(recipient_id,event_key) DO NOTHING;
 END IF;
 RETURN NEW;
END;
$body$;
REVOKE ALL ON FUNCTION private.ff_notice_messages() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_notify_new_message ON public.messages;
CREATE TRIGGER ff_notify_new_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION private.ff_notice_messages();

CREATE OR REPLACE FUNCTION public.ff_notification_feed(p_limit integer DEFAULT 30)
RETURNS TABLE(id bigint,kind text,contact_id uuid,created_at timestamptz,read_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $body$
 SELECT n.id,n.kind,n.contact_id,n.created_at,n.read_at
 FROM private.ff_notices n
 WHERE n.recipient_id=(SELECT auth.uid())
 AND EXISTS(SELECT 1 FROM public.memberships m
  WHERE m.user_id=(SELECT auth.uid()) AND m.status<>'suspended')
 ORDER BY n.created_at DESC,n.id DESC
 LIMIT LEAST(GREATEST(COALESCE(p_limit,30),1),50);
$body$;
REVOKE ALL ON FUNCTION public.ff_notification_feed(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_notification_feed(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.ff_notification_mark_read(p_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE v_count integer;
BEGIN
 UPDATE private.ff_notices SET read_at=COALESCE(read_at,now())
 WHERE id=p_id AND recipient_id=(SELECT auth.uid());
 GET DIAGNOSTICS v_count=ROW_COUNT;
 RETURN v_count=1;
END;
$body$;
REVOKE ALL ON FUNCTION public.ff_notification_mark_read(bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_notification_mark_read(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.ff_push_settings()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $body$
 SELECT jsonb_build_object(
   'enabled',COALESCE(p.push_enabled,false),
   'matches',COALESCE(p.match_alerts,true),
   'requests',COALESCE(p.request_alerts,true),
   'messages',COALESCE(p.message_alerts,true),
   'devices',(SELECT count(*) FROM private.ff_push_devices d WHERE d.user_id=(SELECT auth.uid()))
 ) FROM (SELECT auth.uid() AS uid) viewer
 LEFT JOIN private.ff_push_preferences p ON p.user_id=viewer.uid
 WHERE viewer.uid IS NOT NULL;
$body$;
REVOKE ALL ON FUNCTION public.ff_push_settings() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_push_settings() TO authenticated;

CREATE OR REPLACE FUNCTION public.ff_push_configure(
 p_enabled boolean,p_matches boolean DEFAULT true,
 p_requests boolean DEFAULT true,p_messages boolean DEFAULT true
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE v_uid uuid := (SELECT auth.uid());
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Bitte anmelden' USING ERRCODE='28000'; END IF;
 IF p_enabled AND NOT private.is_active_adult(v_uid) THEN
  RAISE EXCEPTION 'Freigegebenes Konto erforderlich' USING ERRCODE='42501';
 END IF;
 INSERT INTO private.ff_push_preferences(user_id,push_enabled,match_alerts,request_alerts,message_alerts,updated_at)
 VALUES(v_uid,COALESCE(p_enabled,false),COALESCE(p_matches,true),COALESCE(p_requests,true),COALESCE(p_messages,true),now())
 ON CONFLICT(user_id) DO UPDATE SET
  push_enabled=EXCLUDED.push_enabled,match_alerts=EXCLUDED.match_alerts,
  request_alerts=EXCLUDED.request_alerts,message_alerts=EXCLUDED.message_alerts,
  updated_at=now();
 IF p_enabled IS NOT TRUE THEN
  DELETE FROM private.ff_push_devices WHERE user_id=v_uid;
 END IF;
 RETURN COALESCE(p_enabled,false);
END;
$body$;
REVOKE ALL ON FUNCTION public.ff_push_configure(boolean,boolean,boolean,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_push_configure(boolean,boolean,boolean,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.ff_push_register(p_expo_token text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE v_uid uuid := (SELECT auth.uid());
BEGIN
 IF v_uid IS NULL OR NOT private.is_active_adult(v_uid)
   OR NOT EXISTS(SELECT 1 FROM private.ff_push_preferences p
                 WHERE p.user_id=v_uid AND p.push_enabled) THEN
  RAISE EXCEPTION 'Push-Einwilligung fehlt' USING ERRCODE='42501';
 END IF;
 IF p_expo_token IS NULL OR char_length(p_expo_token)>256 OR
   (p_expo_token NOT LIKE 'ExpoPushToken[%'
    AND p_expo_token NOT LIKE 'ExponentPushToken[%') THEN
   RAISE EXCEPTION 'Ungültiges Geräte-Token' USING ERRCODE='22023';
 END IF;
 INSERT INTO private.ff_push_devices(expo_token,user_id)
 VALUES(p_expo_token,v_uid)
 ON CONFLICT(expo_token) DO UPDATE SET user_id=v_uid,updated_at=now();
 -- Limit retained tokens per account; oldest removed automatically.
 DELETE FROM private.ff_push_devices d
 WHERE d.user_id=v_uid AND d.expo_token NOT IN(
   SELECT dd.expo_token FROM private.ff_push_devices dd
   WHERE dd.user_id=v_uid ORDER BY dd.updated_at DESC LIMIT 3
 );
 RETURN true;
END;
$body$;
REVOKE ALL ON FUNCTION public.ff_push_register(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_push_register(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.ff_push_unregister(p_expo_token text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE v_count integer;
BEGIN
 DELETE FROM private.ff_push_devices WHERE user_id=(SELECT auth.uid())
 AND expo_token=p_expo_token;
 GET DIAGNOSTICS v_count=ROW_COUNT;
 RETURN v_count>0;
END;
$body$;
REVOKE ALL ON FUNCTION public.ff_push_unregister(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_push_unregister(text) TO authenticated;
