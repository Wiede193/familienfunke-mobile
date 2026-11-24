# Familienfunke – eigener Wissensassistent ohne kostenpflichtige Sprachmodelle

**Stand: 24. November 2026 · Entwicklungsphase ohne GPT-Gebühren**

## Tatsächliche Funktionsweise

Die neue Funktion **Antwort finden** arbeitet lokal auf dem Endgerät. Sie nutzt
**kein generatives Sprachmodell**. Eine redaktionell gepflegte Datenbank liefert
Sachinformationen, die der Assistent über Synonyme, Fragestellungen und
gewichtete Stichworttreffer zuordnet. Die Funktion nutzt keinerlei externe
Modell-API und speichert Fragen oder Antwortverläufe nicht serverseitig.

Der Button **Suchen** ist getrennt: Er kann weiterhin freigegebene Veranstaltungen,
Basarangebote oder amtliche Einträge über Supabase abrufen. Dadurch entstehen
keine GPT-Modellkosten, aber normale Hosting-Kontingente sind zu beachten.

## Datenbestände

| Bestand | Umfang in dieser Version |
|---|---:|
| Allgemeine Familienratgeber mit offiziellen Quellen | 31 Artikel |
| Inklusion / Behinderung / Leistungen | 18 Artikel |
| Sport, Ernährung und Bewegung | 20 Ressourceneinträge |
| Ausflugsziele in Oder-Spree, Brandenburg und Deutschland | 76 redaktionell erfasste Ziele |
| Regionale Brandenburg-Behörden | 18 Regionen plus amtliche Einstiegsquellen |
| Bundesländer mit amtlichem Serviceportal | 16 |
| Redaktionelle FAQ mit Fachquellen, darunter Naturwissenschaft, Elternzeit und Gesundheit | 20 |
| Zusätzliche Zuordnungen umgangssprachlicher Suchfragen | 312 Formulierungen |
| Wählbare Themen für Beispielfragen | 9 |

Die Zahlen beziehen sich auf die einprogrammierten Daten. Ein erfasster Eintrag ist
**keine Bestätigung**, dass Öffnungszeiten, Preise, Anspruchsvoraussetzungen oder
Kontaktdaten aktuell sind. Amtliche Quellen verweisen auf externe Webseiten.

## Erweiterung und Quellenprüfung vom 24. November 2026

Vierzehn neue Ratgeber wurden in den normalen Familienwegweiser und die lokale
Antwortsuche integriert: Elterngeld, Kindergeld, Mutterschutz, Schwangerschaftsberatung,
Checkliste nach der Geburt, Ausbildung/Studium mit Kind, Schuldnerberatung,
Pflegefamilien, Adoption, Kinderschutz, Kinder- und Jugendberatung,
ärztlicher Bereitschaftsdienst, Jugendamt-Familienhilfen und junge Volljährige.

Die Inhalte orientieren sich an offiziellen Seiten des Familienportals des Bundes,
der Bundesagentur für Arbeit und von gesund.bund.de. Jeder Artikel enthält einen
Überblick, mindestens vier Handlungsschritte, mögliche Anlaufstellen und
Unterlagen, Einschränkungen sowie Originalquellen.

**Aktualitätskorrektur:** Das bislang in der Brandenburg-Wissensbasis genannte
„ElterngeldDigital“ heißt inzwischen „mein-elterngeldantrag.de“. Die Antragsseite
ist nun über
https://familienportal.de/familienportal/rechner-antraege/elterngeld-online-beantragen-127692
verlinkt. Ob eine vollständig digitale Einreichung möglich ist, hängt von der
jeweiligen zuständigen Stelle ab.

**Sachliche Korrektur:** Die *Dauer* von Elternzeit ist etwas anderes als die
*Anmeldefrist*. Der lokale Wissenskatalog enthält daher eine gesonderte,
amtlich belegte Antwort zur Dauer und Aufteilung der Elternzeit:
https://familienportal.de/familienportal/familienleistungen/elternzeit/faq/wie-kann-ich-die-dauer-der-elternzeit-berechnen--124832

**Redaktionelle Grenzen:** Es wurden keine aktuellen Eurobeträge, persönlichen
Leistungszusagen oder verbindlichen Rechtsentscheidungen in die Offline-Antworten
übernommen. Bei Notfallfragen wird zwischen dringlicher Behandlung (116117)
und lebensbedrohlichen Situationen (112) unterschieden. Die App führt
keine medizinische Triage durch.

**Laufender Qualitätssicherungsbedarf:** Rechts- und Sozialleistungsseiten sowie
regionale Antragswege müssen vor Veröffentlichung und nach Änderungen erneut
geprüft werden. Ein erfolgreicher automatischer Test kann externe Webseiten
nicht dauerhaft auf inhaltliche Aktualität prüfen. Die 312 hinterlegten
Aliasformulierungen sind durch Regressionstests auf den vorgesehenen Ratgeber
abgesichert; frei formulierte Fragen können weiterhin anders ausfallen.

## Antworttypen und Grenzen

- **Wissensfrage**: Vorab fachlich geprüfte Antwort, beispielsweise zur Sonne,
  zum Mond, Regen, Jahreszeiten und einer begrenzten Zahl gesundheitlicher Themen;
  Originalquelle verlinkt.
- **Familienfrage**: Antwort aus vorhandenen Ratgebern; bei
  *„Welche Unterlagen?“*, *„Wer ist zuständig?“* oder *„Wie gehe ich vor?“*
  wird ein passender Abschnitt gewählt.
- **Regionale Verwaltungsfrage**: Nur zuvor erfasste konkrete Behörden und
  amtliche Wegweiser. Die Wohnortzuständigkeit wird nicht pauschal behauptet.
- **Ausflugssuche**: Relevante veröffentlichte Katalogziele, direkte Navigation
  zur Familienkarte, Betreiberlink und ggf. nachgewiesene Einzelangaben zur
  Zugänglichkeit. Keine live überprüften Preise/Öffnungszeiten.
- **App-Bedienung**: Navigationshilfe zu realen Familienfunke-Bereichen.
- **Unklare Frage**: Vorschlag weiterer Themen oder der Hinweis, dass keine
  hinreichend geprüfte Antwort verfügbar ist. Keine erfundenen Fakten.
- **Folgefrage**: Eine vorherige, lokal sichtbare Fachantwort gibt einen
  begrenzten Themenkontext für *„Und welche Unterlagen?“* etc. ab.
  Es werden nur Artikelkennung und Artikeltyp gehalten, keine Nutzerdaten
  und keine frei interpretierten Gesprächsinhalte.
- **Notfall-Hinweis**: Bei klaren lebensbedrohlichen Schlüsselwörtern wird
  auf den Notruf 112 verwiesen; ersetzt keine professionelle Triage.
- **Dynamische Leistungen**: Keine automatisch errechneten aktuellen
  Kindergeld-, Elterngeld-, Pflegegeld- oder Wohngeldbeträge. Stattdessen
  offizielle Quellen mit ausdrücklichem Aktualitätshinweis.

## Technische Dateien

- `FamilyKnowledgeAnswer.js`: Normalisierung, Synonyme, Prioritäten,
  Suche, Kontextbegrenzung, Sicherheit und Antwortformat. Keine Netzwerkzugriffe.
- `FamilyKnowledgeCatalog.js`: redaktionelle Fragen, Originalquellen,
  Aliaswörter und Beispielthemen.
- `HomeAssistant.jsx`: gruppierte Themenauswahl, Antwortanzeige, Quellen,
  mögliche Folgefragen, direkte Navigation; Unterhaltung nur während der
  laufenden Ansicht.
- `FamilyTopicsKnowledge.js`, `InclusionKnowledge.js`,
  `FamilyHealthyContent.js`, `BrandenburgFamilyRegions.js`,
  `GermanyFamilyDirectory.js`, `FamilyGuideVerified.js`:
  vorhandene geprüfte Inhalte.
- `FamilyMapCurated.js`, `FamilyMapBrandenburg.js`,
  `FamilyMapNational.js`: bereits redaktionell aufgenommene Orte.

## Kosten und Veröffentlichung

Die Modellfunktionen `ff-app-assistant`, `ff-market-scan`,
`ff-market-review` bleiben **serverseitig deaktiviert**.
Das Datenbankschema führt neue Basarinserate zur manuellen Moderation,
ohne versehentlich zu veröffentlichen. Die bestehende automatische Fotoanalyse
ist nicht durch eine lokale Foto-KI ersetzt.

Andere Infrastruktur und die bestehenden Moderationsendpunkte bleiben zu
beachten. Das Supabase-Free-Kontingent kann bei Wachstum an Grenzen stoßen.
**Diese Architektur garantiert keine kostenlos unbegrenzte öffentliche Nutzung.**

## Redaktion und Prüfungen

Neue Einträge müssen zutreffend formuliert, mit nachprüfbaren Quellen
verknüpft und auf mögliche Aktualitätsrisiken geprüft werden.
Ratgeber über Recht, Medizin, Behinderung und Sozialleistungen dürfen
keine individuelle Anspruchsprüfung oder Diagnose vorspiegeln.

Zum Testen `npm run check:home` ausführen; das enthält
`tests/check-offline-knowledge.mjs` mit Quellen-, Kontext-, Datenschutz-,
Suchqualitäts-, Kostensperren- und Sicherheitsfällen.
Die GitHub-Actions-Pipeline führt zusätzlich die übrigen App-Tests sowie
den iOS- und Android-JavaScript-Bundle-Build aus.

Der Assistent ist bewusst **regel- und quellenbasiert**, nicht mit GPT
gleichzusetzen. Auch mit guten Synonymen können Suchtreffer falsch eingeordnet
werden. Vor einer öffentlichen Veröffentlichung ist eine weitere
redaktionelle Prüfung und ein Gerätetest erforderlich.
