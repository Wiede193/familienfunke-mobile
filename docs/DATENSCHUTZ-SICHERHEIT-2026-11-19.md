# Familienfunke – Datenschutz- und Sicherheitsprüfung (Beta)
**Stand: 19. November 2026** · Code-Branch `design/profil-momente-benachrichtigungen` · Supabase-Projekt `Family Sparkle`.

> Dies ist eine technische Bestandsaufnahme. **Keine** rechtsverbindliche DSGVO-Zertifizierung, kein Penetrationstest und keine App-Store-Freigabe.

## Tatsächliche Datenverarbeitung

1. **Backend-Region:** Das verbundene Supabase-Projekt meldet `eu-central-1` (Frankfurt). Das bestätigt **nicht**, dass jeder externe Verarbeitungsvorgang ausschließlich in Deutschland stattfindet.
2. **Fotos:** Privater Supabase-Storage-Bucket `familienfunke-photos`, nicht öffentlich; 5 MiB maximal pro Objekt, MIME-Beschränkung JPEG/PNG/WebP. Die mobile App liefert aus der Fotobibliothek neu kodierte JPEGs und deaktiviert EXIF bei der Auswahl. Zugriff auf freigegebene fremde Fotos serverseitig über RLS für bestätigte Kontakte.
3. **Vorübergehende Fotolinks:** `App.jsx` fordert 600 Sekunden gültige signierte URLs an. Solange ein Link gültig ist, kann ein Empfänger ihn grundsätzlich öffnen; Abmelden oder Blockieren widerruft den bereits ausgestellten Link nicht automatisch. Keine Fotos auf öffentlich lesbaren Buckets speichern.
4. **Nachrichten:** `send-message` prüft die Anmeldung, bestätigte Kontakte, Blockierungen, Freigaben, Mitgliedschaft und Inhaltsmoderation serverseitig. Die 5-Nachrichten-Grenze greift zusätzlich in der Datenbank. **Keine Ende-zu-Ende-Verschlüsselung**: Der Betreiber und autorisierte Dienste können Nachrichten zur Moderation verarbeiten.
5. **Externe Inhaltsprüfung:** Die aktive Supabase-Edge-Funktion `moderate-content` sendet Texte nach lokalem Vorfilter an `https://api.openai.com/v1/moderations` (`omni-moderation-latest`). `moderate-photo` sendet hochgeladene Fotos und gegebenenfalls Bildunterschriften an denselben Dienst. Das ist eine **reale Übermittlung an OpenAI**, nicht nur ein technischer Zukunftsplan. Welcher Datenverarbeitungsstandort mit der aktuell eingesetzten API-Konfiguration vertraglich und technisch gilt, ist noch **nicht bestätigt**.
6. Die mobilen Ansichten enthalten nun ausdrückliche Hinweise zur externen Moderation, besonders vor Foto-Upload und am Chat-Eingabefeld. **Vor öffentlichem Start** müssen Rechtsgrundlage, Transparenz-/Einwilligungsabläufe (soweit erforderlich), Auftragsverarbeitung, Speicherfristen und eventuell regionale API-Endpunkte fachlich geprüft werden.

### Offizielle Dokumentation zur möglichen EU-Verarbeitung
- OpenAI: https://developers.openai.com/api/docs/guides/data-residency
- Laut aktueller API-Dokumentation wird `/v1/moderations` in der Region Europa unterstützt. **Das ist keine Bestätigung**, dass der vorhandene OpenAI-API-Schlüssel für regionale Datenverarbeitung eingerichtet ist; darum wurde die bestehende funktionierende Moderations-API **nicht ungeprüft umgestellt**.

## Direkt umgesetzte technische Verbesserungen

| Schutzbereich | Maßnahme | Status |
|---|---|---|
| Profil, Kontakte, Nachrichten, Fotos | Supabase RLS überprüft, private Storage-Berechtigungen erfasst | Konfiguration überprüft |
| Login / Kontowechsel | In `App.jsx` kontobezogene Datenhaltung, Guard gegen verzögerte Antworten früherer Sitzungen | GitHub, iPhone-Test noch offen |
| Privater Fotozugriff | Kürzere signierte URLs, Vorfilter nur eigene bzw. freigegebene Bilder bestätigter Kontakte | GitHub, iPhone-Test noch offen |
| Blockierte Mitglieder | `private.is_active_adult` verlangt neben Profil-/Altersfreigabe jetzt auch nicht-suspendierte Mitgliedschaft | Supabase-Migration aktiv |
| Gesperrtes Konto | Restriktive SELECT-Policy für Nachrichten, in der App Sperrseite statt Familieninhalt | Supabase aktiv / App-Code GitHub |
| Kontaktanfragen | Restriktive statt versehentlich permissive Sperr-Policies; nur Empfänger kann annehmen/ablehnen | Supabase aktiv |
| Termin-Teilnahmen | Teilnehmer kann nicht seine eigene Anfrage annehmen; nur Veranstalter entscheidet | Supabase aktiv |
| Foto-Unterschriften / Termintexte | Nach Freigabe keine unmoderierten Änderungen im Betakanal | Supabase aktiv |
| Storage-Uploads | Suspensionsprüfung ist mit bestehenden RLS-Rechten als RESTRICTIVE verknüpft | Supabase aktiv |
| Versehentliche Secrets | `.gitignore` für `.env*`, PEM/Schlüssel, Expo-Builds, Caches und Dependency-Ordner angelegt | GitHub aktiv |

## Offene Sicherheitshinweise aus dem Supabase Security Advisor

- **10 `SECURITY DEFINER`-Funktionen in `public` sind für angemeldete Nutzer aufrufbar:** Das ist bei einer Admin-RPC möglich und nicht automatisch eine Ausnutzbarkeit. Die zurzeit vorhandenen zehn Admin-Funktionen enthalten im Code eine Rollenprüfung über die private `admin_staff`-Tabelle und `auth.uid()`. Sie wurden nicht pauschal gesperrt, da sonst das Admin-Portal ausfallen könnte. Negative Berechtigungstests mit Nichtadministratoren und ein externes Review sind offen. Siehe https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- **6 private Tabellen haben RLS ohne Policies:** Im nicht öffentlich exponierten `private`-Schema ist das nicht automatisch ein Fehler; Berechtigungen bleiben bewusst restriktiv. Siehe https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- **Leaked-Password-Protection ist laut Advisor nicht aktiviert:** Vor Start in der Supabase-Auth-Konfiguration prüfen und nach Möglichkeit aktivieren. Siehe https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Verifikation vom 19.11.2026
- Supabase bestätigt die beiden neuen RLS-Migrationen als angewendet.
- SQL-Abfrage bestätigte: alle 13 neu eingeschränkten Policies sind als `RESTRICTIVE` angelegt; eigene weitere Permissions bleiben `PERMISSIVE`. Bestehende App-Abfragen werden dadurch nicht um zusätzliche Rechte erweitert.
- SQL-Abfrage bestätigte die neue restriktive Nachrichtensichtbarkeit und Mitgliedschaftsprüfung in `private.is_active_adult`.
- Vor und nach diesen Änderungen: **27 bestehende Nachrichten**, kein Datenverlust durch die Migrationen erkennbar.
- App-Dateien über GitHub geprüft; keine vollständige Expo-/React-Native-Buildausführung und kein gemeinsamer E2E-Test auf dem iPhone durchgeführt.
- Kein eingechecktes `.env` oder `.env.local` auf dem geprüften Entwicklungsbranch gefunden. **Git-Historie nicht vollständig nach Secrets durchsucht.**

## Vor einer öffentlichen Beta noch notwendig
1. Zwei unterschiedliche Testkonten mit positivem/negativem RLS-Funktionstest: Gesperrte Konten, Blockierung, fremde Foto-URLs, Kontakt- und Veranstaltungsstatus. Jede erwartete Ablehnung serverseitig bestätigen.
2. Geheimnisprüfung auch über alte Git-Commits und automatische Secret-Scanner, API-Schlüssel gegebenenfalls rotieren.
3. DSGVO-Dokumente: Datenschutzhinweise, Impressum, AV-Verträge, Lösch-/Auskunftsabläufe, Aufbewahrung von Fotos/Meldungen, Einwilligungen bzw. Rechtsgrundlage für Drittanbieter-Moderation. Besonders strenge Standards für Kinderbilder.
4. Prüfen, ob EU-gebundene Moderation mit der vorhandenen OpenAI-API-Konfiguration möglich ist und welche regionalen Verarbeitungszusagen tatsächlich gelten. Bis zur Klärung nicht behaupten, dass ausschließlich in Deutschland verarbeitet wird.
5. Supabase-Auth-Schutz vor kompromittierten Passwörtern und Admin-RPC-Negativtests abschließen.
6. Expo-Go-Durchlauf der Entwicklungsbranch-Funktionen, Fehlerbehebung, danach gesonderter sicherheitsorientierter Merge nach `main`.

**Wichtig:** Diese Version ist kein fertig abgesichertes öffentliches Produkt. Die Sicherheitsmaßnahmen reduzieren Risiken; sie ersetzen keine unabhängige Datenschutz-/Sicherheitsprüfung.
