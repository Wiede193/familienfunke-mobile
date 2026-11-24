# Familienfunke – sanfte Benutzerführung und einheitliche Entwürfe

Stand: 24. November 2026. Umsetzung in Expo/React Native ohne zusätzliche
Animationsbibliotheken und ohne kostenpflichtige Sprachmodell-API.

## Erster App-Start

- Beim ersten Aufruf des Login-Bildschirms auf diesem Gerät erscheint eine
  **einmalige kleine Funken-Animation**. Sie ist kurz und überspringbar.
  Eine echte öffentliche Registrierung wurde nicht neu freigeschaltet;
  die bisherige geschlossene Testphase bleibt bestehen.
- Nach Anmeldung zeigt Familienfunke den bereits vorhandenen **Über-uns-
  Steckbrief** in einer sanften Einblendung (beim ersten Login des Kontos
  auf diesem Gerät, oder bei späterem Aufruf über das Menü).
- Danach startet erstmals je Konto eine **6-teilige App-Tour**:
  Suche und Wissen, Basar, Familien, Karte, Wissen und Menü.
  Der Tourführer zeigt einen Richtungspfeil und eine Erklärung pro Schritt,
  bietet Zurück/Weiter/Überspringen und bewegt sich nicht in einer Endlosschleife.
- Der Abschluss wird pro Konto auf dem Gerät gespeichert. Eine Wiederholung
  ist im Menü unter **App-Tour** möglich.
- Bei systemweit aktivierter Einstellung **Bewegung reduzieren** werden
  Bewegungseffekte abgekürzt oder übersprungen.

## Suche, Antworten und Navigation

- Der Suchbereich erscheint mit einem kurzen Gleiteffekt.
- Wortmarke und Hauptnavigation bewegen sich bei vertikalem Scrollen
  lediglich um wenige Punkte, statt permanent zu blinken oder zu wackeln.
- Die aktiven unteren Tab-Symbole erhalten eine kurze, warme Aufhellung.
- Jede Wissensantwort hat die deutlich sichtbare Überschrift **Deine Antwort**,
  größeren Text und einen Quellenblock. Die jüngste Antwort hebt sich
  zusätzlich mit einem Akzentrahmen ab.
- Die Antwort wird nach dem Finden automatisch in den sichtbaren Bereich
  gescrollt und für Screenreader angekündigt.
- Das **i** bei den Beispielfragen erläutert Grenzen der Offline-Wissensbasis.

## Entwurfsvorlagen

Die Datei `FamilyDraftTemplates.js` führt lokale, bearbeitbare Mustervorlagen:
- **Basar:** Kleidung, Spielzeug, Babyausstattung.
- **Veranstaltungen:** Spielplatztreffen, Spaziergang, Kinderflohmarkt.
- **Privatnachrichten:** Kennenlernen, Ausflugsfrage, Angebotsfrage.

Die Komponente `DraftTemplatePicker.jsx` zeigt die Vorlagen direkt im
jeweiligen Eingabebereich. Sie ersetzt vorhandene Texte nicht ohne Rückfrage.
Ein Muster erzeugt keine echte Anzeige, keine echte Veranstaltung und
keine automatisch versendete Nachricht.

`[ergänzen]` muss vor Einreichen bzw. Senden ersetzt oder die jeweilige
Zeile entfernt werden. Das prüfen sowohl die Schaltflächen als auch die
Submit-Funktionen.

**Wichtige technische Abgrenzung:** Die Basar-Merkmale wie Kategorie,
Artikelzustand und Preis bleiben echte strukturierte Formularfelder.
Die Veranstaltungsbeschreibungen und privaten Nachrichten sind derzeit
weiterhin Textfelder mit einheitlichen Vorlagen. Eine spätere, vollständig
strukturierte Datenbankanalyse dieser Texte benötigt gesonderte Tabellen-
und Formularkonzepte; die Vorlagen allein sind keine KI.

## Testen

Die bestehende GitHub-Action enthält den Test
`tests/check-friendly-onboarding.mjs` über `npm run check:design-refresh`.
Er prüft die Animation-/Tour-Integration sowie die vorgegebenen
Platzhaltersperren. Zusätzlich laufen unveränderte allgemeine
Sicherheitsprüfungen und iOS-/Android-JavaScript-Bundles.

Manueller Gerätetest nach `git pull` und `npx expo start -c`:

1. Bei bereits benutztem Gerät wird die Startanimation absichtlich nicht
   jedes Mal wiederholt. Bestehende Konten sehen den Steckbrief ebenfalls
   nur beim ersten Mal, oder nach manuellem Aufruf.
2. Die Tour ist über **Menü → Hilfe & Einstellungen → App-Tour** erneut
   abrufbar und muss ohne versehentliche Datenänderung beendet werden können.
3. „Antwort finden“ eingeben: Der grün umrandete Antwortblock soll in den
   Blick gelangen; Quellen und weiterführende Aktionen bleiben bedienbar.
4. Im Basar, Veranstaltungsformular und privaten Chat eine Vorlage einsetzen,
   ergänzen und erst nach Kontrolle absenden. Mit `[ergänzen]` muss der
   Versand beziehungsweise die Einreichung blockiert sein.
5. Auf einem Gerät mit aktivierter Systemeinstellung **Bewegung reduzieren**
   dürfen die Abläufe nicht durch Animation verzögert werden.

Es handelt sich um eine erste nutzbare UX-Ausbaustufe. Pfeilpositionen,
kleine Displays, große Schrift, Screenreader und Animationsempfinden
sollten im echten Gerätetest überprüft werden.
