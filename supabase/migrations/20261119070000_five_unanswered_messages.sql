-- Familienfunke · Chat-Schutz (Stand 19.11.2026)
-- Höchstens fünf Nachrichten in Folge, bis eine Antwort des anderen Kontakts kommt.
-- Diese Grenze wird in der Datenbank selbst geprüft, also auch für den Edge-Function-Aufruf.
-- Die Funktion befindet sich im NICHT für REST freigegebenen Schema private.

BEGIN;

CREATE INDEX IF NOT EXISTS ff_messages_contact_recent_idx
  ON public.messages (contact_id, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION private.ff_guard_five_unanswered_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $body$
DECLARE
  participants record;
  last_five_by_sender integer;
  latest_at timestamptz;
BEGIN
  -- Sperre für genau diese Konversation: parallele Inserts werden serialisiert.
  -- SECURITY DEFINER ist hier erforderlich, weil die send-message-Service-Rolle
  -- keine UPDATE-/FOR-UPDATE-Rechte auf contact_requests erhält.
  SELECT c.sender_id, c.recipient_id, c.status
    INTO participants
    FROM public.contact_requests AS c
   WHERE c.id = NEW.contact_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FF_CONTACT_NOT_FOUND'
      USING ERRCODE = '23503';
  END IF;

  IF participants.status <> 'accepted'
     OR NEW.sender_id NOT IN (participants.sender_id, participants.recipient_id) THEN
    RAISE EXCEPTION 'FF_CONTACT_NOT_ACCEPTED'
      USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO last_five_by_sender
    FROM (
      SELECT m.sender_id
        FROM public.messages AS m
       WHERE m.contact_id = NEW.contact_id
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 5
    ) AS recent
   WHERE recent.sender_id = NEW.sender_id;

  IF last_five_by_sender >= 5 THEN
    RAISE EXCEPTION 'FF_MSG_LIMIT_5'
      USING ERRCODE = 'P0001',
            DETAIL = 'Fuenf Nachrichten hintereinander ohne Antwort.',
            HINT = 'Bitte auf die Antwort des anderen Kontakts warten.';
  END IF;

  -- Gegen clientseitig vorgegebene oder wegen paralleler Transaktionen
  -- veraltete Timestamps: jede neu akzeptierte Nachricht wird nach dem
  -- zuletzt gespeicherten Eintrag einsortiert, unabhängig von Clientwerten.
  SELECT MAX(m.created_at) INTO latest_at
    FROM public.messages AS m
   WHERE m.contact_id = NEW.contact_id;
  NEW.created_at := GREATEST(
    clock_timestamp(),
    COALESCE(latest_at + interval '1 microsecond', clock_timestamp())
  );
  RETURN NEW;
END;
$body$;

-- Die Funktion soll ausschließlich als Trigger aufgerufen werden.
REVOKE ALL ON FUNCTION private.ff_guard_five_unanswered_messages() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.ff_guard_five_unanswered_messages() FROM anon, authenticated;
DROP TRIGGER IF EXISTS ff_limit_unanswered_messages ON public.messages;
CREATE TRIGGER ff_limit_unanswered_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION private.ff_guard_five_unanswered_messages();

COMMIT;

-- Akzeptanzkriterien: 5 gleichgerichtete Nachrichten erlaubt, 6. blockiert;
-- sobald B antwortet, darf A wieder bis zu fünf senden.
-- Unbefugte Sender / nicht akzeptierte Kontaktanfragen werden abgelehnt.
-- DELETE/UPDATE auf public.messages bleiben für Client-Rollen gesperrt.
-- Vor produktiven Tests: bestehende Supabase-Funktion send-message muss
-- FF_MSG_LIMIT_5 als 429 weitergeben, damit die App korrekt informieren kann.
