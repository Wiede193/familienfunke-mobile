# Familienfunke: Kistenmodus – Einfachheit als Abnahmekriterium

Die App soll Eltern Arbeit **abnehmen**, nicht zusätzliche Entscheidungen abverlangen.

## Standardablauf (höchstens drei Schritte)

1. **Foto:** Ein Foto aufnehmen oder wählen und auf freiwillige Analyse tippen. Nur die aktuelle Fotogruppe ist sichtbar. Bereits erfasste Kleidung bleibt erhalten.
2. **Kurz prüfen:** Artikelname, Farbe und nur gesicherte Größen sehen. Falsches über „Angaben ändern“ korrigieren. Unbekannte Größen bleiben **offen**, keine Pflicht zum Etikettfoto. Primäre Weiter-Taste führt zum Paketvorschlag.
3. **Paket:** Maximal **drei** einfache, regelbasierte Vorschläge, ein Tipp wählt ein Paket. Individuelle Auswahl bleibt unter „Auswahl selbst zusammenstellen“. Im Abschlussformular: ein zutreffendes Foto, Gesamtpreis, tatsächlicher Zustand, bekannte Mängel, Ort und einmalige Verkäuferbestätigung.

## Was im Normalfall NICHT zu sehen ist

- Gruppenfilter, Standort-Vorgabe für weitere Entwürfe, Sammelgrößen, manuelles Hinzufügen, Einzelverkauf und Bilderrahmen-Korrektur sind eingeklappte **optionale** Funktionen
- Bearbeitungen von Marken, Mustern und Materialien nur nach bewusstem Öffnen eines Artikels
- Keine erzwungene KI-Texterstellung, keine automatisch behaupteten Größen oder Preisempfehlungen
- Keine zusätzliche Warnungsbestätigung, nur weil die Größe auf dem Foto nicht erkennbar ist
- Kisten mit über zehn Stücken zeigen zunächst nur zehn Zeilen; weitere Artikel auf Nachfrage

## Leitlinien für künftige Änderungen

- **Ein Ziel pro Bildschirm.** Keine neue Einstellung im Standardablauf, solange sie nicht zwingend für den Verkauf nötig ist
- **Höchstens drei Paketvorschläge** und keine nicht belegte Saison-/Alter-/Größenzuordnung
- **Keine zweite Eingabe** für bereits bekannte Fakten; Käuferansicht bleibt ein kurzer Steckbrief
- **Fehler verzeihend:** Unbekannte Größen erlauben, Kiste lokal speichern, Anzeigen-ID bei Unterbrechung wiederverwenden
- **Sicherer Verkauf:** Foto und Mängel vom Verkäufer bestätigen lassen; serverseitige Moderation unverändert
- **Datenschutz:** Fotoerkennung nur nach ausdrücklicher Auslösung, Entwürfe/Fotokopien standardmäßig lokal

## Vor jedem weiteren Ausbau prüfen

- Kann eine neue Person ein Paket ohne Erklärung anlegen?
- Wie viele Entscheidungen trifft sie bis zur Anzeige? Ist jede davon notwendig?
- Kann eine ungenaue KI-Angabe ohne Fachwissen korrigiert werden?
- Werden beim Zurückgehen oder Schließen bereits erfasste Daten bewahrt?
- Bleibt bei einem fehlenden Etikett der Verkauf möglich?
- Sind die Kernfunktionen auf einem iPhone ohne horizontales Umhersuchen erreichbar?

Wiederholbare Regelprüfungen: `npm run check:box-ux`. Zusätzlich sind echte iOS-/Android-Tests mit Fotos (1, 6, 10, 30 Teile; Überlappung, unscharfes Bild, unbekannte Größe, Teilpaket, App-Neustart) **vor öffentlichem Rollout notwendig**.
