-- Familienfunke | Privacy hardening | 19. November 2026
-- Zusätzliche Kontosperren müssen AS RESTRICTIVE sein: permissive RLS policies
-- werden bei PostgreSQL sonst per OR miteinander verknüpft.
-- Sicherung der berechtigten Familien-Kontakte, Terminanfragen und Foto-Uploads.
-- Keine bestehenden Inhalte werden verändert, keine neuen Datensätze erzeugt.
BEGIN;

DROP POLICY IF EXISTS ff_block_suspended_contacts ON public.contact_requests;
CREATE POLICY ff_block_suspended_contacts
  ON public.contact_requests AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  );

DROP POLICY IF EXISTS ff_block_suspended_contact_updates ON public.contact_requests;
CREATE POLICY ff_block_suspended_contact_updates
  ON public.contact_requests AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  );

-- Der Absender darf eine offene Anfrage zurückziehen, nur der Empfänger
-- darf sie annehmen oder ablehnen. Die RLS-Policies greifen auch bei
-- direkten REST-Aufrufen, nicht nur in der Expo-Oberfläche.
DROP POLICY IF EXISTS ff_contact_request_status_permissions ON public.contact_requests;
CREATE POLICY ff_contact_request_status_permissions
  ON public.contact_requests AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    status = 'pending' AND
    ((sender_id = (SELECT auth.uid())) OR (recipient_id = (SELECT auth.uid())))
  )
  WITH CHECK (
    (sender_id = (SELECT auth.uid()) AND status = 'cancelled')
    OR
    (recipient_id = (SELECT auth.uid()) AND status IN ('accepted','declined'))
  );

DROP POLICY IF EXISTS ff_block_suspended_event_requests_insert ON public.event_requests;
CREATE POLICY ff_block_suspended_event_requests_insert
  ON public.event_requests AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  );

DROP POLICY IF EXISTS ff_block_suspended_event_requests_update ON public.event_requests;
CREATE POLICY ff_block_suspended_event_requests_update
  ON public.event_requests AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  );

-- Einen Teilnahmeantrag annehmen/ablehnen darf nur der Veranstalter.
-- Der Gast darf nur seine *eigene* offene Anfrage zurückziehen.
DROP POLICY IF EXISTS ff_event_request_status_permissions ON public.event_requests;
CREATE POLICY ff_event_request_status_permissions
  ON public.event_requests AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    status = 'requested' AND (
      requester_id = (SELECT auth.uid()) OR
      EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id
               AND e.organizer_id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    (requester_id = (SELECT auth.uid()) AND status = 'cancelled') OR
    (status IN ('approved','declined') AND EXISTS (
      SELECT 1 FROM public.events e WHERE e.id = event_id
        AND e.organizer_id = (SELECT auth.uid())
    ))
  );

DROP POLICY IF EXISTS ff_block_suspended_events_insert ON public.events;
CREATE POLICY ff_block_suspended_events_insert
  ON public.events AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  );

DROP POLICY IF EXISTS ff_block_suspended_events_update ON public.events;
CREATE POLICY ff_block_suspended_events_update
  ON public.events AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  );

-- Bereits freigegebene Veranstaltungstexte dürfen nicht ohne erneute
-- Moderation geändert werden. Für die Beta sind nur Entwürfe bearbeitbar.
DROP POLICY IF EXISTS ff_pending_event_edits_only ON public.events;
CREATE POLICY ff_pending_event_edits_only
  ON public.events AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (organizer_id = (SELECT auth.uid()) AND moderation_status = 'pending')
  WITH CHECK (organizer_id = (SELECT auth.uid()) AND moderation_status = 'pending');

DROP POLICY IF EXISTS ff_block_suspended_photo_insert ON public.profile_photos;
CREATE POLICY ff_block_suspended_photo_insert
  ON public.profile_photos AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.memberships m
            WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  );

-- Nach Freigabe keine nachträglichen ungeprüften Bildunterschriften.
DROP POLICY IF EXISTS ff_photo_caption_pending_only ON public.profile_photos;
CREATE POLICY ff_photo_caption_pending_only
  ON public.profile_photos AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND moderation_status = 'pending')
  WITH CHECK (owner_id = (SELECT auth.uid()) AND moderation_status = 'pending');

-- Wichtig: Nur der eigene User-Ordner darf durch die vorhandene
-- ff_upload_own_photos-Policy beschrieben werden.
DROP POLICY IF EXISTS ff_block_suspended_storage_upload ON storage.objects;
CREATE POLICY ff_block_suspended_storage_upload
  ON storage.objects AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id <> 'familienfunke-photos'
    OR EXISTS (SELECT 1 FROM public.memberships m
               WHERE m.user_id = (SELECT auth.uid()) AND m.status <> 'suspended')
  );

COMMIT;

-- RLS ist kein Ersatz für eine echte E2E-Prüfung mit zwei Testkonten:
-- Sender darf nicht selbst Kontakte annehmen, Gäste nicht selbst teilnehmen,
-- Nutzer nicht fremde Foto-Ordner beschreiben, Veröffentlichungen nicht still ändern.
