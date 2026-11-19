# Familienfunke: Familien-Kompass / Antragslotse
Stand der Recherche: 19.11.2026 · Fachkonzept, noch **nicht** in der App implementiert.

## 1. Ziel und Alleinstellungsmerkmal
Ein persönlicher, regionalisierter **Behörden-Fahrplan** statt einer Sammlung von bloßen Links oder unübersichtlichen Foren-Texten. Familien beantworten wenige freiwillige Fragen (Bundesland, Landkreis/Kommune, Lebenssituation, voraussichtlicher Geburtstermin/Geburtsmonat oder geplanter Betreuungsbeginn, Erwerbssituation, Alter des Kindes, Betreuungsstunden). Daraus entstehen:
- **Was ist zu tun?** Gesetzliche Pflicht / notwendiger Antrag / freiwillige Leistung / nur prüfen.
- **Wann?** Rechtliche Frist, behördlich empfohlener Vorlauf, realistische Bearbeitungsdauer jeweils deutlich **getrennt**.
- **Wo?** Zuständige offizielle Stelle, möglichst direktes Onlineformular oder offizieller Download, Adresse, Telefonnummer; zuständige Mitarbeitende nur wenn offiziell aktuell veröffentlicht.
- **Was brauche ich?** Tatsächlich erforderliche Grundunterlagen plus konditionale Zusatzbelege.
- **Was kommt danach?** Bescheid erhalten, Fristen für Nachreichungen/Änderungen, Verlängerung/Folgeantrag, möglicher Widerspruch; nur auf Grundlage überprüfter Vorschriften.
- **Erinnerung** individuell konfigurierbar und lokal berechenbar; keine irreführenden 'automatisch eingereicht'-Buttons.

## 2. UX und Navigationskonzept
Neue eigenständige Registerkarte/Unterseite "Familien-Kompass" (etwa über "Elternwissen", ohne die bestehenden Kontakte/Nachrichten zu verdrängen).
Einstiegskarten:
1. Wir erwarten ein Baby
2. Unser Kind ist geboren
3. Elternzeit & Elterngeld
4. Kita / Tagespflege / Hort
5. Finanzielle Hilfen
6. Alleinerziehend / besondere Lebenslagen

Nach wenigen Fragen erscheint eine **visuelle Zeitleiste und Aufgabenübersicht**; jedes Element expandiert zu:
Titel; relevant für uns?; Fälligkeit (rechtlich oder Empfehlung); benötigte Dokumente; direkte Behördenseite; Stelle/Ansprechperson; Datenschutz-/Aktualitätshinweis; Status Offen/In Bearbeitung/Eingereicht/Bescheid erhalten/Erledigt; optionale Erinnerung.

Personalisierung je nach Region, Geburtsjahr und Familiensituation. Nicht alle Leistungen treffen auf alle Familien zu. Nutzer müssen auch 'nicht zutreffend' wählen können. Keine automatische Anspruchszusage oder rechtliche Beratung.

## 3. Überprüfte bundesweite Starterdaten (19.11.2026)
| Vorgang | Zeitpunkt / Form | Zuständig | Unterlagen / Anmerkung | Primärquelle |
|---|---|---|---|---|
| Elternzeit bei Arbeitgeber anmelden | Grundsätzlich spätestens **7 Wochen vor Beginn** bis zum 3. Geburtstag, **13 Wochen** für Abschnitte vom 3. bis vor 8. Geburtstag. Es handelt sich um eine **Anmeldung**, nicht um einen behördlichen Antrag; bei jüngeren Geburten Textform, z. B. E-Mail, möglich. | Arbeitgeber | Beginn, Ende, Bindungszeitraum; Bestätigung verlangen; Sonderfälle berücksichtigen. | https://familienportal.de/familienportal/familienleistungen/elternzeit/faq/wann-und-wie-muss-ich-elternzeit-beantragen--124810 |
| Mutterschaftsgeld prüfen | Normale Schutzfrist **6 Wochen vor** und **8 Wochen nach** der Geburt (Ausnahmen). | Je nach Versicherungsstatus Krankenkasse bzw. Bundesamt und Arbeitgeber | Bescheinigung zum voraussichtlichen Geburtstermin, weitere Unterlagen je Fall. | https://familienportal.de/familienportal/familienleistungen/mutterschaftsleistungen/wie-kann-ich-mutterschaftsgeld-der-gesetzlichen-krankenkasse-berechnen-und-beantragen--125038 |
| Geburt anzeigen | **Innerhalb einer Woche** nach Geburt beim Standesamt **des Geburtsortes**. | Standesamt | Geburtsbescheinigung und standesamtsabhängige Unterlagen. Geburtsurkunde für weitere Anträge. | https://familienportal.de/familienportal/lebenslagen/schwangerschaft-geburt/anmeldung-standesamt |
| Krankenversicherung des Kindes klären | Nach Geburt zeitnah. | Krankenkasse | Geburt mitteilen, Familienversicherung oder andere Absicherung prüfen. | https://familienportal.de/familienportal/lebenslagen/kinder-jugendliche/staatliche-leistungen/kann-ich-meine-familie-bei-meiner-krankenversicherung-und-pflegeversicherung-mitversichern--125576 |
| Elterngeld beantragen | **Erst nach Geburt**, am besten in den **ersten 3 Lebensmonaten**; maximal 3 Lebensmonate rückwirkend. | Elterngeldstelle für Wohnort des Kindes | Geburtsurkunde, Einkommensnachweise und nach Situation Bescheinigungen zu Mutterschaftsleistungen/Arbeitszeiten. | https://familienportal.de/familienportal/familienleistungen/elterngeld/faq/wie-kann-ich-elterngeld-beantragen--124762 |
| Kindergeld beantragen | Möglichst zeitnah; rückwirkende Auszahlung grundsätzlich maximal **6 Monate**. 2026: **259 € monatlich je Kind**. | Familienkasse | Identifikationsnummern und relevante Antragsangaben; Einzelfall prüfen. | https://www.arbeitsagentur.de/familie-und-kinder/infos-rund-um-kindergeld/kindergeld-anspruch-hoehe-dauer |
| Kinderzuschlag prüfen | Bei kleinem Einkommen zusätzlich zum Kindergeld; Antrag **nicht allgemein rückwirkend**; in der Regel 6 Monate Bewilligung, danach neu beantragen. 2026 bis **297 € pro Kind / Monat**. | Familienkasse | Einkommensnachweise (üblicherweise letzte 6 Monate), Wohnkosten und ggf. Vermögen. | https://www.arbeitsagentur.de/familie-und-kinder/kinderzuschlag-verstehen/kinderzuschlag-anspruch-hoehe-dauer |
| Wohngeld prüfen | Grundsätzlich ab **Antragsmonat**, nicht rückwirkend. | örtliche Wohngeldbehörde | Angaben zu Miet-/Wohnkosten, Haushalt und Einkommen. | https://familienportal.de/familienportal/familienleistungen/weitere-leistungen/wohngeld |
| Bildung & Teilhabe prüfen | Relevant insbesondere bei Kinderzuschlag oder Wohngeld; z. B. Kita-Mittagessen und Ausflüge. | lokal zuständige BuT-Stelle | Nachweis Leistungsbezug und Maßnahme. | https://familienportal.de/familienportal/familienleistungen/bildung-und-teilhabe |
| Kita-Beitragsübernahme prüfen | Abhängig von Bundesland, Alter, Einkommen und Betreuungsumfang. | Jugendamt/Träger | Regionale Regeln; nicht pauschal Bundesfristen annehmen. | https://familienportal.de/familienportal/familienleistungen/staatliche-leistungen-fuer-familien-138196 |
| Unterhaltsvorschuss prüfen | Falls alleinerziehend und Unterhalt ausbleibt; gesonderte Voraussetzungen. | Unterhaltsvorschussstelle, meistens Jugendamt | Antragsunterlagen regional. | https://familienportal.de/familienportal/familienleistungen/unterhaltsvorschuss/wie-kann-ich-unterhaltsvorschuss-beantragen--125266 |
| Bundesstiftung Mutter und Kind prüfen | Bei finanzieller Notlage **Antrag noch während Schwangerschaft** in einer Schwangerschaftsberatungsstelle. | anerkannte Beratungsstelle | Nicht erst nach Geburt auf diese Hilfe hinweisen. | https://familienportal.de/bmbfsfj/themen/familie/schwangerschaft-und-kinderwunsch/bundesstiftung-mutter-und-kind/bundesstiftung-mutter-und-kind-73522 |

**Rechtsstand prüfen:** Im November 2026 existiert ein **Gesetzentwurf** zur Änderung des Elterngeldes; geplante Erhöhungen aus einem Entwurf nicht als bereits geltende Beträge ausgeben. Offizielle Quelle: https://familienportal.de/bmbfsfj/ministerium/gesetze/entwurf-eines-gesetzes-zur-aenderung-des-bundeselterngeld-und-elternzeitgesetzes-zur-weiterentwicklung-und-vereinfachung-des-elterngeldes-sowie-des-mutterschutzgesetzes-298792

## 4. Pilotregion: Brandenburg / Landkreis Oder-Spree
Die aus dem vorhandenen Familienfunke-Testprofil bekannte Region Müllrose dient **nur als redaktionelles Pilotbeispiel**, nicht als allgemeine Annahme über jeden User.

### Kita-Rechtsanspruch / Bedarfsfeststellung
Offizielle Landkreisquelle:
https://www.landkreis-oder-spree.de/Service-Aktuelles/Service/Was-erledige-ich-wo-/Rechtsanspruch-auf-Kindertagesbetreuung.php?FID=2426.44.1&ModID=10

- Bis zur Vollendung des 1. Lebensjahres: Antrag immer nötig.
- Vom 1. Lebensjahr bis Einschulung: bis **30 Wochenstunden** kein gesonderter Bedarfsfeststellungsantrag nötig; bei mehr als 30 Stunden ist er nötig.
- 1. bis 4. Klasse: bis 20 Stunden kein Antrag nötig, mehr als 20 Stunden Antrag.
- 5. bis 6. Klasse: Antrag immer nötig.
- Der **erforderliche Antrag** soll **ca. 6–8 Wochen vor Betreuungsbeginn eingereicht** werden.
- Die **Bearbeitung kann bis zu 6 Wochen** dauern, wenn Unterlagen vollständig sind. Das bedeutet NICHT, dass ein Bescheid automatisch 6–8 Wochen vor Beginn ausgestellt wird.
- Erstantrag: Altersnachweis / Geburtsurkunde; häufig Nachweise zur Erwerbstätigkeit/Arbeitszeit/Wegzeit, Ausbildung o. Ä., je Fall.
- Antragsformular vorzugsweise per E-Mail an im Formular genannte zuständige Kontaktperson; Postanschrift Landkreis Oder-Spree, Jugendamt / Kindertagesbetreuung, Breitscheidstraße 7, 15848 Beeskow.
- Formulare: https://www.landkreis-oder-spree.de/Service-Aktuelles/Service/Formulare/Antragsformular-Rechtsanspruch-Kita-Hort-Word-Datei-.php?FID=2689.2727.1&ModID=6&NavID=2426.51.1&object=tx%2C3410.3.1
- Hinweis: Entscheidung über den zeitlichen Bedarf ist nicht identisch mit der Anmeldung zu einer konkreten Kita oder einem freien Platz. Eltern sollten Eingewöhnungszeit einplanen. Land Brandenburg: https://mbjs.brandenburg.de/kinder-und-jugend/kindertagesbetreuung/rechtsanspruch-und-anmeldung.html

### Elterngeld – konkrete Zuständigkeit nach Buchstabe
Quelle https://www.landkreis-oder-spree.de/Bildung-Soziales/Jugend-Familie/Elterngeld/
Jugendamt – Elterngeld, Breitscheidstraße 7, Haus B, 15848 Beeskow, elterngeld@l-os.de, zentrale Nummer 03366 35-2511.
Laut veröffentlichtem Kontaktverzeichnis:
- A–H: Frau Kunze, 03366 35-1520
- I–Q: Frau Danielewski, 03366 35-1519
- R–Z: Frau Lanzky, 03366 35-1521
Diese Zuordnung ist **nur ein redaktioneller Stand**, muss live neu geprüft und ggf. entfernt werden, wenn die Seite wechselt. Den Nachnamen des Antragstellers nicht zentral speichern, für die Auswahl genügt ein freiwillig lokal ausgewählter Anfangsbuchstabe.

Achtung: Lokale Landkreis-Seiten können zu digitalen Antragswegen und Schriftform teils widersprüchliche/ältere Texte enthalten. Für aktuelle Rechtsfristen Bundes-Familienportal priorisieren; für konkreten lokalen Verfahrensweg jeweils die offizielle zuständige Dienststelle verifizieren.

## 5. Datenmodell (Vorschlag)
**service_rule**: id, title, life_event, jurisdiction (federal/state/district/city), jurisdiction_id, eligibility_conditions, due_type (legal_deadline/recommended_lead_time/processing_time/periodic_review), trigger, offset_days, source_url, source_title, source_checked_at, effective_from, effective_to, editorial_status.
**office**: service_rule_id, administrative_area, official_url, office_name, office_address, contact_url, phone, letter_ranges (optional), source_checked_at.
**user_task**: auth_user_id, service_rule_id, state (open/in_progress/submitted/notice_received/done/not_applicable), chosen_due_date, reminder_preference, updated_at.
**read-state/reminders**: nur mit passender Zugriffskontrolle und expliziter Einwilligung; private Daten strikt von Community-Profil und Fotos trennen.

### Sicherheit/Vertrauen
- Keine öffentlichen Eltern-/Kinderdaten im Antragslotsen; keine exakten Geburtsdaten/Finanzdaten speichern, sofern nicht unerlässlich und ausdrücklich erlaubt. Grobe/relative Daten und lokale Verarbeitung vorziehen.
- Regionale RLS, Datenminimierung, Löschmöglichkeit, keine Übernahme von Dokumenten in private Fotos.
- Keine Antragsübermittlung im Namen von Nutzern ohne echte offizielle Integration und Autorisierung.
- Jede Regel: Primärquelle + zuletzt geprüft + Datum der Geltung; 'Aktualität ungeprüft' anzeigen und automatische Reminder NICHT auf unbestätigte Regeln stützen.
- Einbindung erst nach fachlicher Prüfung und Testfällen für unterschiedliche Geburtsdaten, Arbeitsformen, Familienkonstellationen, Regionen.

## 6. Iterativer Umsetzungsplan
**MVP 1:** Informationskarten und interaktiver Entscheidungsbaum (Bundesrecht plus Pilotregion), verifizierte Links, keine privaten Speicherdaten.
**MVP 2:** Antrags-Checkliste, Status, Erinnerung, Datenschutz und serverseitige Zugriffsregeln.
**MVP 3:** weitere Regionen und Leistungen durch redaktionell gepflegte Datensätze und Änderungsüberwachung offizieller Quellen.
**MVP 4:** Optional offizielle digitale Anträge nur über etablierte Behördenschnittstellen, ohne falsche Behauptung einer abgeschickten Antragstellung.

Erfolgskriterien: Familien finden innerhalb weniger Klicks **welcher Antrag, zuständige Stelle, Unterlagen, Frist und nächster Schritt**; regionale Daten haben Quellen und geprüfte Gültigkeitsstände.