# Familienfunke – UX- und Navigationsprüfung (24.11.2026)

## Ausgangspunkt

Diese Prüfung basiert auf den tatsächlichen React-Native-Dateien
`App.jsx`, `TopRightMenu.jsx`, `HomeAssistant.jsx`, `HomeNavigation.js`,
`AboutAndHelp.jsx`, `FamilyInteraction.jsx`, `FamilyMotion.jsx` und den
vorhandenen GitHub-Actions-Tests.

Sie ist **keine** Zertifizierung der Barrierefreiheit und ersetzt keine
Praxisprüfung in Expo Go auf unterschiedlichen iPhones und Android-Geräten.

## Festgestellte Probleme und Änderungen

| Problem | Korrektur |
| --- | --- |
| Basar-Schnellzugriff im Menü wurde von der Navigationslogik nicht akzeptiert | Haupt-Tabs sind jetzt reguläre Ziele der Menü-Navigation |
| Viele Funktionen erst nach Öffnen mehrerer Menükategorien auffindbar | Direktes Suchfeld oben im Menü, lokale Trefferliste mit echten Navigationszielen |
| Eigene Anzeigen nur umständlich über den Basarfilter erreichbar | Echte Direktnavigation „Meine Anzeigen“ aus Menü, Startseite und Suche |
| Merkliste und gespeicherte Suchaufträge leicht zu verwechseln | Unterschiedliche Menüziele und Direktlinks, eindeutige Bezeichnungen |
| Startseitenaktion „Nachrichten“ öffnete Kontakte statt Unterhaltungen | Jetzt direkt auf die Nachrichtenliste geroutet |
| Alte FAQ beschrieb noch Vorabfreigabe, KI-Fotoerkennung und „Mehr“-Navigation | 23 Antworten aktualisiert, drei aktuelle FAQs ergänzt |
| Hilfetexte erklärten Funktionen, boten aber keinen direkten Weg dorthin | Antwortkarten enthalten „Bereich öffnen“-Schaltflächen |
| Wechsel aus der Inseraterstellung konnte Eingaben verwerfen | Bestätigungsabfrage für ungespeicherte Angaben |
| Kistenentwürfe konnten bei schneller Navigation vor dem asynchronen Autosave verloren gehen | Explizite lokale Speicherung vor dem Verlassen und Fehlermeldung, falls sie fehlschlägt |
| Wechsel aus Chat und Veranstaltungserfassung konnte ungesendete Texte verlieren | Bestätigungsabfrage vor dem Verwerfen |
| Kleine Displays und große Schrift bei 2-spaltigen Menüaktionen | Einspaltiges Layout bei schmalem Bildschirm oder großer Schrift |
| Startseiten-Suchvorschläge konnten zu basarlastig werden | Vier ausgewogene Einstiege: Familien, Karte, Basar, Wissen |
| Tour enthielt veraltete Aussage zu Flohmarkt-Vorabfreigabe | Texte auf sofortige Veröffentlichung und Meldungen korrigiert |

## Navigationsprinzipien

- Unten bleiben fünf klar definierte Hauptbereiche:
  **Start – Basar – Familien – Karte – Wissen**.
- Rechts oben befinden sich Suche, häufige Aufgaben und weitere
  persönliche Bereiche.
- Die Menüs führen zu **echten** Zielen. Zusätzliche Browser-Tabs oder
  Scheinseiten wurden nicht eingebaut.
- **Anzeigen erstellen**, **Meine Anzeigen** und **Merkliste** öffnen
  unmittelbar die jeweilige reale Basaransicht.
- Die Menüsuche arbeitet lokal und benötigt keine kostenpflichtige KI-API.
  Sie versteht typische Begriffe wie „Passwort“, „Anzeige“, „Merkliste“,
  „Kita“ oder „Elterngeld“ und zeigt passende Bereiche zum Antippen.
- Die FAQ bleibt auch ohne Anmeldung als Hilfe zur Anmeldung lesbar.
  In der angemeldeten App öffnet sie auf Wunsch die passende Funktion.

## Geprüfte Navigation und Datenverlustschutz

Testdateien:
- `tests/check-menu-discovery.mjs`
- `tests/check-home-assistant.mjs`
- `tests/check-accessibility.mjs`
- `tests/check-friendly-onboarding.mjs`

Der neue Test ist in `npm run check:design-refresh` eingebunden.
GitHub Actions prüft zusätzlich weitere Module und erstellt iOS- und
Android-Bundles. Erfolgreiche Bundles belegen die technische
Kompilierbarkeit, **nicht** die praktische Bedienbarkeit jedes Screens.

## Gerätetest – besonders wichtig

1. Menü rechts oben öffnen, nach „Basar“, „Anzeige“, „Meine Anzeigen“,
   „Merkliste“, „Kita“, „Passwort“ und „Elterngeld“ suchen; jeden Treffer
   öffnen und mit „Zurück“ zurücknavigieren.
2. Eine Anzeige mit Text und Foto beginnen; dann einen anderen Tab
   antippen. Die App muss ausdrücklich fragen, bevor Änderungen
   verloren gehen.
3. In der Kleidungskiste ein Teil anlegen, während der Bearbeitung
   den Bereich wechseln und den gesicherten Zwischenstand erneut öffnen.
4. In einem Chat eine Nachricht schreiben, ohne zu senden, und
   „Zurück“ antippen. Die App muss vor dem Verlust warnen.
5. Ein Treffen mit Titel und Termin anlegen und den Tab wechseln;
   auch hier muss die App fragen.
6. FAQ öffnen, „Wie stelle ich einen Artikel ein?“ suchen, Antwort
   aufklappen und „Anzeige erstellen“ direkt öffnen.
7. iPhone mit aktiviertem „Größerer Text“, VoiceOver und reduzierten
   Animationen testen. Prüfen, ob wichtige Schaltflächen vollständig
   sichtbar, gut erreichbar und korrekt angesagt werden.

## Offene Einschränkungen

- Einige sehr umfangreiche Bereiche (Karte, Kleidungskiste,
  Partnerformulare, Spiele) benötigen weiterhin eigenständige,
  gerätegestützte UX-Tests. Eine einmalige Codeprüfung deckt nicht alle
  Interaktions- und Darstellungsfehler ab.
- Die Menüsuche ist eine regelbasierte Navigationssuche, kein frei
  formulierendes Sprachmodell. Unbekannte Begriffe liefern die
  Möglichkeit, die Hilfe zu öffnen, statt einen Treffer zu erfinden.
- Lokale Kistenentwürfe sind kein Cloud-Backup; bei Deinstallation
  können sie verloren gehen.
- Für die öffentliche Marktplatz-Freigabe bleibt der nachträgliche
  Umgang mit problematischen Angeboten und Community-Meldungen
  eine betriebliche Pflicht. Die UX-Änderung beseitigt dieses Risiko
  nicht.
