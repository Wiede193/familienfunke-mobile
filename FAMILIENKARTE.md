# Familienkarte – Vektorkarte und familienfreundliche Orte

## Kuratierte Orte: Pilotregion Oder-Spree (November 2026)
- In `FamilyMapCurated.js` sind zehn **redaktionell recherchierte** Orte als statischer Anfangsbestand enthalten. Diese benötigen weder einen Community-Upload noch eine vom Nutzer frei manipulierbare `moderation_status`-Freigabe.
- Nach Öffnen der Karte erscheinen ihre Marker und eine horizontale Liste mit Kurzbeschreibung, Region und Kartensprung. „Auf Karte“ fokussiert den regionalen Kartenausschnitt; die Ortsdetails verlinken zu offiziellen Informationsseiten.
- Die kuratierten IDs sind stabil, z. B. `curated-irrlandia`. Bekannte `osm_key`-Kennungen vermeiden Dopplungen bei Overpass-Suchen.
- Die Kategorien `outing` bzw. `playground` sind gesondert filterbar. Es sind KEINE Wickeltische, vollständige Barrierefreiheit, Kosten, Öffnungszeiten oder aktuelle Verfügbarkeit behauptet. Fehlende Wickeltischangaben bedeuten **unbekannt**, nicht „Nein“.
- Landkreis Oder-Spree: IRRLANDIA (Storkow), Burg Storkow / Besucherzentrum, Binnendüne Waltersberge, Scharmuntzelland (Wendisch Rietz), Heimattiergarten Fürstenwalde, Wettermuseum Lindenberg, Burg Beeskow und Naturparkhaus Schlaubetal.
- Nahe Umgebung außerhalb des Landkreises: Wildpark Frankfurt (Oder), Ziegenwerder mit Spielplatz (Pin bezeichnet den Parkbereich, nicht die einzelne Spielanlage).
- Geokoordinaten stammen aus den amtlichen Naturpark-Seiten (Besucherzentrum, Naturparkhaus, Waltersberge) oder dokumentierten OSM-Karteneinträgen; Ortsbeschreibung und Existenz wurden mit den jeweiligen offiziellen Betreiber-/Tourismusseiten abgeglichen.
- Quellen, zusätzlich zu den direkt im Code hinterlegten `info_url`-Adressen:
  - https://www.dahme-heideseen-naturpark.de/themen/ausflugsziele-erlebnisse/besucherzentrum-burg-storkow-mark/
  - https://www.natur-brandenburg.de/themen/ausflugsziele-erlebnisse/aussichtspunkt-binnenduene-waltersberge/
  - https://www.schlaubetal-naturpark.de/themen/ausflugsziele-erlebnisse/naturparkhaus-schlaubetal/
  - https://mapcarta.com/W800937029 (IRRLANDIA)
  - https://mapcarta.com/W825399584 (Scharmuntzelland)
  - https://mapcarta.com/W168737334 (Heimattiergarten)
  - https://mapcarta.com/N1794101250 (Wettermuseum)
  - https://mapcarta.com/36746242 (Burg Beeskow)
  - https://mapcarta.com/W69221883 (Wildpark)
  - https://www.frankfurt-slubice.eu/de/poi/102709/ziegenwerder
- Diese Startdaten sind unabhängig von Overpass-Suchverfügbarkeit und erscheinen auch dann, wenn der Overpass-Endpunkt eine Fehlermeldung liefert. Die Karten-Vektorkacheln selbst benötigen weiterhin Internet.

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
