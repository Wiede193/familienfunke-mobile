-- Datenschutz-Folgeänderung für freiwillige Umkreissuche.
-- Das Ausschalten der allgemeinen Profilsichtbarkeit löscht automatisch
-- den optionalen PLZ-Gebietsmittelpunkt. Neue Sichtbarkeit erfordert
-- eine erneute bewusste Aktivierung der Nähe-Suche.
CREATE OR REPLACE FUNCTION private.ff_clear_nearby_on_profile_hide()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=''
AS $body$
BEGIN
 IF NEW.is_discoverable IS NOT TRUE THEN
  DELETE FROM private.ff_nearby_locations
  WHERE user_id=NEW.user_id;
 END IF;
 RETURN NEW;
END;
$body$;

REVOKE ALL ON FUNCTION private.ff_clear_nearby_on_profile_hide() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ff_clear_nearby_when_hidden ON public.profiles;
CREATE TRIGGER ff_clear_nearby_when_hidden
 AFTER UPDATE OF is_discoverable ON public.profiles
 FOR EACH ROW
 WHEN (OLD.is_discoverable IS DISTINCT FROM NEW.is_discoverable AND NEW.is_discoverable IS NOT TRUE)
 EXECUTE FUNCTION private.ff_clear_nearby_on_profile_hide();
