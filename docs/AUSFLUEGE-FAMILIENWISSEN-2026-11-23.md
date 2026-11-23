# Ausbau: Familienausflüge, Freizeitangebote, Familienwissen
**Redaktioneller Quellenstand:** 23. November 2026.

## 1. Brandenburg-Ausflugsziele

`FamilyMapBrandenburg.js` enthält jetzt 32 redaktionell ausgewählte Brandenburg-Ziele und ist bytegleich mit dem serverseitigen Assistentenkatalog. Davon sind 14 neue, nicht bereits in der lokalen Grundsammlung enthaltene Einträge:
- Naturpark/Erlebnispfade: Schweizer Haus Buckow, Familien-Naturerlebnispfad „Abenteuer mit Stobbi“, Naturparkzentrum Hoher Fläming, NaturParkHaus Stechlin, Wildpark Schorfheide, Wildpark Johannismühle, Naturschutzzentrum Krugpark.
- Familienbäder: schwapp Fürstenwalde, SaarowTherme Bad Saarow (wichtige Freitags-/Samstags-Altersbegrenzung), TURM ErlebnisCity Oranienburg.
- Indoor: Scharmützelbob-Duellarena in Bad Saarow/Petersdorf, MYKIDSLAND Frankfurt (Oder), Fitolino Eberswalde.
- Gastronomie & Spielplatz: Wildparkbistro Kobel – Betreiber bestätigt ausdrücklich Terrasse unmittelbar neben dem Spielplatz.

Die **bereits** in `FamilyMapCurated.js` enthaltene Einrichtung Naturparkhaus Schlaubetal wurde wegen Dublettengefahr nicht nochmals in die Brandenburg-Liste übernommen.

### Neue offizielle Quellen für gezielte Familienangebote

| Typ | Ziel | Quelle |
|---|---|---|
| Hallen-/Erlebnisbad | schwapp | https://www.fuerstenwalde-spree.de/verzeichnis/visitenkarte.php?mandat=126651 |
| Therme | SaarowTherme | https://www.saarowtherme.de/besucherinformation |
| Erlebnisbad | TURM ErlebnisCity | https://www.erlebniscity.de/sport-und-erlebnisbad |
| Indoorspielplatz | Duellarena | https://www.scharmuetzelbob.de/attraktionen/duellarena/ |
| Indoorspielplatz | MYKIDSLAND | https://mykidsland.de/kontakt-anfahrt/ |
| Indoorspielplatz | Fitolino | https://fitolino.de/preise-oeffnungszeiten/ |
| Restaurant & Spielplatz | Wildparkbistro Kobel | https://wildpark-frankfurt-oder.de/index.php/de/wildparkgastronomie-kobel |
| Familienerlebnis | Schweizer Haus | https://www.maerkische-schweiz-naturpark.de/themen/naturpark-maerkische-schweiz/besucherzentrum-schweizer-haus/ |
| Naturerlebnisroute | Abenteuer mit Stobbi | https://www.maerkische-schweiz-naturpark.de/themen/routen-touren/abenteuer-mit-stobbi/ |
| Naturparkzentrum | Hoher Fläming | https://www.hoher-flaeming-naturpark.de/erleben-lernen/info-ausstellung/naturparkzentrum-hoher-flaeming-am-fuss-der-burg-rabenstein/ |
| Naturparkzentrum | NaturParkHaus Stechlin | https://www.stechlin-ruppiner-land-naturpark.de/themen/ausflugsziele-erlebnisse/naturparkhaus-stechlin/ |
| Wildpark | Schorfheide | https://www.gemeinde-schorfheide.de/startseite/wirtschaft-tourismus/freizeit-tourismus/wildpark-schorfheide |
| Wildpark | Johannismühle | https://www.wildpark-johannismuehle.de/besuch-planen/ |
| Naturzentrum | Krugpark | https://www.stadt-brandenburg.de/leben/umwelt-und-naturschutz/krugpark |

**Ausschluss aus Qualitätsgründen:** Bambooland Wildau wird nicht als geöffnetes aktuelles Familienziel übernommen; zeitnahe Meldungen zeigen eine Schließung und widersprüchliche alte Einträge. Ebenso werden keine Ferienprogramm-Datumsangaben als dauerhafte Öffnungszeit erfunden.

### Qualitätskennzeichnung
- **Barrierefreiheit:** `documented` nur für konkret nachweisbare Teilmerkmale. Sonst `unknown` – nicht gleichbedeutend mit „nicht barrierefrei“.
- **Badetag:** SaarowTherme freitags und samstags laut Anbieter erst ab 16 Jahren. Das ist kein normaler Tipp für kleine Kinder an diesen Tagen.
- **Gastronomie:** „Kobel“ ist ein Bistro **mit angrenzendem Außenspielplatz**, kein belegter Indoor-Kinderspielraum. Restaurantöffnung kann von Parköffnung abweichen.
- **Standorte:** Koordinaten dienen der Orientierung. MYKIDSLAND-Straßenmarkierung und Bistro-Kobel-Parkbereich sind keine zugesicherten exakten Eingangspins; navigationsrelevante Anbieteradresse gegenprüfen.
- **Kosten / Verfügbarkeit / Anmeldungen:** Keine zeitstabilen Preise, Alters-/Größenlimits oder Einlassgarantien ohne frische Betreiberinformationen.
- Die neue Kategorieauswahl `BRANDENBURG_FAMILY_FOCUS` lässt die Brandenburg-Tipps nach Baden/Therme, Indoor, Essen & Spielen, Natur & Tiere und Entdecken durchsuchen; die restlichen Kartenpunkte bleiben bestehen.

## 2. Veranstaltungen und Feiertage
Vier zusätzliche **einzeln datierte** Familienveranstaltungen wurden in die bereits bestehende Supabase-Tabelle `ff_official_family_events` übernommen:
- Bilderbuchkino Stadtbibliothek Eberswalde, 26.11.2026 16:30–17:00, Kinder 3–6 Jahre.
- Bilderbuchkino Stadtbibliothek Eberswalde, 17.12.2026 16:30–17:00, Kinder 3–6 Jahre.
- Weihnachtsmarkt im Brandenburgischen Viertel Eberswalde, 13.12.2026 14:00–18:00, ausdrücklich mit Bastelangeboten.
- Kindertheater „Der Weihnachtselch“, Frankfurt (Oder), 13.12.2026 10:00.

Städtische Quelle: https://www.meineberswalde.de/veranstaltungen.html
Offizielles Tourismusportal: https://www.reiseland-brandenburg.de/veranstaltung/seenland-oder-spree/der-weihnachtselch/

Eine zusätzliche **virtuelle Feiertage-/Ferien-Auswahl** im Kalender filtert öffentlich bestätigte Termine über Titelbegriffe, nicht über ein Werbeangebot. Sie erfindet keine jährlichen Wiederholungen, und allgemeine Kunst-/Erwachsenenveranstaltungen bleiben ausgeschlossen. Automatischer Quellenimport bleibt redaktionell freigabepflichtig.

## 3. Neue Familienratgeber
In `FamilyTopicsKnowledge.js` 11 neue redaktionelle Ratgeber, in `FamilyTopicsSection.jsx` direkt im Familien-Wegweiser: Kinderzuschlag, Bildung und Teilhabe, Wohngeld, Kita-Platzsuche, Unterhaltsvorschuss, Trennung/Umgangsberatung, Frühe Hilfen/Familienhebammen, Familienmedienalltag, Kleinkindschlaf, Erziehungsberatung, psychische Gesundheit von Kindern.

Jeder Artikel hat nachvollziehbare Originalquellen (Bundesfamilienportal, NZFH, Gesundheitsportal des Bundes, Bundesinstitut für Öffentliche Gesundheit), mindestens vier konkrete Handlungsschritte, Zuständigkeit, mögliche Unterlagen und begrenzende Hinweise. **Kein verbindlicher Leistungsrechner, kein Diagnoseverfahren und keine gespeicherten persönlichen Gesundheitsangaben.** Links und Gesetzeslage regelmäßig überprüfen.

## 4. Noch nicht geleistet
- Keine deutschlandweite Vollerfassung sämtlicher Restaurants, Thermen oder Familienveranstaltungen.
- Kein automatisch zentraler Quellenfeed für alle Bundesländer, keine vollständige Lizenz für touristische Datenbanken.
- Keine automatische Werbung, Provisionen oder bezahlten Empfehlungen.
- Keine realen Gerätetests für jede Darstellung, keine Garantie aller tatsächlichen Betriebszeiten / Barrieren.
- Eingehende nicht verifizierte Empfehlungen stehen nicht automatisch im Kalender.
