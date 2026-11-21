# Barrierefreiheit – Familienfunke (Arbeitsprüfung, 21.11.2026)

**Status: NICHT als vollständig barrierefrei bestätigt.** Diese Prüfung ist eine Codeinspektion der Expo/React-Native-App. Sie ist keine unabhängige Konformitätsprüfung, kein Nutzertest und keine Zertifizierung.

## Referenzrahmen

- WCAG 2.2 AA als Entwicklungsziel, ergänzend WCAG2ICT für native Software und EN 301 549 als relevante europäische Prüfnorm.
- Touchflächen möglichst **44 × 44 logische Pixel**, obwohl WCAG 2.2 AA 2.5.8 bereits 24 × 24 CSS-Pixel (mit Ausnahmen) fordert.
- Keine ausschließliche Bedienung über Gesten, Farben, Zeitlimits oder visuelle Bilddetails.
- WCAG-Konformität kann nur durch Kombination aus Codeanalyse, automatisierten Prüfungen und manuellen Gerätetests nachgewiesen werden.
- Für die spätere Zahlung/Marktplatz-Funktion **BFSG-Anwendbarkeit juristisch prüfen**, einschließlich Geschäftsmodell, Vertragsschluss und möglicher Kleinstunternehmens-Ausnahmen. Keine pauschale Befreiung unterstellen.

## Bereits umgesetzte erste technische Korrekturen

1. Begrüßungsfenster bleibt ohne automatische Schließung offen, bis eine Person aktiv bestätigt. Native Modal-Isolierung.
2. Labels, Zustände und größere Interaktionsflächen für zentrale Buttons, Regionssuche, Familienfilter, Chat und Basar ergänzt.
3. Rein informative Interessen-Chips sind keine scheinbar deaktivierten Buttons mehr.
4. Meldedialog als natives Modal mit Screenreader-Fokusisolation.
5. KI kündigt eine eingetroffene Antwort an; Fehler werden als Statusmeldungen bereitgestellt; keine erzwungene Scroll-Animation.
6. Basar-Karten und KI-Startseitenkarten wechseln bei größerer Systemschrift/geringem Platz in ein einspaltiges Layout.
7. Foto-Positionsmarker im Kistenmodus von 26 × 26 auf 44 × 44 erhöht; Ausschnittregler mit aussagekräftigen Screenreader-Namen.
8. Bei relevanten Bildern einfache Alternativtexte/Benennungen ergänzt; reine Vorschaubilder innerhalb eines benannten Buttons versteckt.
9. Kartenorte sind über eine Textliste erreichbar; der visuelle WebView ist aus dem Screenreader-Fokus genommen. Neue Orte können per Tastatur mit Breiten- und Längengrad eingetragen werden (statt verpflichtendem Kartentipp).
10. Formulare mit mehrzeiliger Texteingabe verwenden Mindesthöhen, keine starre Höhe. Farbleitfaden und Kontrast-Regressionstests bereits vorhanden.
11. Basar-Bildbeschreibungen fassen nur die vom Verkäufer bestätigten Artikelmerkmale und Paketbestandteile zusammen; es werden keine unbestätigten visuellen Details erfunden. Die Bild- und Angebotsbeschreibungen sind auch ohne Screenreader lesbar.
12. Familienkarte: Stadt- und Ortsnamensuche oberhalb der Karte, lokal in bereits recherchierten oder geladenen Orten; Auswahl mit Screenreader, ohne Kartentipp. Die Suche ist kein bundesweiter externer Geocoder.

## Offene Risiken und Priorisierung

| Dringlichkeit | Bereich | Aktueller Stand / notwendige Folgemaßnahme |
| --- | --- | --- |
| **P0 vor öffentlichem Launch** | Screenreader-Gesamtdurchlauf | Vollständige Abläufe mit VoiceOver (iOS) und TalkBack (Android) testen: Registrierung/Login, KI-Startseite, Entdecken, Kontaktanfrage, Chat, Inserat, Fotoanalyse, Basar-Suche, Kaufkontakt, Profil, Meldung, Karte. Fokusreihenfolge, Beschriftungen und Statusankündigung prüfen. |
| **P0** | Textvergrößerung / Reflow | Schrift 100 %, 150 %, 200 % sowie kleine Geräte prüfen; besonders sechs Bottom-Tabs, Profilformulare, Filter, Chat-Tastatur, Foto-Korrektur, horizontale Karten und Modals. Sichtbaren Text nicht abschneiden. |
| **P0** | Bildinhalt / Fotoprozesse | Strukturierte, bestätigte Artikelmerkmale werden vorgelesen. **Noch offen:** echte, vom Verkäufer kontrollierbare Bildbeschreibung für jedes einzelne Foto; Foto-/Crop-Prüfung und KI-Fehlerfälle müssen auch ohne visuelle Kontrolle bedienbar sein. Keine KI-Erkennung als sichere Tatsache ausgeben. |
| **P1** | Karten-Eingabe | Lokale und deutschlandweite Geocoding-Suche für öffentliche Ziele verbunden, inklusive nummerierter Pins, zugänglicher Trefferliste, bewusst ausgelöster externer Anfrage, Länderfilter und Serverlimits. Noch offen: authentifizierte End-to-End-Gerätetests und produktionsgeeigneter gehosteter/self-hosted Photon-Dienst vor öffentlichem Start. Koordinaten bleiben als Alternative vorhanden. |
| **P1** | Dynamische Statusmeldungen | Bei Navigation, Laden, Kontaktanfrage, Chatversand, Bildfreigabe, Filterwechsel und Ablehnung prüfen, ob Ereignisse ohne Sicht lesbar sind; Fokus nach Routenwechsel kontrolliert setzen. |
| **P1** | Kontrast außerhalb Theme-Tokens | Individuelle Inline-Farben, Overlay-Texte, Bildtexte, Statusfarben, Platzhalter und Fokusindikatoren visuell und automatisiert prüfen (mindestens 4,5:1 Fließtext; nichttextuelle Indikatoren 3:1, wo erforderlich). |
| **P1** | Alternative Eingaben | Alle Vorgänge mit externer Tastatur, Switch Control und Voice Control ohne Drag-Gesten oder feinmotorisches Ziehen testen. Prüfen, ob Touch-Hilfsflächen keine angrenzenden Ziele verdecken. |
| **P2** | Reduzierte Bewegung | Ladeanimationen, Modal-Ein-/Ausblendung und künftige Animationen nach Systempräferenz „Bewegung reduzieren“ behandeln. |
| **P2** | Leichte Sprache / Verständlichkeit | Kürzere Hilfetexte, verständliche Fehlermeldungen, Formate/Beispiele und jederzeit sichtbare Hilfekontakte; mit Menschen mit kognitiven Einschränkungen testen. |
| **P2** | Drittsysteme / WebAdmin | Externe Karten, Login-Dienste, Zahlungsanbieter und separate Web-/Admin-Oberfläche benötigen eigene Prüfung. Nicht durch die native Prüfung abgedeckt. |

## Konkreter Testplan für zwei Geräte

1. **iPhone:** Einstellungen > Bedienungshilfen > VoiceOver aktivieren. Ausschließlich mit Wisch-/Doppeltipp-Gesten Anmelden, KI fragen, Familie finden, Kontakt schreiben, Basar suchen, Anzeige bearbeiten, Karte/Ort vorschlagen, Profil/Datenschutz und Melden durchlaufen. Überschriften und aktuelle Auswahl ansagen lassen.
2. **Android:** TalkBack aktivieren. Gleiche Aufgaben prüfen; Schalter, Eingabefelder, Zustandsmeldungen und WebView/Listen-Fallback besonders kontrollieren.
3. **Große Schrift:** Auf beiden Geräten größte praktikable Schrift (mindestens 200 % in App-Einstellungen) wählen. Keine verdeckten Schaltflächen, abgeschnittenen Beschriftungen oder unbedienbaren Bildschirmbereiche zulassen.
4. **Motorik:** „Nur Tastatur“/Switch Control, Voice Control, Touch mit großer Zielgenauigkeit; alle Kernfunktionen ohne Pinch-Zoom und präzise Bildtipps bedienen.
5. **Visuell:** Kontrast, Fokuszustände, leere Ansichten, Fehler, Dark Mode/Systemfarbpräferenzen und Hochformat auf kleinen Bildschirmen überprüfen.
6. **Reale Testpersonen:** Mindestens eine Person mit Screenreader-Erfahrung und eine Person mit motorischer/kognitiver Einschränkung einbeziehen. Probleme je Screen mit Reproduktionsschritten dokumentieren.

## Freigabekriterium

Keine Aussage „vollständig barrierefrei“, solange P0-Prozesse nicht vollständig auf realen Geräten erfolgreich getestet sind. Automatische CI-Checks sichern nur technische Verträge, nicht die tatsächlich wahrgenommene Bedienbarkeit. Änderungen bei KI-/Marketplace-Modulen lösen erneute Prüfung aus.

## Referenzen

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WCAG2ICT: https://www.w3.org/TR/wcag2ict/
- BFSG: https://www.gesetze-im-internet.de/bfsg/
- Bundesfachstelle Barrierefreiheit: https://www.bundesfachstelle-barrierefreiheit.de/
