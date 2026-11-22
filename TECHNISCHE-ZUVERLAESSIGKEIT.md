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
