# Familienfunke – App-weite UX-Überarbeitung und Abnahme
Stand: 23. November 2026

## Umgesetzt im Quellcode

- **Navigation:** fünf Hauptbereiche beibehalten; aktive Hauptbereiche bleiben auch bei zugehörigen Unterseiten markiert; einheitliche Symbole; Menü mit vier Einstiegen und aufklappbaren Kategorien; horizontal versteckte Profil-Einstellungen durch zweizeilige/wrappende Auswahl ersetzt.
- **Lesbarkeit:** gemeinsame kleinere Schrift auf 14 pt und Metadaten auf 13 pt angehoben; gedämpfte Textfarbe deutlich dunkler; größere sekundäre Texte in Karte, Wegweiser, Startseite, Beschlüssen, Inklusion, Erziehung, Spielen, Kalender, Willkommen; Basiselemente und Filterchips mindestens 44 logische Pixel.
- **Startseite:** Suchfunktion und vier direkte Einstiege bleiben sichtbar, der personalisierte Ausflugsbereich bleibt im Hauptfluss; zusätzliche Basar- und Veranstaltungsfeeds über explizite Ausklappfunktion.
- **Basar:** Inserierauswahl trennt einen einzelnen Artikel vom KI-Kistenmodus; Kategorie erscheint in der Kauf-Filteroberfläche nur einmal; Kernfunktionen bleiben vorhanden.
- **Familien:** Interessenliste zunächst eingeklappt, mit vollständigem Auswahlfeld auf Wunsch; Kartenansicht in „Einzelansicht“ umbenannt, um die Verwechslung mit der geografischen Karte zu vermeiden.
- **Karte:** Suche, Kartenansicht, Kartenorte und zugängliche Ergebnisliste vor den ausklappbaren regionalen Katalogen; Barrierefreiheitshinweise und Quellstatus weiterhin sichtbar.
- **Familienwegweiser:** Ablauf und konkrete Aufgaben stehen vor den optionalen Behördenverzeichnissen; Landes- und Bundesportale sind weiterhin erreichbar.
- **Inklusion und Familienwissen:** konkrete nächste Schritte vor Hintergrundinformationen; längere Texte besser lesbar.
- **Amtliche Beschlüsse:** die drei Fragen „Was wurde entschieden?“, „Betrifft euch das?“ und „Gilt es schon?“ priorisiert. Detailquellen und Verfahrenshistorie weiterhin abrufbar; die technische Erklärung der Quelle ist einklappbar. Die allgemeine Suche klassifiziert Vermittlungsverfahren, Verkündung und Vereinbarung nicht mehr pauschal als Parlamentsbeschluss.
- **Veranstaltungs- und private Kalendereingabe:** interaktive Monats-/Tagesauswahl und häufige Uhrzeiten, mit optionaler manueller Eingabe als Fallback, ohne zusätzliche native Pakete.
- **Familienzeit:** Spielarten in schnelle Familienspiele, Rätsel/Wörter und Brett-/Kartenspiele gegliedert.
- **Benachrichtigungen:** Herkunft („Familien & Nachrichten“, „Familienbasar“, „Amtliche Informationen“) je Hinweis sichtbar.
- **Profil:** Warnung vor ungespeicherten Angaben beim Wechsel über Haupttabs, Menü, Zurück sowie Hilfe und Abmelden; berücksichtigt auch ausgewähltes Profilfoto, Bildtext und Passwort-Entwurf.
- **Anmeldung:** geschlossene Testphase als solche beschriftet; keine nicht vorhandene Registrierungsfunktion versprochen.
- **Regressionen:** eigene `tests/check-ux-sweep.mjs` neben bestehenden Integrations-, Accessibility- und Expo-Buildtests im Native-CI.

## Grenzen und zwingend ausstehende manuelle Abnahme

**Keine Behauptung vollständiger Barrierefreiheit oder fertiger Produktionsfreigabe.** Die CI-Bundles prüfen JavaScript-Paketierung, nicht gerenderte Pixel, Fokusverhalten oder echte Benutzerinteraktion. Vor einem öffentlichen Release sind mindestens folgende Durchläufe auf realen Smartphones durchzuführen:

| Priorität | Gerät/Situation | Kritische Abläufe | Abnahmekriterium |
| --- | --- | --- | --- |
| P0 | Kleines Android-Gerät (320–360 dp) | Login, alle fünf Tabs, Menü, Basar-Kauf/Verkauf, Familiensuche, Karte, Wegweiser, Kalender | Keine abgeschnittenen Pflichttexte oder überdeckten Buttons |
| P0 | iPhone | Alle o. g. Kernwege, Tastatur, Back, Modal-/Formulare | Keine unerreichbare Aktion, keine irrtümliche Navigation |
| P0 | iPhone mit VoiceOver | Anmeldung, Profil, Foto, KI-Suche, Familienkontakt, Chat, Basar, Kartenliste, Kalender, Beschluss | Korrekter Fokus, lesbare Beschriftungen, Statusankündigungen |
| P0 | Android mit TalkBack | Gleiche Wege, insbesondere Kalender, Filter, Spiele, Neuigkeiten | Ohne Kartentipp und ohne rein visuelle Bedeutung bedienbar |
| P0 | 150 % und 200 % Systemschrift | Alle Haupt- und Nebenansichten, Dialoge, Kistenmodus, Datumswähler, Header & Bottom-Tabs | Keine Textabschneidung oder unzugängliche Interaktion; insbesondere keine verdeckte Navigation |
| P1 | Große Produktfotos/fehlende Bilder | KI-Kistenmodus, Fotofreigabe, Galerie, Artikeldetails | Nutzer kann KI-Vorschläge korrigieren; Bildzusammenfassungen nicht mit echten Alternativtexten verwechseln |
| P1 | Fehlende Netzverbindung | Start, Basar, offizielle Termine, Karte, KI, Chat | Fehlermeldungen/Retry plausibel, keine erfundenen Daten oder Doppelaktionen |
| P1 | Personen mit kognitiven Einschränkungen | Erklärtexte, Statusangaben, Terminerstellung | Nächste Handlung aus der Oberfläche ableitbar; keine ungeklärten Fachbegriffe |

Das Datenschutzmodell und die serverseitige RLS-/Moderation werden durch dieses reine UI-PR nicht verändert. Vor einer allgemein zugänglichen Veröffentlichung müssen **Registrierung/Einladung, Geräte-Tests und End-to-End-Szenarien** separat freigegeben werden.
