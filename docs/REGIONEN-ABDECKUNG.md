# Familien-Kompass – Regionenabdeckung und Rechercheprozess
**Stand: 19. November 2026**

## Technischer Stand
- Auswahl: 16 Bundesländer und 401 Landkreise/kreisfreie Städte (Gebietsstand 2026).
- Zwei abhängige, durchsuchbare Auswahlfenster; Wechsel des Bundeslandes setzt den Landkreis zurück.
- Bislang werden Bundesland und Landkreis **nur für die aktuelle Ansicht** gehalten; keine Speicherung und keine Änderung bestehender Supabase-Tabellen.
- Allgemeine bundesweite Informationen erscheinen überall.
- Landes-/Kreisinformationen erscheinen nur, wenn die entsprechende Regel ausdrücklich der passenden Gebietsebene zugeordnet wurde. Keine fiktiven zuständigen Sachbearbeiter oder aus anderen Landkreisen kopierten Regeln.
- **Unrecherchiert** und **teilweise recherchiert** sind vom User erkennbar zu unterscheiden.
- Regelmäßige Aktualitätsprüfung vor Veröffentlichung erforderlich. Gesetzliche Fristen, Empfehlungen und Bearbeitungsdauer sind getrennte Arten von Angaben.

## Quellen für den Regionenkatalog
- [Bundesagentur für Arbeit: politische Gebietsstruktur, 401 Kreise und kreisfreie Städte, Oktober 2026](https://statistik.arbeitsagentur.de/DE/Navigation/Grundlagen/Klassifikationen/Regionale-Gliederungen/Politische-Gebietsstruktur-Nav.html)
- Grundliste aus [opendatalab-de/checkgermany](https://github.com/opendatalab-de/checkgermany/blob/master/frontend/src/data/landkreise.json); Grundliste war teilweise veraltet und wurde um die bekannten Kreisreformen bereinigt.
- [Statistisches Bundesamt: AGS 03159 Landkreis Göttingen](https://genesis.destatis.de/datenbank/online/statistic/11111/table/11111-0002).
- [Landesamt für Statistik Hessen: Hanau ist seit 01.01.2026 kreisfrei und hat AGS 06415](https://statistik.hessen.de/sites/statistik.hessen.de/files/2026-01/verz-2_26-01.pdf).
- Eisenach seit 2021 zum Wartburgkreis; ehemalige Kreisschlüssel entfernt.
- Daten bleiben einem jährlichen/gegebenenfalls ereignisbezogenen administrativen Gebietsabgleich unterworfen.

## Status Landkreis-/Stadt-recherche
| Gebiet/Schlüssel | Fortschritt | Enthaltene geprüfte Bereiche | Nicht abgedeckt |
|---|---|---|---|
| Bundesweit | **Startdaten** | Elterngeld, Elternzeit, Kindergeld, Geburt, Mutterschaftsleistungen, Kinderzuschlag, Wohngeld, BuT, Kita allgemein, Unterhaltsvorschuss | Individueller Anspruch, regionale Amtspersonen und Formulare |
| Bayern (09), alle 96 Kreise/Städte | **Teilweise** | Bedarfsmeldung Kita mindestens drei Monate vorher (Landesinfo), ZBFS Zuständigkeitsfinder | Lokale Kita-Verfahren und zuständige kommunale Ansprechpartner |
| Landkreis Oder-Spree (12067) | **Teilweise** | Rechtsanspruch/Bedarfsfeststellung bei Kita/Hort und empfohlener Vorlauf | Weitere regionale Leistungen, weitere lokale Antragswege |
| Landkreis Landshut (09274) | **Teilweise** | Kita/Kinderbetreuung, ZBFS Niederbayern, Bayern-Regeln | Kommunale Anmeldeprozesse der einzelnen Gemeinden und andere Leistungen |
| Stadt Landshut (09261) | **Teilweise** | ZBFS Niederbayern und Bayern-Regeln | Städtische Kita-Stellen, deren Anmeldeverfahren und weitere Leistungen |
| Alle übrigen Landkreise/kreisfreien Städte | **Offen** (mit evtl. allgemeiner Länderregel) | Bundesweite Grundlagen | Regionalspezifische Ämter, Antragswege, Unterlagen, Fristen |

### Offizielle Quellen für neue regionale Karten
- [Landkreis Oder-Spree – Bedarfsfeststellung Kita](https://www.landkreis-oder-spree.de/Service-Aktuelles/Service/Was-erledige-ich-wo-/Rechtsanspruch-auf-Kindertagesbetreuung.php?FID=2426.44.1&ModID=10)
- [Bayern – Kita und Kindertagespflege](https://www.stmas.bayern.de/themen/kindertagesbetreuung/angebote/)
- [Bayern – Rechtsanspruch bei Kita-Plätzen](https://www.stmas.bayern.de/themen/kindertagesbetreuung/gesetzliche-grundlagen/rechtsanspruch-fruehkindliche-foerderung.php)
- [Landkreis Landshut – Kindertagesstätten und Kinderbetreuung](https://www.landkreis-landshut.de/themen/kinder-jugend-und-familie/kindertagesstaetten-und-kinderbetreuung/)
- [ZBFS – Niederbayern](https://www.zbfs.bayern.de/behoerde/landesbehoerde/niederbayern/)
- [ZBFS – Zuständigkeitsfinder](https://www.zbfs.bayern.de/zustaendigkeitenfinder.php)

## Vorgehensweise für Ausbau auf alle Regionen
1. Deutschlandweit geltende Regeln (Bund) von Bundesland-spezifischen Regeln und lokalem Verwaltungsvollzug trennen.
2. Pro Land: zuständige Elterngeldstellen, Kita-Recht, Gebühren/Entlastung, ggf. ergänzende Landesleistungen und Elternportale aus offiziellen Landesquellen belegen. **Keine Fristen kopieren**.
3. Pro Landkreis und kreisfreie Stadt: offizielle Website/Serviceportal, Jugendamt, Kita/Tagespflege, ggf. Bedarfsbescheid, Antragsformulare, digitale Anträge, Ansprechpartner/Telefon nur wenn offiziell veröffentlicht. Prüfen, ob die Kommune oder der Kreis zuständig ist.
4. Regionale Regeln mit Datum, Primärquelle, rechtlichem Status (Gesetz/Empfehlung/Bearbeitungsdauer) kennzeichnen, und bei Unklarheit als ungeprüft markieren.
5. Bevor Regel in App freigegeben wird: Link und Verfahren manuell prüfen, Detailtest für 2-3 typische Familiensituationen, keine private Nutzerinformation an Dritte senden.
6. Pilot auf Familien testen, Verbesserungen übernehmen, dann systematisch weitere Kreise recherchieren. Für jeden Kreis Fortschrittsstatus offen/teilweise/vollständig sowie nächstes Prüftermin pflegen.

## Manuelle App-Tests
- Bund auswählen: alle 16 Bundesländer enthalten, Suchfunktion findet "Brandenburg" und "Bayern".
- Bayern auswählen: Kreis-Liste mit 96 Einträgen; "Landshut (Landkreis/Kreis)" getrennt von "Landshut (kreisfreie Stadt)".
- Brandenburg auswählen: "Oder-Spree" auswählbar; dessen regionale Karte erscheint nur im Thema Kita & Betreuung.
- Bundesland nach Auswahl des Kreises ändern: Kreis wird zurückgesetzt, fremde regionale Informationen verschwinden.
- Anderen Landkreis auswählen: bundesweite Grundlagen sichtbar; *keine* Oder-Spree- oder Landshut-spezifischen Daten fälschlich eingeblendet.
- Kreis-Suche mit Umlauten und kurzen Suchbegriffen.
- Modal schließen, App neugestarten, iPhone-Tastatur und Scrollen kontrollieren.
- Alle Links auf tatsächliches offizielles Ziel prüfen, Status nicht als Anspruchszusage deuten.

> Nächster Schritt: alle Bundesländer mit offiziellen landesweiten Regeln erschließen; danach kreisweise Detailrecherche. Backend für persönliche Erinnerungen erst nach Datenschutzkonzept und Zugriffsschutz.
