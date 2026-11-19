# Familienfunke: Familienausflüge und lokale Aktivitäten (Beta)

Stand: 19.11.2026. Implementiert ausschließlich auf dem Branch `design/profil-momente-benachrichtigungen`, nicht in `main` übernommen.

## Neue Ansicht im Familienkalender
- Registerkarten **Gemeinsame Treffen** (bisherige Terminliste) und **Ausflugsideen**.
- Zwölf allgemeine Familienaktivitäten, z. B. Spielplatz, Bibliothek, Museum, Wald, Schwimmbad, Bauernhof, Fahrradtour.
- Filter nach Altersgruppe, drinnen/draußen und grobem Budget. Altersangaben sind redaktionelle Orientierung, keine medizinische oder sicherheitsrechtliche Eignungsprüfung.
- Freiwillige Eingabe einer groben Stadt/Region ohne Live-GPS.
- **Orte suchen:** öffnet nach bewusstem Antippen eine neue Suche auf OpenStreetMap für die gewählte Kategorie und Region. Es findet ohne Benutzeraktion keine externe Ortsanfrage statt; keine ungeprüften Adressen, Öffnungszeiten, Preise oder Plätze werden in der App als Fakten angegeben.
- **Treffen planen:** übernimmt Idee, Beschreibung und Region in das **bestehende** Terminformular. Datum muss manuell gewählt werden. Bestehende Moderations- und Freigabeschritte bleiben unverändert.
- Vor Einreichen eines Community-Termins bleibt die erforderliche Profilfreigabe vorgeschrieben.
- Keine neuen Supabase-Tabellen, persönlichen Datenfelder, externen Karten-SDKs oder nativen Bibliotheken.

## Grenzen
- Die App liefert **noch keine live verifizierte Liste konkreter Spielplätze** oder Betreiber. Für solche Listen sind geprüfte Datenquellen, Zuständigkeitsprüfung, Aktualisierung der Öffnungszeiten und gegebenenfalls Einbindung in eine Kartenansicht nötig.
- „Meist kostenlos“ und „Eintritt möglich“ sind nur grobe Kategorien, keine Preiszusage.
- Nicht für ein öffentliches Release freigegeben, bevor iOS-/Android-Test und Datenschutzprüfung abgeschlossen sind.

## Qualitätscheck
- Ausflugsideen anzeigen, Altersfilter wechseln, Budgetfilter wechseln.
- Kartensuche nur nach freiwilliger Eingabe einer Region auslösen; ohne Region soll ein verständlicher Hinweis erscheinen.
- „Treffen planen“ öffnet ausgefülltes Terminformular, ohne es automatisch zu veröffentlichen; Datum fehlt absichtlich.
- Vorherige Veranstaltungen, Kontaktanfragen, Fotoansichten und Familien-Kompass bleiben erreichbar.
