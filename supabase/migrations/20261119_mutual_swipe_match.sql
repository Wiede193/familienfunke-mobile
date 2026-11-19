-- Familienfunke: Gegenseitiges Interesse für freiwillige Nähe-Entdeckung.
-- Unsichtbare Likes im privaten Schema; Match erst nach Zustimmung BEIDER Profile.
-- Bestehende Kontaktanfragen/Chats bleiben unverändert.
BEGIN;
CREATE TABLE IF NOT EXISTS private.ff_swipe_likes (
 actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ff_swipe_likes_pk PRIMARY KEY(actor_id,target_id),
 CONSTRAINT ff_swipe_no_self CHECK(actor_id<>target_id)
);
ALTER TABLE private.ff_swipe_likes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.ff_swipe_likes FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS ff_swipe_likes_target_idx ON private.ff_swipe_likes(target_id);

-- Die RPC meldet AUSSCHLIESSLICH den eigenen Handlungsstatus; niemals,
-- wer mich gelikt hat. Einseitige Likes erzeugen keine Kontaktanfrage.
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
   IF v_contact.recipient_id=v_me THEN
      UPDATE public.contact_requests SET status='accepted',responded_at=now()
        WHERE id=v_contact.id AND status='pending'
        RETURNING id INTO v_contact_id;
      RETURN jsonb_build_object('state','matched','contact_id',v_contact_id);
   END IF;
   RETURN jsonb_build_object('state','needs_confirmation','contact_id',v_contact.id);
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

-- Ein unsichtbar gewordenes oder blockiertes Profil kann nicht durch
-- alte Likes später erneut ein Match auslösen.
CREATE OR REPLACE FUNCTION private.ff_remove_hidden_likes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
BEGIN
 IF NEW.is_discoverable IS NOT TRUE OR NEW.moderation_status<>'approved' THEN
  DELETE FROM private.ff_swipe_likes l
   WHERE l.actor_id=NEW.user_id OR l.target_id=NEW.user_id;
 END IF;
 RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION private.ff_remove_hidden_likes() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_hide_likes_on_profile_change ON public.profiles;
CREATE TRIGGER ff_hide_likes_on_profile_change
 AFTER UPDATE OF is_discoverable,moderation_status ON public.profiles
 FOR EACH ROW
 WHEN (OLD.is_discoverable IS DISTINCT FROM NEW.is_discoverable
    OR OLD.moderation_status IS DISTINCT FROM NEW.moderation_status)
 EXECUTE FUNCTION private.ff_remove_hidden_likes();

CREATE OR REPLACE FUNCTION private.ff_remove_blocked_likes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
BEGIN
 DELETE FROM private.ff_swipe_likes l
 WHERE (l.actor_id=NEW.blocker_id AND l.target_id=NEW.blocked_id)
    OR (l.actor_id=NEW.blocked_id AND l.target_id=NEW.blocker_id);
 RETURN NEW;
END
$body$;
REVOKE ALL ON FUNCTION private.ff_remove_blocked_likes() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_hide_likes_on_block ON public.blocks;
CREATE TRIGGER ff_hide_likes_on_block
 AFTER INSERT ON public.blocks FOR EACH ROW
 EXECUTE FUNCTION private.ff_remove_blocked_likes();

COMMIT;
