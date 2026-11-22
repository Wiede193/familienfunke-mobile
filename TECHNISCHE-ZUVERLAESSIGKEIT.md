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
