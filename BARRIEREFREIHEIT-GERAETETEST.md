# Manuelle Geräteprüfung – Mehrsprachigkeit und Barrierefreiheit

**Stand:** 22.11.2026 · Familienfunke, Entwicklungsbranch `ux/generationenfreundlich` · **NICHT durchgeführt / keine Zertifizierung**.

Diese Checkliste ist ein verbindlicher Abnahmeplan für spätere Testpersonen. GitHub Actions prüfen nur Quellcode, Logik und JS-Bundles – **keine** reale Ansage durch VoiceOver/TalkBack, keine echten Touch-Gesten und keine erfolgreiche Geräteanmeldung. Jede Kombination aus Plattform, Sprache und Schriftgröße muss auf einem installierten Test-Build geprüft und protokolliert werden.

## Voraussetzungen und Testdaten

- **Geräte:** echtes iPhone mit VoiceOver und echtes Android mit TalkBack, jeweils mit dokumentierter OS-/App-Version. Simulatortests ersetzen diese Prüfung nicht.
- **Sprachen:** Deutsch und Englisch über `Sprache & Region`; nach jedem Wechsel die aktuelle Sprache, alle sichtbaren Hinweise und die Ansagen kontrollieren. Servicegebiet bleibt Deutschland, Preise in EUR.
- **Darstellung:** Systemschrift 100 % und 200 % (oder höchstmöglicher Gerätestufe), kleines Hochformatgerät und wenn verfügbar Querformat. Screenreader-Fokus darf beim Wechsel nicht unvorhersehbar verschwinden.
- **Testkonten:** freigegebener Erwachsener, unbestätigter Erwachsener und zweites bestätigtes Konto für Kontakte. Nur künstliche Namen, fiktive Artikel und öffentliche Testorte nutzen; keine echten Kinderfotos, Adressen oder vertraulichen Dokumente.
- **Modus:** ohne Screenreader visuell und mit Screenreader vollständig über Wisch-/Doppeltippgesten, ohne verdecktes Antippen der Karte; optional externe Tastatur und Switch Control.
- **Sicherheit:** Testbericht darf keine Zugangsdaten, privaten Chattexte oder personenbezogene Inhalte enthalten.

## Abnahmematrix (jede Zeile: iOS DE/EN und Android DE/EN, ggf. 200 %)

| ID | Ablauf | Erwartetes Ergebnis | Priorität | Status |
| --- | --- | --- | --- | --- |
| A01 | Anmeldung, falsches Kennwort, erneut anmelden, Sprache umstellen | Felder, Fehler, Hilfe und Anmeldeaktion in aktiver Sprache; Fokus bleibt erreichbar; keine ungewollte Aktion | P0 | Nicht geprüft |
| A02 | Startseite durchsuchen, KI-Antwort und Fehlzustand vorlesen | Eingabe und Vorschläge benannt, Antwort angekündigt, Fehler live, keine Fokusfalle; Daten nicht unerwartet übermittelt | P0 | Nicht geprüft |
| A03 | Familienbasar: englische Produktsuche, Größe 110, Preislimit, gespeicherte Suche | Suche findet passende deutsche Eigenschaften; Labels, Zustand und Preis ansagbar; Zahlen/Filterwerte unverändert; keine imaginären Treffer | P0 | Nicht geprüft |
| A04 | Anzeige/Fotos: Entwurf, Bildalternativtext, Bestätigungsdialog, Abbrechen | Jeder Schritt ohne Sicht bedienbar, KI-Vorschläge als unbestätigt gekennzeichnet, nur freigegebene Inhalte sichtbar | P0 | Nicht geprüft |
| A05 | Kontakte/Chat: Anfrage senden/abbrechen, Blockieren, Fehlerzustand | Aktion und Status korrekt angekündigt, keine Nachricht an nicht bestätigte Kontakte, keine fremden Daten | P0 | Nicht geprüft |
| A06 | Benachrichtigungen: öffnen, als gelesen markieren, einzeln löschen, alle löschen/abbrechen | Listenposition und Lesestatus verständlich; vollständiges Löschen erfordert ausdrückliche Bestätigung | P0 | Nicht geprüft |
| A07 | Karte: Ort per Tastatur suchen, Ergebnisliste, Details, alternative Koordinateneingabe | Visuelle WebView-Karte nicht im Screenreader-Fokus; Liste und öffentliche Koordinaten funktionieren vollständig, keine GPS-Pflicht | P0 | Nicht geprüft |
| A08 | Kalender: Eintrag anlegen, bearbeiten, löschen und abbrechen | Datum in aktiver Sprache, Eingabewert ISO YYYY-MM-DD, Uhrzeit stabil, nur eigene Termine änderbar | P0 | Nicht geprüft |
| A09 | Wegweiser: Phasen öffnen, Aufgabenstatus ändern, Quelle ansehen | Zeitleiste und Status korrekt benannt; Fachtext eindeutig als deutsch und ausschließlich für Deutschland gekennzeichnet | P0 | Nicht geprüft |
| A10 | Quiz: fünf Fragen, Antwort, Ergebnis, Englisch↔Deutsch | Fragen und Erklärungen korrekt in aktiver Sprache, Antwortansage nach Mischen korrekt; Sprachwechsel setzt Runde kontrolliert zurück | P0 | Nicht geprüft |
| A11 | Paare finden und Zahlenfolgen | Verdeckte/offene Karte, Treffer und Zahlenerklärung korrekt angesagt; keine unaufgeforderte Timeraktion | P1 | Nicht geprüft |
| A12 | Vier gewinnt: belegte Spalte, Gewinn, Unentschieden | Zeile/Spalte/Spieler in aktiver Sprache, belegte Zugfelder deaktiviert, Gewinn angesagt | P1 | Nicht geprüft |
| A13 | Sudoku 4×4/6×6/9×9, feste Zelle, Fehler, Tipp, Lösung | Zelle mit Reihe/Spalte/Wert/vorgegeben/Konflikt korrekt; 9×9 horizontal erreichbar; Löschen und Tipps bedienbar | P1 | Nicht geprüft |
| A14 | Solitär: Kartenstapel, verdeckte Karte, legaler/illegaler Zug, Rückgängig | Kartenrang und -farbe, Kartenstapel, Zugstatus und Fehler in aktiver Sprache; kein blindes Ziehen erforderlich | P1 | Nicht geprüft |
| A15 | Schach/Dame: Figur, mögliches Zielfeld, Zug, Schachmatt/Schlagzwang, Reset | Figuren und Felder samt Status gesprochen, alle gültigen Züge ohne Drag & Drop erreichbar; Regeln nicht verändert | P1 | Nicht geprüft |
| A16 | Bilderpuzzle, Wort-/Kreuzworträtsel | Bildteile und Vorlage benannt; deutsche Worträtsel in Englisch ausdrücklich als deutsch markiert | P1 | Nicht geprüft |
| A17 | Profil, Sichtbarkeit, Sprache, Push-Einstellungen, Abmeldung | Schalterstatus und Bestätigung verständlich, Daten/Anmelderechte unverändert; kein ungewollter Push-Opt-in | P0 | Nicht geprüft |
| A18 | Große Schrift, hohe Kontraste, dynamische Bildschirmgröße | Kein Abschneiden wichtiger Buttons/Fehler, Zielgrößen bedienbar, keine horizontale Textfalle; Spielbretter dürfen gezielt scrollen | P0 | Nicht geprüft |
| A19 | Tastatur, Voice Control, Switch Control und reduzierte Bewegung | Essenzielle Flows ohne präzise Wisch- oder Pinch-Gesten ausführbar, kein unaufgefordertes Motion-Verhalten | P1 | Nicht geprüft |

**Wichtig:** Bei A03–A09 ausschließlich Testdaten verwenden. Bei KI, Karten- und Fremddiensten Datenschutz und Serverlimits getrennt prüfen. Datenbanktests mit simulierten Rollen sind kein vollständiger End-to-End-Authentifizierungstest.

## Bestehensbedingungen

1. Bei P0 kein unerreichbares Bedienelement, keine unbeabsichtigte Veröffentlichung/Löschung, kein Datenzugriff ohne Berechtigung und keine irreführende Risiko-/Freigabeansage.
2. Alle interaktiven Felder haben eine verständliche Beschriftung, Rolle, aktuellen Status und möglichst mindestens 44×44 dp/pt große Zielbereiche; jeder aktive Fehler und jeder Abschluss muss ohne Sicht wahrnehmbar sein.
3. Fokus nach Öffnen/Schließen eines Modals und nach Navigation sichtbar und programmatisch nachvollziehbar; keine Screenreader-Endlosschleife.
4. Bei 200 % Systemschrift bleiben alle Kernaktionen zugänglich. Seitlich scrollbare Spielbretter und Kartenlisten sind nur akzeptabel, wenn die Bedienelemente einzeln mit Screenreader erreichbar sind.
5. Englische Texte sind inhaltlich korrekt, nicht nur dekorativ übersetzt. Deutsche Original-Fachtexte und deutschen Wortspiele sind klar gekennzeichnet.
6. Ein P0-Fehler blockiert Freigabe. P1/P2-Fehler müssen dokumentiert, bewertet und priorisiert werden, auch wenn die automatisierten Tests grün sind.

## Testprotokoll für jeden Testfall

- **Test-ID:** A__
- **Datum / testende Person:** ...
- **Plattform / OS / Gerät / App-Build / Sprache / Schriftgröße:** ...
- **Screenreader / weitere Hilfstechnik:** ...
- **Vorbedingungen und Testkonto (keine privaten Kennungen):** ...
- **Schritte:** 1. ... 2. ... 3. ...
- **Erwartetes Verhalten:** ...
- **Tatsächliches Verhalten und vorgelesener Text:** ...
- **Ergebnis:** Bestanden / Fehlgeschlagen / Blockiert / Nicht geprüft
- **Schweregrad:** P0 / P1 / P2
- **Fehlerticket / Bildschirmausschnitt (ohne personenbezogene Inhalte):** ...
- **Gegenprobe nach Fix:** Datum, Build, Ergebnis ...

**Gesamtstatus: Keine Freigabe.** Erst nach durchgeführten Tests auf echten Geräten mit dokumentierten Resultaten darf über Barrierefreiheits-Abnahme entschieden werden.
