# Familienkarte – Vektorkarte und familienfreundliche Orte

## Technische Entscheidung
- `react-native-webview` 14.0.1 ist im Expo SDK 58 / Expo Go enthalten; die Vektorkarte wird mit MapLibre GL JS 6.16.0 in einer WebView gerendert.
- Kartenstil: `https://tiles.openfreemap.org/styles/liberty`. OpenFreeMap liefert OpenStreetMap-basierte **Vektorkacheln**.
- Das Widget lädt externe Skripte über jsDelivr und benötigt Internet; die Ortsliste bleibt als Fallback verfügbar.
- Offizielle Infos: https://docs.expo.dev/versions/v58.0.0/sdk/webview/ , https://openfreemap.org/quick_start/ , https://openfreemap.org/tos/
- Kartennachweis muss sichtbar bleiben (im MapLibre-Widget eingebaut). Bei Offline-Nutzung und höherem Betrieb die geltenden Nutzungsbedingungen beachten.

## Ortsdaten
- `ff-family-map-search` ist eine authentifizierte Supabase Edge Function, die nach **explizitem Klick** POI-Daten aus OpenStreetMap/Overpass in einem **festen 4,5-km-Radius** abfragt. Keine Suche über die gesamte Republik; keine automatische Ortung des Geräts.
- Tags: `leisure=playground`, `amenity=restaurant|cafe` mit `changing_table=yes|limited`, `tourism=zoo|museum|attraction`. Das sind Rohdaten, **keine von Familienfunke geprüften Empfehlungen**.
- `changing_table=yes` steht für eine angegebene Wickelmöglichkeit. Fehlende Tags bedeuten *unbekannt*, nicht *nein*.
- Überpass-Server: https://overpass-api.de/ ; Nutzung nach Fair-Use-Regeln. https://dev.overpass-api.de/overpass-doc/en/preface/commons.html . Die öffentlichen Overpass-Instanzen sind **keine skalierbare Produktionsdatenbank**. Vor großem öffentlichen Rollout ein gecachtes, regelmäßig importiertes OSM-Dataset oder einen passenden kommerziellen Datenanbieter einsetzen.
- Ein fehlgeschlagener Aufruf darf keine falschen Orte anzeigen. Es gibt keine übermittelte Live-GPS-Position.

## Vorschläge aus der Community
- `public.ff_family_places` speichert Vorschläge mit Name, Kategorie, Beschreibung, ungefährer Region, Kartenkoordinate und optionaler Wickeltischangabe.
- Ausschließlich freigegebene erwachsene Mitglieder dürfen Vorschläge schreiben (RLS, `private.is_active_adult`).
- `moderation_status` ist bei Anlage immer `pending`. Mitglieder haben keine öffentlichen UPDATE- oder DELETE-Rechte und können ihre eigenen Vorschläge **nicht selbst freigeben**.
- Leser sehen nur freigegebene Vorschläge und gegebenenfalls ihre **eigenen** wartenden Einträge.
- Der Client führt vor dem Speichern die bestehende Textprüfung aus. Die finale Freigabe erfolgt über einen vertrauenswürdigen, später zu vervollständigenden Betreiberworkflow.
- Fotos, Bewertungssysteme, Nutzer-GPS, automatische Moderation der Beiträge und Streckenplanung sind noch nicht implementiert.
- **Keine privaten Wohnadressen und keine Standorte von Kindern öffentlich eintragen.**

## Testpunkte
1. Auf iOS/Android erscheint eine vektorbasierte Deutschlandkarte mit OSM-Attribution (WebGL in WebView); falls externe Dienste ausfallen, bleibt die App bedienbar.
2. Stadt wählen, „Hier nach Orten suchen“ – vorhandene OSM-Spielplätze / Restaurants mit ausgewiesenem Wickeltisch / Ausflugsziele werden auf der Karte und in der Liste angezeigt.
3. Filter verändern Pins und Listen; Marker tippen führt zur richtigen Detailkarte.
4. Map-Tap bei geöffnetem Vorschlagsformular markiert ausschließlich eine Koordinate auf der Karte.
5. Neuer Vorschlag bleibt `pending` und ist ausschließlich für Ersteller sichtbar.
6. Anonymer Nutzer, nicht verifizierter Nutzer, Fremder und gefälschter Approved-Status dürfen keine Vorschläge veröffentlichen.
7. Statische Tests und Bundles ersetzen keinen Praxistest im echten WebView.

## Nächste Etappe
- Serverseitiges Overpass-Caching, nachhaltiger OSM-Import und Retry/Rate-Limits;
- Erfassung / Korrektur besonderer Merkmale (barrierefrei, Schatten, Toilette);
- eigener Moderatorbereich für die Prüfung neuer Orte und Korrekturmeldungen;
- Datenschutzprüfung der externen Karten- und Ortssuchdienste vor öffentlichem Launch.
