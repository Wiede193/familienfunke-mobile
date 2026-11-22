# Familienfunke – Zuverlässigkeit der Datenaktualisierung

Stand: 22. November 2026. Diese Änderungen sind technische Härtungen,
kein Nachweis einer getesteten Mehrnutzer-Kapazität.

## Verbesserungen

1. **Neuigkeiten öffnen ohne globalen Reload:** Die Benachrichtigungszentrale
   verifiziert nur das angeklickte, zum angemeldeten Konto gehörende Ereignis
   und lädt anschließend ausschließlich das Ziel (freigegebenes Angebot,
   eigenes Inserat oder konkrete Kontaktanfrage). Ältere Kontaktanfragen
   bleiben über ID erreichbar. Die Anzeige eines Kontaktnamens wird
   unabhängig und ohne Blockieren des Navigationsvorgangs nachgeladen.

2. **Keine veralteten Ergebnisse mehr anzeigen:** Initiale Datenladungen
   werden über Konto-ID plus laufende Request-Generation geprüft.
   Eine frühere Antwort desselben Kontos darf die Daten einer neueren
   Aktualisierung nicht mehr überschreiben. Das gilt auch für
   die zwei Social-Paginierungsrouten.

3. **Kontoübergreifende Trennung:** Nach Kontoänderung werden
   Fehlermeldungen, Hinweise und noch nicht abgeschickte Meldetexte
   verworfen. Späte Antworten von Aktionen sollen dem inzwischen
   angemeldeten Konto keine Erfolgsmeldung eines früheren Kontos zeigen.

4. **Gezielte Aktualisierung nach Änderungen:** Fotoaktionen aktualisieren
   die Fotoansicht; das Senden einer Meldung, Passwortänderung,
   das Einreichen eines Familienorts und das Einreichen einer
   Partnerveranstaltung erfordern keinen globalen Familiensuche-/
   Kontaktlisten-Refresh. Ein neuer Partnerantrag wird direkt
   in die eigene Einrichtungsliste aufgenommen, ohne andere
   App-Bereiche neu einzulesen.

5. **Erfolgreiche Schreiboperationen korrekt behandeln:** Nach einem
   erfolgreichen Schreibzugriff darf ein anschließender Lesefehler
   nicht als gescheiterter Schreibzugriff dargestellt werden.
   Insbesondere dürfen Inserate dadurch nicht versehentlich doppelt
   erstellt werden.

## Qualitätssicherung

- `RequestGeneration.js` – testbarer Identitäts- und
  Generation-Guard für asynchrone Antworten.
- `tests/check-request-generation.mjs` – wirft alte und kontofremde
  Antworten zurück.
- `tests/check-app-data-flows.mjs` – schützt gezielte Benachrichtigungs-
  auflösung und unabhängige Mutationsaktualisierung.
- CI: `npm run check:data-flow` zusätzlich zu den bestehenden
  Regressionstests und Expo-Bundleprüfungen für beide Plattformen.

## Noch offen

- Reale Integrationstests mit falschen/abgelaufenen Sessions,
  Netzwerkunterbrechung und schnell wechselnden Konten.
- `blocks` hat weiter eine feste Grenze von 200 Einträgen.
  Eine private, paginierte Verwaltung dieser Liste ist sinnvoll.
- Mehrere ältere Aktionen verwenden absichtlich noch
  `load(true)`, weil sich ihre Auswirkungen auf mehrere
  App-Bereiche verteilen (Kontaktfreigabe, Blockieren,
  Profilbearbeitung). Diese sollten später einzeln
  getrennt und mit Integrationstests abgesichert werden.
- Vor einem öffentlichen Nutzeransturm sind Staging, Backups,
  Monitoring und realistische Lasttests erforderlich.


## Phase 7 – Schwache Verbindung und doppelte Aktionen

- **Gezielter, begrenzter Retry:** `NetworkResilience.js` wiederholt nur
  idempotente lesende Supabase-Abfragen und nur bei erkennbar temporären
  Netzwerkfehlern oder HTTP 408/502/503/504. Ein höchstens zweiter Aufruf
  wird nach 350 ms ausgeführt; auf 401/403/429, Validierungs- und
  RLS-Fehler wird **nicht** automatisch reagiert. Bereits veraltete Anfragen
  werden nicht nochmals gestartet. Auch ein zweimaliger Fehler führt
  zu **keinem dritten Aufruf**.
- **Verbindungswarnung:** Schlägt das Laden der allgemeinen Konto-Daten
  nach dem begrenzten Wiederholungsversuch fehl, zeigt die App einen
  Hinweis mit `Daten erneut laden`. Bei erfolgreichem Laden verschwindet
  der Hinweis wieder. Der Verbindungszustand wird **aus echten
  Anfragefehlern**, nicht aus einem unzuverlässigen Offline-Detektor,
  abgeleitet.
- **Basarsuche:** Ein fehlgeschlagener Suchlauf zeigt
  `Basarsuche erneut versuchen` statt den Nutzer zum Zurückgehen oder
  Ändern der Filter zu zwingen. Die Seite wird mit den gleichen
  Suchkriterien neu angefordert.
- **Doppelklick-Schutz:** Anmelden nutzt eine unmittelbare Ref-Sperre.
  Senden von Chats, Kontakten/Freigaben, Inseraten, Meldungen und
  anderen App-weiten Mutationen teilen einen atomaren
  `createActionGate`. Schnelle zusätzliche Klicks erzeugen während der
  ersten Aktion keine zweite Anfrage. Der Sperr-Token wird beim
  Kontowechsel verworfen; eine späte alte Antwort darf die neue Aktion
  nicht freischalten.
- **Wichtige Grenze:** Schreiboperationen werden **niemals automatisch
  wiederholt**. Bei fehlender Serverbestätigung bleibt unklar, ob der
  Server sie bereits gespeichert hat. Die App fordert zur Prüfung des
  Chatverlaufs oder aktuellen Status auf. Ein lokaler Klickschutz
  ersetzt **keine** serverseitigen Idempotency-Keys gegen erneutes
  Senden nach App-Neustart oder manueller Wiederholung.
- **Tests:** `npm run check:network` deckt temporäre und definitive
  Fehler, genau einen Retry, abgebrochene Anfragen, doppelte Aktionen,
  ungültige alte Konto-Tickets und die UI-Verkabelung ab. Die vorhandenen
  Native-CI- und Sicherheitsprüfungen bleiben erhalten.

**Weitere Prioritäten:** Gerätesimulation mit abgeschaltetem WLAN und
wechselndem Mobilfunk, gezielte Server-Idempotenz für Chatnachrichten
und Kontaktanfragen, vollständige Blocklisten-Paginierung und
verlässliche Überwachung der Antwortzeiten. Die Änderung ist
keine Lasttest-Freigabe.


## Phase 8 – Idempotente Chats und kontrollierte Kontaktaktionen

- **Server erkennt wiederholte Nachrichten:** Der bestehende
  `messages.id`-Primärschlüssel dient jetzt als dauerhaft eindeutige
  Sende-ID. Neue Clients übermitteln pro beabsichtigter Nachricht die
  gleiche UUIDv4, auch nach einem unklaren Serverergebnis.
  `send-message` (Edge Function v7) prüft den authentifizierten Absender,
  freigegebenen Kontakt, Blockierungen, Verifizierung und Kontostatus,
  bevor eine bereits gespeicherte Nachricht zurückgeliefert wird.
  **Kontakt, Absender und Originaltext müssen exakt übereinstimmen.**
  Andernfalls wird die UUID mit HTTP 409 abgelehnt.
- **Keine Duplikate bei gleichzeitigem Senden:** Der eindeutige
  `messages.id`-Primärschlüssel schützt auch bei zwei parallelen
  Edge-Anfragen. Der Server behandelt auch einen bereits erfolgreich
  gespeicherten Versuch, der im vorgeschalteten Nachrichtenkontingent-
  Trigger hängenbleibt. Eine Wiederholung speichert nichts neu,
  löst keine zweite Push-/Neuigkeiten-Benachrichtigung aus und
  benötigt bei früh erkanntem Duplikat keine erneute KI-Moderation.
  Neue Nachrichten bleiben vollständig moderationspflichtig.
- **Nach Neustart wiedererkennbar:** `ChatSendIntent.js` speichert vor
  dem Versand nur die UUID, einen SHA-256-Fingerabdruck des
  konten-/kontaktbezogenen Texts und einen Zeitstempel in AsyncStorage,
  **niemals den Text selbst**. Wird derselbe Text nach einem unklaren
  Ergebnis erneut gesendet, benutzt die App innerhalb von sieben
  Tagen dieselbe ID. Nach bestätigter Speicherung wird die Vormerkung
  gelöscht, sodass identischer Text später bewusst neu gesendet werden kann.
  Fehlschlag der lokalen Speicherung verhindert den Versand.
- **UUID-Generator:** Wenn das Gerät die sichere
  `crypto.randomUUID`- oder `crypto.getRandomValues`-API
  bereitstellt, wird sie verwendet. Andernfalls holt die
  App eine UUIDv4 über `ff_message_request_id` aus der
  authentifizierten Datenbank. Keine unsicheren Math.random-IDs.
- **Kontakte:** Die Datenbank hatte bereits den eindeutigen Index
  `contact_requests_one_per_pair_idx` für ein ungeordnetes Familienpaar.
  Die App hatte allerdings keine direkten INSERT-/UPDATE-Rechte mehr.
  Diese wurden **nicht** geöffnet. Stattdessen delegieren zwei öffentliche
  `SECURITY INVOKER`-RPCs an streng geprüfte, separat geschützte
  Funktionen in `ff_contact_internal`.
  Die Funktionen erzwingen die angemeldete Person, erlaubte Beziehungen,
  Verifizierung/Blockierung und die bestehenden Status-/Swipe-Regeln.
  Ein wiederholter Antrag für dasselbe Paar oder dieselbe
  Statusänderung erzeugt keine zweite Kontaktaktion.
- **Bereits endgültig abgelehnte oder zurückgezogene Kontaktanfragen:**
  Der bestehende Paar-Index verhindert derzeit neue Anträge
  desselben Paars auch nach `declined` oder `cancelled`.
  Die App zeigt dafür eine verständliche Fehlermeldung; eine
  Reaktivierung ist eine separate Produktentscheidung.

### Berechtigungsprüfungen

- `anon` darf weder die drei neuen öffentlichen RPCs
  noch die beiden internen Funktionen ausführen.
- `authenticated` darf die geprüften RPCs ausführen,
  erhält aber weiterhin **kein** direktes INSERT/UPDATE
  auf `public.contact_requests` oder `public.messages`.
- Die öffentlichen RPCs verwenden `SECURITY INVOKER`,
  interne privilegierte Funktionen liegen in einem
  **nicht** via Data API exponierten gesonderten Schema.
- Die bestehenden Security Advisors haben unverändert
  37 warnende ausführbare Security-Definer-Funktionen,
  eine Passwort-Leak-Schutzwarnung und 31 Informationsmeldungen.
- Backend-Migration und neue Edge-Funktion wurden live
  angewendet; Anonyme Zugriffsrechte und Sende-ID-Generator
  wurden per SQL geprüft. Ein vollständiger echter Chat-End-to-End-
  Test mit zwei freigegebenen Testkonten **steht noch aus**.

### Versions- und Rolloutgrenzen

- Die vorherige App-Version **ohne** `request_id` wird vom
  neuen Chat-Endpunkt weiterhin unterstützt, aber ihre
  Wiederholungen sind noch nicht idempotent.
- Es gibt weiterhin keine Offline-Versandwarteschlange und
  **keine** automatischen Wiederholungen von Schreibvorgängen.
  Nutzer müssen eine unbestätigte Nachricht manuell erneut auslösen.
- Die lokale gespeicherte Sende-ID schützt nur den jeweiligen
  Account auf diesem Gerät. Zwei verschiedene Geräte können
  dieselbe beabsichtigte Nachricht mit unterschiedlichen IDs
  absenden; genau-diese-Absicht geräteübergreifend zu erkennen
  braucht ein zusätzliches gemeinsames Protokoll.
- Für reale Freigabe: Offline-/Neustart-Test, Netzabbruch direkt
  nach erfolgreichem INSERT, parallele Edge-Aufrufe, Moderation
  und bestehendes Fünf-Nachrichten-Limit mit synthetischen
  Testkonten im separaten Staging prüfen.

Tests: `npm run check:chat-idempotency`.
Backend: `database/ff_chat_contact_idempotency_20261122.sql`,
`supabase/functions/send-message/index.ts`.


## Phase 9 – Blockierungen und große Kontaktlisten

**Nachgewiesener Fehler:** Der App-Start hatte `blocks.select('*').limit(200)`.
Bei mehr als 200 selbst blockierten Konten konnte die Oberfläche
ältere Sperren fälschlich als aufgehoben anzeigen, obwohl
die serverseitige Zugriffskontrolle sie weiterhin durchsetzte.

- **Nur sichtbare Sperren abfragen:** `ff_block_flags(uuid[])`
  prüft über PostgreSQL-RLS ausschließlich Blockierungen, die der
  angemeldete Nutzer **selbst** gegenüber den aktuell dargestellten
  Profilen/Kontakten gesetzt hat. Maximal 120 UUIDs pro Aufruf.
  Die erste Seite (40 Familien plus 40 Kontakte und maximal wenige
  explizit ausgewählte Personen), alle Folgeseiten und ältere
  Benachrichtigungs-Kontakte prüfen den tatsächlichen Blockstatus
  vor Darstellung. Ein fehlgeschlagener Block-Check verwirft die
  betreffende neue Seite, statt „nicht blockiert“ zu raten.
- **Alle eigenen Blockierungen verwalten:** Unter
  Profil → Konto & Sicherheit erscheint eine separat **erst beim
  Öffnen** geladene, chronologisch paginierte Liste.
  `ff_my_blocks_page` liefert maximal 30 eigene Blockierungen pro
  Aufruf, mit stabilem `created_at + blocked_id`-Cursor,
  passendem Index und „Weitere blockierte Konten laden“.
  Einzelne Entsperrungen werden nur bei bestätigtem Erfolg
  durch erneute Serverabfrage übernommen. Es werden keine
  Namen fremder blockierter Familien erzwungen.
- **Sicherheit:** Beide RPCs sind `SECURITY INVOKER`,
  erben die bestehenden Block-RLS-Policies und sind nur für
  `authenticated` ausführbar; `anon` bekommt kein EXECUTE.
  Es sind keine neuen direkt lesbaren Fremd-Benutzerdaten,
  Security-Definer-Funktionen oder weitreichenden Tabellenrechte
  hinzugekommen.
- **Große Listen effizient:** Die Kontaktverwaltung und
  Chatübersicht nutzen `FlatList` statt alle Kontakte mit
  `ScrollView.map` sofort zu rendern. Die Anzahl zunächst
  gerenderter Karten und die Render-Chunks sind begrenzt.
  `ff_chat_previews` liest beim Nachladen nur neu hinzugekommene
  Kontakt-IDs in 50er-Gruppen; alte Vorschauen werden im
  geöffneten Bildschirm nicht erneut geladen.
  Eine gesperrte Unterhaltung lässt sich in der Übersicht
  nicht mehr öffnen.
- **Tests:** `npm run check:blocks` validiert Cursor,
  Flag-Ersetzung, Kontotrennung, RPC-Rechte, Deep-Link-Fälle,
  virtuelle Listen und nur inkrementelles Laden.

**Grenzen:** Die dynamischen Serverrechte verhindern Zugriffe,
aber die App erfährt fremde Blockierungen nicht als eigene Sperrflags.
Es fehlen echte Gerätetests mit mehreren hundert Kontakten und
mehr als 200 Blockierungen. Für sehr große Gesamtlisten wäre
weitergehende Suche und serverseitige Filterung sinnvoll.
