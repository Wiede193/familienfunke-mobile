-- Familienfunke | Zugriffssperre fuer suspendierte Konten
-- Stand: 19. November 2026
-- Die "aktive Familie"-Pruefung wurde zuvor nur ueber Volljaehrigkeitsfreigabe
-- und Profilmoderation definiert. Ab jetzt zaehlt auch der Mitgliedschaftsstatus.
-- Die Funktion wird von bereits existierenden RLS-Regeln fuer Profile,
-- Familienfotos, Kontakte, Veranstaltungen und Storage-Dateien verwendet.
-- Private Schemas sind nicht im Data-API-Schema freigegeben.
BEGIN;

CREATE OR REPLACE FUNCTION private.is_active_adult(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT _uid IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.verifications v
       WHERE v.user_id = _uid AND v.status = 'verified'
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.user_id = _uid AND p.moderation_status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.memberships m
       WHERE m.user_id = _uid AND m.status <> 'suspended'
    );
$function$;

-- Auch Nachrichten aus frueher bestaetigten Kontakten sollen fuer suspendierte
-- Konten nicht abrufbar sein. Eine restriktive SELECT-Policy ergaenzt die
-- bestehende participants_read-Policy, statt sie zu erweitern.
DROP POLICY IF EXISTS ff_hide_messages_from_suspended_accounts ON public.messages;
CREATE POLICY ff_hide_messages_from_suspended_accounts
  ON public.messages AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
       WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended'
    )
  );

-- Die eigenen Konto- und Foto-Metadaten bleiben fuer eventuelle
-- Loesch-/Auskunftsanfragen weiter zugaenglich. Fremde Inhalte nicht.
COMMIT;
