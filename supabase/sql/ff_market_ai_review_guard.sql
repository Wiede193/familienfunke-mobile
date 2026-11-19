-- Familienfunke: Serverpflicht und manipulationssichere automatische Basarprüfung.
-- Neue Anzeigen bleiben bis zu einer expliziten serverseitigen Entscheidung pending.
-- Kennzeichnet riskante Fälle dauerhaft für die menschliche Prüfung.
ALTER TABLE public.ff_market_listings
  ADD COLUMN IF NOT EXISTS review_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_reason text;

COMMENT ON COLUMN public.ff_market_listings.review_hold IS
  'Nur Betreiber-/Serverprüfung darf true setzen. Blockiert automatische erneute Freigabe nach Risikoerkennung.';

-- RLS erlaubt dem Verkäufer weiterhin genau ein Artikelfoto anzuhängen.
-- Andere UPDATEs (inkl. Titel, Beschreibung, Preis, Kategorie und Status) sind
-- auch während pending nicht zulässig. Die Funktion nutzt keine erweiterten Rechte.
CREATE OR REPLACE FUNCTION private.ff_market_guard_client_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $fn$
BEGIN
  -- Der serverseitige Prüfprozess aktualisiert Status und Prüfvermerk
  -- ausschließlich über eine privilegierte, authentifizierte Edge Function.
  -- Bestehende Adminaktionen und SECURITY DEFINER-Verkaufsabschluss erhalten.
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF OLD.moderation_status <> 'pending'
     OR OLD.photo_path IS NOT NULL
     OR NEW.photo_path IS DISTINCT FROM
          (OLD.seller_id::text || '/' || OLD.id::text || '.jpg')
     OR (to_jsonb(NEW) - 'photo_path') IS DISTINCT FROM
          (to_jsonb(OLD) - 'photo_path')
  THEN
    RAISE EXCEPTION 'Nur das einmalige Anfügen eines Fotos ist erlaubt.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS ff_market_guard_client_update
  ON public.ff_market_listings;

CREATE TRIGGER ff_market_guard_client_update
  BEFORE UPDATE ON public.ff_market_listings
  FOR EACH ROW
  EXECUTE FUNCTION private.ff_market_guard_client_update();
