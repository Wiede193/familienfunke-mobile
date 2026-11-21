# Generationenfreundliches Familienfunke – Konzept und Review (21.11.2026)

## Befund und Umfang
Bestandsaufnahme des Repository-Hauptbranches db9ca2e: zentrale App.jsx mit etwa 2.400 Zeilen, gemeinsames Farbtheme, fünf Haupttabs und umfangreiches Zusatzmenü. Vorhandene statische Prüfungen, Barrierefreiheits- und Sicherheitsdokumentation sind eine gute Grundlage, ersetzen keine Geräte- oder Sicherheitsprüfung. Diese Änderung verbessert Schrift und sichtbare Profilnavigation; keine Backend- oder Produktionsänderung.

## Zielbild
- Einheitliches UI, keine getrennte Senioren-App. Option „Größere Schrift & einfache Ansicht“ freiwillig, unabhängig vom Alter; Systemschrift und Screenreader immer respektieren.
- Hauptnavigation: Start, Flohmarkt, Kontakte, Ausflüge (Karte, Planer, Wegweiser), Familie/Mein Bereich. Bestehende Routen bis zu einem getesteten Umbau beibehalten. Menü oben rechts für Einstellungen, Hilfe und weitere Bereiche.
- Gelb als Markenakzent, Creme als Hintergrund, dunkles Petrol für primäre Aktionen; kein kontrastarmes Glasdesign. Einheitliche verständliche Symbole plus Text; keine ausschließlich gestenbasierte Bedienung.
- Kernaufgaben 1–3 Schritte; Formulare in Abschnitte teilen, Entwürfe speichern, Bearbeiten und Löschen sichtbar; irreversible Aktionen bestätigen, sonst rückgängig anbieten.
- Erst Standard- und Großschrift-Layouts testen, dann Navigation vereinheitlichen. Ziele: WCAG 2.2 AA/WCAG2ICT, 48 logische Einheiten für Hauptaktionen, 16–18 für normalen Text, angemessener Kontrast, kein Textverlust.

## Erwachsene und Familienkreis trennen
Ein verifiziertes Erwachsenenkonto ist unabhängig von der Familienbeziehung. Rollenwahl kann mehrere Beziehungen umfassen (Elternteil, Großelternteil, weitere Bezugsperson); keine Altersannahme, keine selbst vergebene Sorgerechtsrolle. Freiwillige persönliche Freigaben und Kontakte zwischen Erwachsenen (mit Opt-in, Annahme, Blockierung) bleiben unabhängig von den Sorgeberechtigten. Kein öffentliches Kinderprofil, kein Kontakt zu Kindern, kein exakter Standort. Kaufkommunikation bleibt artikelbezogen. Optionaler Filter „Andere Großeltern kennenlernen“, nicht verpflichtend.

Eltern/Sorgeberechtigte verwalten einen ausschließlich privaten Familienkreis. Großeltern können unabhängig einkaufen, öffentliche Ausflugsziele suchen und private Planungsentwürfe erstellen. Eine Einladung verbindet erst nach Annahme und autorisierter Freigabe beide Konten mit dem Familienkreis. Ohne Freigabe keine Kinderdaten. Ein Vorschlag für einen gemeinsamen Ausflug ist keine Zustimmung zur Teilnahme des Kindes; Freigabe je Ereignis, insbesondere bei externen Teilnehmern. Sorgeberechtigte können Freigaben beschränken oder zurückziehen; kein Recht auf private Erwachsenen-Chats.

Kinderfotos: bestehende Beta-Regel (keine Kinderfotos) beibehalten; erst nach Einführung serverseitiger Quarantäne, privaten Buckets, transparenter Zweck-/Empfängerauswahl, nachvollziehbarer Autorisierung aller nötigen Sorgeberechtigten und altersgerechter Beteiligung des Kindes prüfen. Kein Teilen nach außen, keine Werbung/öffentlichen Kinderbilder. Keine KI-Gesichtserkennung zur Bestimmung der Identität/Verwandtschaft. Moderation kanalübergreifend (auch Flohmarkt/Chat). Keine Garantie gegen Screenshots oder externe Weitergabe.

## Individualisierung der Oberfläche (Entwicklungsbranch)
Startseiten-Kacheln und untere Menüleiste sind individuell sortierbar, ergänzbar und ausblendbar. Start ist stets vorhanden, höchstens fünf untere Einträge. Speicherung zunächst lokal je Konto und Gerät, keine geräteübergreifende Synchronisierung. Alle Bereiche bleiben per Suche oder vollständiger Liste erreichbar. Keine Drag-Gesten erforderlich. Ein Diktierhinweis beschreibt die vorhandene Systemtastatur; eigenständige Spracherkennung ist noch nicht implementiert.

## Einheitliche Aktionen – erste Stufe
Gemeinsame Löschbestätigung für Profilfotos, private Termine, Suchaufträge und lokalen KI-Verlauf. Kalender, Suchaufträge und Profilbilder nutzen beschriftete, gut erreichbare Aktionsbuttons; keine Änderung von Datenbankrechten oder bestehender Benachrichtigungs-Löschlogik. Weitere Formulare, Kontakte und Marktplatz folgen mit separaten Tests. Bei hoher Schriftvergrößerung oder geringer Breite verteilt sich die untere Navigation auf mehrere Zeilen.

## Weiterer P2-/P1-Fortschritt
Gemeinsame UI-Grundbausteine, App-Styles und Kontaktübersicht sind eigene Module. Kontaktanfragen (Ablehnen, Zurückziehen), Blockieren und Anzeige-Abschluss verwenden einheitliche explizite Bestätigungen. Keine Kontakt- oder Inseratdaten werden ohne vorhandene serverseitige Rechte gelöscht. Optionale lokale Spracheingabe ist im Code vorbereitet; Paketinstallation, Lockfile, native Builds und Gerätetests stehen noch aus (SPRACHSUCHE.md).

## Robustere Bedienung
RAM-Entwürfe für Profil und Kalender während einer Kontositzung, ausdrückliche Warnungen bei ausgewählten Navigationswegen/Verwerfen einer Anzeige, gemeinsame Statusmeldungen, Rückgängig im Layout-Editor, einheitliche native Linien-Icons in Hauptnavigation und Menü. Bildsignierung wird in Gruppen von bis zu 100 Pfaden angefragt, ohne öffentliche URLs oder längere Gültigkeit. Das eigene Profil wird separat geladen; veraltete Ladeantworten werden ignoriert. Einzelformular-Entwürfe für neue/zu bearbeitende Inserate über App-Neustarts sind noch nicht implementiert. Keine Leistungswerte ohne auf Geräten gemessenen Benchmark.

## Kontosynchronisierung (Staging erforderlich)
Der Client unterstützt eine revisionsbasierte Synchronisierung nur der erlaubten Seiten-IDs mit einem lokalen Offline-Backup. Konflikte werden angezeigt; kein stilles Überschreiben einer anderen Geräteversion. Der SQL-Entwurf database/ff_layout_preferences.sql aktiviert RLS und beschränkt jede Zeile auf ihr Konto. Keine Anwendung auf die produktive Datenbank in diesem Branch. Neue Einzelanzeigen behalten jetzt Textentwürfe in der Kontositzung, nicht Fotos; bestehende Anzeigen sind nur mit Verwerf-Warnung abgesichert. Eine dauerhafte Speicherung personenbezogener Entwürfe erfordert eine separate verschlüsselte Speicherlösung und Tests.

## Backend-Entwurf – noch nicht implementiert
Separate Entitäten für Familienkreise, Mitgliedschaften, Sorgeberechtigungsnachweise, zeitlich/versionierte Freigaben, Einladungen und Aktivitätsvorschläge. Kindreferenzen nur falls nötig, ohne öffentlichen Namen/Geburtsdatum. Einmal-Token mit Ablauf, Hash, serverseitiger Transaktion; kein Vertrauen in vom Client gesetzte Rollen. Standard: deny. RLS, Storage und RPCs prüfen identisch, Rechteentzug auch bei bestehenden Sessions, kurze signierte URL-Laufzeiten und Cache-Löschung; keine Kinderdaten in Push, KI, Suche, Telemetrie. Streitfall: sensible Freigaben pausieren, Support-Verfahren; keine Entscheidung über Sorgerecht durch App. Datenschutz-Folgenabschätzung und rechtliche Prüfung vor Launch.
 
## Abnahme
- Nicht verknüpfte Großeltern können kaufen und eigene Pläne anlegen, sehen nie fremde Kinderdaten.
- Einladung abgelaufen, fremder Account, Rollenänderung, Sperre, Widerruf, paralleler Zugriff und geteilte Sorgeberechtigung als Negativtests.
- Test auf iOS und Android mit Systemschrift 100/150/200 %, TalkBack und VoiceOver, kleinen Geräten, schlechter Verbindung; reale Eltern und Großeltern führen ohne Hilfe Kauf, Suche, Inserat, Ausflug, Profiländerung und Löschung durch.
- App.jsx schrittweise nach Features aufteilen; gemeinsame UI-Komponenten und Navigationsstack, nicht Big-Bang-Neuschreibung. Tests für jede Migration. Keine Aussage vollständiger Barrierefreiheit oder Rechtskonformität ohne unabhängige Prüfung.

## Quellen
- W3C: https://www.w3.org/WAI/older-users/
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/accessibility
- NN/g: https://www.nngroup.com/reports/senior-citizens-on-the-web/
- Systematische Übersichtsarbeit: https://pmc.ncbi.nlm.nih.gov/articles/PMC12350549/
- Deutsches Kinderhilfswerk: https://www.dkhw.de/informieren/unsere-themen/kinder-und-medien/kinderfotos-im-netz/
- Berliner Datenschutzbeauftragte: https://www.datenschutz-berlin.de/themen/medien/foto-und-videoaufnahmen/
- Vergleich eines privaten Album-Modells: https://family-album.com/privacy

## Prüfstufe 2
GitHub-Lauf 144 hat sämtliche damaligen Quellprüfungen sowie beide JS-Bundles erfolgreich abgeschlossen. Neu: SQL-Integrationstest mit realem PostgreSQL und zwei simulierten Konten, strikte Revisionsfolge und keine doppelten Layout-IDs. Konfliktauflösung erlaubt Kontoversion oder lokale Version. Sprachpaket wird in isoliertem CI getestet. Keine produktiven Datenbankänderungen.
