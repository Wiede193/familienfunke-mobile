-- Familienfunke · Chat-Schutz: höchstens fünf eigene Nachrichten hintereinander.
-- BETASTAND 2026-11-19 · Noch NICHT auf das Supabase-Projekt angewendet.
-- Vor Anwendung Schema/Trigger/Edge-Function im Zielprojekt prüfen.
--
-- Auf Ebene der public.messages-Tabelle erzwungen, nicht nur in der mobilen App.
-- Erlaubt bis zu 5 aufeinanderfolgende Nachrichten derselben sender_id pro contact_id.
-- Eine Antwort der anderen Familie setzt diese Zählung automatisch zurück.
--
-- WICHTIG: Dieser Trigger ersetzt KEINE Authentifizierung, keine RLS-Policies,
-- keine Moderation und keine Prüfung, ob die Kontaktanfrage angenommen wurde.
-- Die bestehende send-message Edge Function bleibt erhalten.
--
-- HINWEIS: Für die Sortierung wird created_at + id verwendet. Die bestehende
-- DB sollte die Erstellung von created_at/sender_id serverseitig kontrollieren,
-- damit Clients die Reihenfolge nicht durch manipulierte Zeitstempel umgehen.

BEGIN;

CREATE INDEX IF NOT EXISTS ff_messages_contact_recent_idx
  ON public.messages (contact_id, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION public.ff_guard_five_unanswered_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  previous_by_sender integer;
BEGIN
  -- Sperre nur die zugehörige Kontakt-Zeile und nicht alle Chats.
  -- Zwei nahezu gleichzeitig eingereichte Nachrichten desselben Chats
  -- werden hierdurch serialisiert; die zweite sieht anschließend
  -- die erste bereits gespeicherte Nachricht.
  PERFORM 1
    FROM public.contact_requests
   WHERE id = NEW.contact_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FF_CONTACT_NOT_FOUND'
      USING ERRCODE = '23503',
            HINT = 'Eine zugehörige Kontaktanfrage ist erforderlich.';
  END IF;

  SELECT COUNT(*) INTO previous_by_sender
    FROM (
      SELECT m.sender_id
        FROM public.messages AS m
       WHERE m.contact_id = NEW.contact_id
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT 5
    ) AS previous_messages
   WHERE previous_messages.sender_id = NEW.sender_id;

  IF previous_by_sender >= 5 THEN
    RAISE EXCEPTION 'FF_MSG_LIMIT_5'
      USING ERRCODE = 'P0001',
            DETAIL = 'Fünf Nachrichten ohne Antwort sind bereits gesendet.',
            HINT = 'Nach einer Antwort der anderen Familie kannst du wieder schreiben.';
  END IF;

  RETURN NEW;
END;
$function$;

-- Nicht als aufrufbare API veröffentlichen. Als Trigger bleibt die Funktion nutzbar.
REVOKE ALL ON FUNCTION public.ff_guard_five_unanswered_messages() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ff_guard_five_unanswered_messages() FROM anon, authenticated;

DROP TRIGGER IF EXISTS ff_limit_unanswered_messages ON public.messages;
CREATE TRIGGER ff_limit_unanswered_messages
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.ff_guard_five_unanswered_messages();

COMMIT;

-- Vor Produktivbetrieb:
-- 1. Im DB-Editor Struktur/Schema bestätigen (Kontakt-Tabelle, Nachrichten-Spalten).
-- 2. In einer staging/test DB mit zwei Familien testen.
-- 3. Bestehende Edge Function prüfen, dass Postgres-Fehler nicht verschluckt werden.
-- 4. Schreibrechte/RLS prüfen; kein direkter DELETE/UPDATE von Nachrichten zulassen,
--    durch den der Nachrichtenverlauf und damit die Zählung manipuliert werden könnte.
-- 5. Bei hohem Durchsatz Test auf parallele INSERTs für denselben contact_id.
-- 6. Nur nach Freigabe auf der echten Datenbank ausführen.
