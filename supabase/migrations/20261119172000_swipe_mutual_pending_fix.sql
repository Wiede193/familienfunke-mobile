-- Fix matching into a pre-existing pending contact request while preserving
-- normal unilateral accept/decline/cancel permissions and RLS.
CREATE OR REPLACE FUNCTION private.contact_status_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $function$
BEGIN
  IF old.status <> 'pending'
    OR new.sender_id IS DISTINCT FROM old.sender_id
    OR new.recipient_id IS DISTINCT FROM old.recipient_id THEN
    RAISE EXCEPTION 'Diese Anfrage kann nicht erneut geändert werden.';
  END IF;
  IF (SELECT auth.uid())=old.recipient_id AND new.status IN ('accepted','declined') THEN
    new.responded_at:=now();
  ELSIF (SELECT auth.uid())=old.sender_id AND new.status='cancelled' THEN
    new.responded_at:=now();
  ELSIF (SELECT auth.uid())=old.sender_id AND new.status='accepted'
    AND EXISTS(SELECT 1 FROM private.ff_swipe_likes l
               WHERE l.actor_id=old.sender_id AND l.target_id=old.recipient_id)
    AND EXISTS(SELECT 1 FROM private.ff_swipe_likes l
               WHERE l.actor_id=old.recipient_id AND l.target_id=old.sender_id)
    AND private.is_active_adult(old.sender_id)
    AND private.is_active_adult(old.recipient_id)
    AND private.not_blocked(old.sender_id,old.recipient_id) THEN
    new.responded_at:=now();
  ELSE
    RAISE EXCEPTION 'Nicht erlaubte Statusänderung.';
  END IF;
  RETURN new;
END
$function$;
REVOKE ALL ON FUNCTION private.contact_status_guard() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ff_swipe_interest(p_target uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $body$
DECLARE
 v_me uuid := (SELECT auth.uid());
 v_contact record;
 v_reciprocal boolean;
 v_contact_id uuid;
 v_approved boolean;
BEGIN
 IF v_me IS NULL THEN
  RAISE EXCEPTION 'Bitte anmelden' USING ERRCODE='28000';
 END IF;
 IF p_target IS NULL OR p_target=v_me THEN
  RAISE EXCEPTION 'Ungültiges Familienprofil' USING ERRCODE='22023';
 END IF;
 -- Derselbe Sperrschlüssel in beiden Wischrichtungen vermeidet doppelte Matches.
 PERFORM pg_advisory_xact_lock(
   hashtextextended(LEAST(v_me::text,p_target::text)||':'||
                    GREATEST(v_me::text,p_target::text),0)
 );
 IF NOT private.is_active_adult(v_me)
    OR NOT private.is_active_adult(p_target)
    OR NOT private.not_blocked(v_me,p_target)
    OR NOT EXISTS(SELECT 1 FROM public.profiles p
                   WHERE p.user_id=v_me AND p.is_discoverable)
    OR NOT EXISTS(SELECT 1 FROM public.profiles p
                   WHERE p.user_id=p_target AND p.is_discoverable)
    OR NOT EXISTS(
       SELECT 1 FROM public.ff_nearby_families(100) n
       WHERE n.user_id=p_target
    ) THEN
  RAISE EXCEPTION 'Dieses Match ist nicht verfügbar' USING ERRCODE='42501';
 END IF;
 SELECT id,status,sender_id,recipient_id
 INTO v_contact FROM public.contact_requests c
 WHERE (c.sender_id=v_me AND c.recipient_id=p_target)
    OR (c.sender_id=p_target AND c.recipient_id=v_me)
 FOR UPDATE;
 IF FOUND THEN
  IF v_contact.status='accepted' THEN
    RETURN jsonb_build_object('state','matched','contact_id',v_contact.id);
  ELSIF v_contact.status IN ('declined','cancelled') THEN
    RETURN jsonb_build_object('state','unavailable');
  END IF;
 END IF;

 INSERT INTO private.ff_swipe_likes(actor_id,target_id)
 VALUES(v_me,p_target) ON CONFLICT DO NOTHING;

 SELECT EXISTS(SELECT 1 FROM private.ff_swipe_likes l
   WHERE l.actor_id=p_target AND l.target_id=v_me)
 INTO v_reciprocal;
 IF NOT v_reciprocal THEN
  RETURN jsonb_build_object('state','liked');
 END IF;

 IF v_contact.id IS NOT NULL THEN
   -- Noch offene klassische Anfrage: nur der Empfänger darf sie bestätigen.
   -- Die bisherige Kontakt-Statussperre bleibt unangetastet.
   -- Either member may complete a mutually requested match.
   -- private.contact_status_guard only permits the sender-side transition
   -- when BOTH private likes exist; the receiver may already accept normally.
   UPDATE public.contact_requests SET status='accepted',responded_at=now()
     WHERE id=v_contact.id AND status='pending'
     RETURNING id INTO v_contact_id;
   IF v_contact_id IS NULL THEN
     RAISE EXCEPTION 'Kontaktanfrage nicht mehr offen' USING ERRCODE='23514';
   END IF;
   RETURN jsonb_build_object('state','matched','contact_id',v_contact_id);
 END IF;

 -- Keine öffentliche Rolle darf accepted direkt einfügen. Nur diese
 -- streng geprüfte SECURITY-DEFINER-RPC stellt den Kontakt her.
 INSERT INTO public.contact_requests(sender_id,recipient_id,status,responded_at)
 VALUES(v_me,p_target,'accepted',now())
 RETURNING id INTO v_contact_id;
 RETURN jsonb_build_object('state','matched','contact_id',v_contact_id);
END
$body$;
REVOKE ALL ON FUNCTION public.ff_swipe_interest(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ff_swipe_interest(uuid) TO authenticated;

-- Opt-out is erasure of consent: discard all existing one-sided likes.
CREATE OR REPLACE FUNCTION private.ff_delete_swipes_on_nearby_optout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
BEGIN
  DELETE FROM private.ff_swipe_likes l
    WHERE l.actor_id=OLD.user_id OR l.target_id=OLD.user_id;
  RETURN OLD;
END
$body$;
REVOKE ALL ON FUNCTION private.ff_delete_swipes_on_nearby_optout() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_delete_swipes_on_nearby_optout ON private.ff_nearby_locations;
CREATE TRIGGER ff_delete_swipes_on_nearby_optout
  AFTER DELETE ON private.ff_nearby_locations FOR EACH ROW
  EXECUTE FUNCTION private.ff_delete_swipes_on_nearby_optout();
