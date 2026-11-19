-- Families Sparkle/Familienfunke: optional device tokens for future real push.
-- This does NOT send any push notifications. Native SDK + EAS credentials and
-- user device permission must be configured in a development build first.
BEGIN;
CREATE TABLE IF NOT EXISTS private.ff_push_devices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 expo_token text NOT NULL UNIQUE CHECK (length(expo_token)<=250),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ff_push_devices_user ON private.ff_push_devices(user_id);
ALTER TABLE private.ff_push_devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.ff_push_devices FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ff_push_is_registered()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=''
AS $body$
 SELECT EXISTS(SELECT 1 FROM private.ff_push_devices p
  WHERE p.user_id=(SELECT auth.uid()))
$body$;
REVOKE ALL ON FUNCTION public.ff_push_is_registered() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_push_is_registered() TO authenticated;

-- Only after confirmed native permission. Opt-out always possible
-- and deletes EVERY registered device token for this account immediately.
CREATE OR REPLACE FUNCTION public.ff_push_register(
 p_token text DEFAULT NULL, p_enabled boolean DEFAULT false
) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $body$
DECLARE me uuid := (SELECT auth.uid());
BEGIN
 IF me IS NULL THEN RAISE EXCEPTION 'Please sign in'
   USING ERRCODE='28000'; END IF;
 IF p_enabled IS NOT TRUE THEN
    DELETE FROM private.ff_push_devices WHERE user_id=me;
    RETURN false;
 END IF;
 IF NOT private.is_active_adult(me) THEN
    RAISE EXCEPTION 'Profile not eligible for push registration'
      USING ERRCODE='42501';
 END IF;
 IF p_token IS NULL OR p_token !~ '^(Expo|Exponent)PushToken[[][a-zA-Z0-9_-]{15,220}[]]
    RAISE EXCEPTION 'Invalid Expo push token' USING ERRCODE='22023';
 END IF;
 -- A physical phone can be reassigned to a new signed-in account.
 -- Existing token is then moved, not shared across account owners.
 INSERT INTO private.ff_push_devices(user_id,expo_token)
 VALUES(me,p_token)
 ON CONFLICT (expo_token) DO UPDATE SET
 user_id=excluded.user_id,updated_at=now();
 RETURN true;
END
$body$;
REVOKE ALL ON FUNCTION public.ff_push_register(text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_push_register(text,boolean) TO authenticated;
COMMIT;
 THEN
    RAISE EXCEPTION 'Invalid Expo push token' USING ERRCODE='22023';
 END IF;
 -- A physical phone can be reassigned to a new signed-in account.
 -- Existing token is then moved, not shared across account owners.
 INSERT INTO private.ff_push_devices(user_id,expo_token)
 VALUES(me,p_token)
 ON CONFLICT (expo_token) DO UPDATE SET
 user_id=excluded.user_id,updated_at=now();
 RETURN true;
END
$body$;
REVOKE ALL ON FUNCTION public.ff_push_register(text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_push_register(text,boolean) TO authenticated;
COMMIT;
