# Familienfunke – „In deiner Nähe“: Tinder-ähnliche Familiensuche (Beta)

**Stand:** 19. November 2026  
**Entwicklungsbranch:** `design/profil-momente-benachrichtigungen` (keine Veröffentlichung nach `main`).

## Nutzererlebnis

Unter **Entdecken** stehen zwei Bereiche zur Auswahl: **„In deiner Nähe“** (Kartenansicht) und **„Familienliste“** (bisherige Matching-Ansicht).

- Eine große Karte je freigegebener Familie mit Profilname, freiwilliger grober Region, Vorstellung, gemeinsamen Interessen und grober Entfernung.
- Nach **links wischen** beziehungsweise **„Weiter“**: nächste Karte. Nach **rechts wischen** beziehungsweise **„Kennenlernen“**: bestehende Kontaktanfrage senden.
- **Es gibt keine automatisch geöffneten Chats.** Die Empfängerfamilie muss die Anfrage zuerst akzeptieren. Bestehende Kontakte beziehungsweise bereits eingegangene Anfragen führen zur passenden bisherigen App-Funktion.
- Suchradius: **10 / 25 / 50 / 100 km**. „bis 10 km“, „10–25 km“, „25–50 km“ oder „50–100 km“ sind grobe Gruppen, keine genauen Entfernungen.
- Die bisherige Familienliste, Interessenfilter und Profilansicht bleiben erreichbar.

## Datenschutz- und Sicherheitsarchitektur

- Die App verlangt **keine Geräteortungsfreigabe** und fragt keine GPS- oder Straßenkoordinaten ab.
- Um die Nähe-Suche ausdrücklich zu aktivieren, wird **freiwillig eine deutsche fünfstellige Postleitzahl** eingegeben. Diese wird in der App **offline** über `data/plzCentersGermany.js` in einen grob gerundeten Mittelpunkt umgerechnet. Die PLZ wird nicht in der Supabase-Tabelle gespeichert, nicht über eine öffentliche Geocoding-API abgefragt und nach Nutzung aus dem Eingabefeld entfernt.
- Auf dem Server wird im gesperrten Schema `private` ausschließlich ein ungefährer PLZ-Gebietsmittelpunkt (**ganzzahlige Koordinaten mit 0,01-Grad-Genauigkeit**) pro Opt-in-Konto gespeichert. Die ungefähren Koordinaten werden über RLS und fehlende direkte Tabellenrechte vor normalen Nutzern verborgen.
- Nur **freigegebene, erwachsenengeprüfte, sichtbare, nicht gesperrte Profile**, die die Nähe-Suche **beide freiwillig aktiviert** haben, werden abgeglichen. Wechselseitig blockierte Nutzer sind ausgeschlossen.
- `public.ff_nearby_status()`: eigenen Opt-in-Status lesen. `public.ff_set_nearby_location(...)`: eigene Einstellung über authentifizierten RPC aktivieren oder löschen. `public.ff_nearby_families(10|25|50|100)`: bis zu 60 IDs mit Distanzband; **keine** Koordinaten, Postleitzahlen oder exakten Kilometerwerte. Alle öffentlichen RPCs sind für `anon` gesperrt.
- **Opt-out löscht den gerundeten Standort sofort.** Auch wenn die allgemeine Profilsichtbarkeit ausgeschaltet wird, entfernt ein Datenbank-Trigger den Nähe-Standort automatisch. Neuerlich sichtbar schalten aktiviert die Nähe-Suche nicht automatisch.
- Standortwechsel sind auf maximal einmal in **24 Stunden** begrenzt, um wiederholte Standortabfragen zu erschweren. Ein gesonderter privater Datensatz speichert den Zeitpunkt der letzten Standortänderung für den Missbrauchsschutz; er enthält keine PLZ und keine Standortkoordinaten. Abschalten ist jederzeit möglich, aber sofortiges Wiederaktivieren beziehungsweise Ändern kann aufgrund der Wechselbegrenzung erst später möglich sein.
- Die visuellen Profilfotos stehen weiterhin nur nach den bestehenden Foto-Freigaben und Storage-RLS zur Verfügung. Nicht verbundene Familien sehen gegebenenfalls eine neutrale Kartengrafik anstelle eines privaten Fotos.

**Wichtig:** Die Methode gewährleistet keine absolute Anonymität. Aus mehrfachen groben Entfernungshinweisen, künstlichen Testkonten, absichtlich falsch angegebenen PLZ oder mit persönlichen Angaben kombinierten Daten könnten Rückschlüsse entstehen. Vor einer breiten öffentlichen Freigabe sind unabhängige Datenschutzprüfung, Missbrauchstests und gegebenenfalls zusätzliche standortbasierte Anti-Probing-Maßnahmen erforderlich. „Tinder-ähnlich“ beschreibt ausschließlich die Bedienung, nicht Dating mit Minderjährigen.

## Geodatenquelle und Lizenz

PLZ-Mittelpunkte: WZB / Markus Konrad, Januar 2019, **Apache-2.0**, siehe `docs/PLZ-KOORDINATEN-LIZENZ.md` und `licenses/PLZ-Apache-2.0.txt`.

Die Daten wurden auf zwei Nachkommastellen gerundet. Sie sind veraltet und liefern nur **Näherungswerte**, insbesondere in großen ländlichen PLZ-Gebieten.

## Implementiert

- `components/NearbySwipe.jsx`: Karten, optionale PLZ-Eingabe, Opt-in-/Opt-out-Steuerung, 4 Radien, Wischgesten und Kontaktanfragen
- `data/plzCentersGermany.js`: 8.298 lokal auflösbare PLZ-Gebietsmittelpunkte (keine Internetabfrage)
- `App.jsx`: eingebauter Nähe-Reiter; bisherige Familienliste bleibt erhalten
- `tests/nearbyPostcodes.test.cjs`: Offline-Lookup- und Formatprüfung
- Supabase: `private.ff_nearby_locations` mit RLS; drei authentifizierte RPCs, Einschränkung der Standortwechsel und automatischer Lösch-Trigger
- GitHub-Migrationen: `supabase/migrations/20261119_nearby_optin_discovery.sql`, `20261119_nearby_rpc_column_hotfix.sql`, `20261119_nearby_profile_hide_cleanup.sql` und Migration zur Standortwechselbegrenzung

## Verifikation

1. Supabase-Migrationen erfolgreich angewendet; private Standorte haben RLS und **keine** direkten INSERT-/SELECT-Rechte für `authenticated`; die Nähe-RPCs sind nur für authentifizierte Nutzer aufrufbar.
2. Positiver SQL-Test mit **zwei freigegebenen Profilen innerhalb einer ROLLBACK-Transaktion**: eine Familie im 10-km-Radius gefunden; nach dem Ausschalten keine Treffer mehr.
3. Erster Datenbanktest deckte einen mehrdeutigen Spaltennamen auf; Fehler behoben und positiver Test danach bestanden.
4. Zusätzlicher zurückgerollter Test: Profilsichtbarkeit auf „aus“ setzen löscht den zugehörigen Nähe-Standort automatisch.
5. Es wurden keine realen Test-Opt-ins dauerhaft gespeichert. Beim letzten geprüften Datenbankstand waren **0 Konten** für die Nähe-Suche angemeldet.
6. GitHub prüft Code/Tests sowie iOS-/Android-Bundles automatisch. Ein tatsächlicher Test der neuen Interaktion mit Expo Go auf dem iPhone steht noch aus.

## Vor Produktivstart notwendig

- Freigabe-/Sichtbarkeits- und Blockierungsfälle mit zwei echten Testkonten und App-Oberfläche vollständig prüfen
- Abgleich aller Servermeldungen (Cooldown, fehlende Freigabe, Ausfall) mit der Oberfläche
- Missbrauchsprävention, Rate-Limiting der Such-RPCs, rechtliche Datenschutzhinweise, Datenlöschkonzept und Schutz vor Standort-Rückschlüssen überprüfen
- Kartenbewegungen, Bedienhilfen und geringe Bandbreiten auf Android und iOS testen
- Nach erfolgreichem Test gesondert in `main` übernehmen
