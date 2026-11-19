# Familienfunke – Datenschutz- und Sicherheitsprüfung

**Prüfstand: 19. November 2026** · Private Beta · GitHub-Entwicklungsbranch `design/profil-momente-benachrichtigungen`

## Bestätigte technische Eigenschaften

- Supabase-Projekt „Family Sparkle“ nutzt Region **eu-central-1 (Frankfurt)**, Status ACTIVE_HEALTHY.
- `storage.buckets`: `familienfunke-photos` ist **privat**, mit 5-MB-Limit und MIME-Typen JPEG, PNG und WebP. Der Storage-/Fotometadatenzugriff ist über RLS geregelt.
- `public.profiles`: eigene Daten oder freigegebene, sichtbare Familienprofile gemäß `private.can_see_profile`; Kontaktanfragen nur Teilnehmer.
- `public.messages`: vorhandene SELECT-RLS nach Kontaktzugehörigkeit, Client-Rolle hat **kein** direktes INSERT/UPDATE/DELETE. Nachrichtenversand weiter über `send-message` inkl. Prüfung des authentifizierten Absenders, bestätigter Kontakte und Moderation. Fünf-Nachrichten-Regel zusätzlich DB-seitig aktiv.
- Fotos: `private.can_see_photo` prüft Freigabe, verifizierte Familien, bestätigten Kontakt und Blockierungen.
- App-Code: Account-bezogener Cache wird mit User-ID gegatet; ausstehende Abfragen anderer Konten werden verworfen. Foto-Links werden nur für eigene oder freigegebene Bilder akzeptierter, nicht blockierter Kontakte neu erzeugt. Neue signierte Links gelten **10 statt 30 Minuten**.
- `profile_photos` und `events`: nicht freigegebene Entwürfe dürfen Eigentümer bearbeiten, bereits freigegebene Inhalte nicht mehr unbemerkt umschreiben.
- Kontaktanfragen: nur Empfänger kann ausstehende Anfragen bestätigen oder ablehnen; Absender kann ausschließlich offene eigene Anfragen zurückziehen.
- Veranstaltungsteilnahme: nur Organisator darf Anfragen bestätigen/ablehnen, die anfragende Person kann nur zurückziehen.

## Aktivierte RLS-Korrektur

In Supabase angewendet: Migration `20261119103653_familienfunke_rls_privacy_hardening_20261119`.

GitHub-Quelle: `supabase/migrations/20261119_rls_privacy_hardening.sql`.

**Ursache:** Zusätzliche `ff_block_suspended_*`-Policies waren als `PERMISSIVE` angelegt. PostgreSQL verknüpft permissive Policies per **OR** – Sperrbedingungen können dadurch Berechtigungen ungewollt erweitern. Die Policies wurden als `AS RESTRICTIVE` mit `WITH CHECK` neu angelegt und damit korrekt mit Eigentümer-/Rollenbedingungen verknüpft.

Nach Migration über `pg_policies` verifiziert: **13 neue/überarbeitete Regeln sind RESTRICTIVE**; die ursprünglichen Regeln für legitime Teilnehmer sind PERMISSIVE geblieben. Rollen-Simulation mit `SET LOCAL ROLE authenticated` konnte RLS-geschützte Profile, Kontakte, Nachrichten, Fotos und Veranstaltungen weiterhin lesen, ohne Änderungen an Daten vorzunehmen.

## Wichtiger Transparenz-Befund: externe Moderation

**Nicht behaupten:** „Alle Familienfunke-Daten werden ausschließlich in Deutschland verarbeitet.“

Die geprüften Supabase-Edge-Funktionen `moderate-content` (V4) und `moderate-photo` (V1) rufen derzeit die **OpenAI Moderation API** (`https://api.openai.com/v1/moderations`) auf. Hierbei werden **Textinhalte und Bildinhalte an einen externen Dienst** übermittelt. Der Datenbankstandort Frankfurt allein macht die Verarbeitung nicht vollständig deutsch/europäisch.

In der Expo-App:
- Konto-/Privatsphärebereich erläutert die externe automatische Text-/Bildprüfung.
- Vor dem Fotoupload erscheint eine klare Info mit `Abbrechen` oder `Foto hochladen`.
- Beta-Hinweis: **Keine Kinderfotos hochladen**.
- Keine Behauptung, dass eine einfache Bestätigung bereits alle DSGVO-Pflichten erfüllt.

## Offene Aufgaben vor öffentlicher Freigabe

1. **Datenschutzkonzept/Drittanbieter-Verträge**: Verantwortliche, Rechtsgrundlage, Transparenz, DPA/AVV, gegebenenfalls Standardvertragsklauseln und internationale Datenübertragung, Minderjährigenschutz, Aufbewahrung, Löschung, Auskunft und Widerruf formal prüfen.
2. **Betroffenenrechte** technisch umsetzen: Accountlöschung, Datenexport, Löschfristen, Löschung von Fotos/Chats/Reports inkl. Moderation und Backups nach transparentem Löschkonzept.
3. **Moderations-/Admin-Berechtigungen**: Supabase Security Advisor meldet 10 aus `authenticated` aufrufbare `SECURITY DEFINER`-Admin-RPCs. In einer Stichprobe wurden `auth.uid()`- und `private.admin_staff`-Rollenprüfungen bestätigt; sie bleiben dennoch ein Prüfpunkt und dürfen nicht blind abgeschaltet werden, da Moderation/Admin-Oberflächen sie nutzen können. [Supabase: Security Advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
4. **Auth-Sicherheit**: Supabase Advisor meldet deaktivierten Schutz gegen geleakte Passwörter. Vor Release Auth-Konfiguration prüfen und die entsprechenden Schutzoptionen aktivieren. [Supabase Passwortsicherheit](https://supabase.com/docs/guides/auth/password-security).
5. **Signierte Foto-Links**: Neue URLs laufen nach 10 Minuten ab; **bereits ausgegebene Links bleiben bis Ablauf zugreifbar** und werden durch Blockieren nicht sofort widerrufen. Keine absolute Foto-Rückrufgarantie.
6. **Technischer E2E-Test**: zwei Nutzerkonten, Eigentümer/Empfänger, Kontaktannahme, Statuswechsel, Sperre, Fotos, Terminbeiträge, Abmeldung/Neuanmeldung, zeitgleich laufende API-Anfragen. Bis dahin **keine öffentliche Sicherheitsfreigabe**.
7. **EXIF, Gerätedaten und Backup** im vollständigen Datenschutz-Audit kontrollieren, bevor Minderjährige in Bildern überhaupt zugelassen werden.
8. **Aktuelle Datenflüsse und Hostingangaben** bei jeder Anbieter-/Moderationsänderung erneut prüfen; präzise „Made in Germany“-Aussagen dürfen nicht mit exzessiven Datenschutzversprechen gleichgesetzt werden.

## Nicht durchgeführt

- Kein Gerätetest in Expo Go; Nutzer möchte Entwicklungsarbeiten ohne Zwischen-Tests fortsetzen.
- Keine automatische Veröffentlichung im App Store und kein Merge in `main`.
- Keine allgemeine DS-GVO-Zertifizierung, rechtliche Abnahme oder Zusage vollständiger Compliance.
- Keine personenbezogenen Daten in den Sicherheitsbericht übernommen.
