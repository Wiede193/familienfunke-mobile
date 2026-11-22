# Öffentliche Familienveranstaltungen · Oder-Spree und Nachbarn

**Recherchestand 23.11.2026.** 28 offizielle Familientermine in Supabase: Oder-Spree (11), Frankfurt (Oder) (5), Märkisch-Oderland (6), Barnim (3), Dahme-Spreewald (3). Quellen und individuelle Daten sind in `database/ff_official_family_events_seed_2026.sql` dokumentiert.

## Geeignete laufende Quellen
- **Oder-Spree:** [Storkow – Kindertermine](https://www.storkow-mark.de/veranstaltungen/rubrik.php?rubrik=24), [Burg Beeskow](https://www.burg-beeskow.de/erleben/burgfeste), [Kulturfabrik Fürstenwalde](https://kulturfabrik-fuerstenwalde.de/), [Seenland Oder-Spree](https://www.seenland-oderspree.de/).
- **Frankfurt (Oder):** [Stadtveranstaltungen](https://www.frankfurt-oder.de/Angebote-Beteiligungen/Angebote/Veranstaltungen-in-Frankfurt-Oder-/), [Netzwerk Gesunde Kinder](https://www.netzwerk-gesunde-kinder.de/termine/jahreskalender-frankfurt/).
- **Märkisch-Oderland:** [Schlossgut Altlandsberg](https://www.schlossgut-altlandsberg.de/veranstaltungen/), [Neuenhagen](https://www.neuenhagen-bei-berlin.de/startseite-de/verkehr-verwaltung-aktuell/veranstaltungstermine-2026-2027/).
- **Barnim:** [Eberswalde](https://www.eberswalde.de/weihnachtsmarkt), [Bernau](https://www.bernau.de/de/tourismus-kultur/veranstaltungen/weihnachtsmarkt.html).
- **Dahme-Spreewald:** [Lübben](https://www.luebben.de/stadt-luebben/de/buergerservice/aktuelles/adventszeit-in-luebben-spreewald/), [Königs Wusterhausen](https://www.koenigs-wusterhausen.de/weihnachten), [Museumspädagogischer Dienst](https://www.luebben.de/mupaed-lds/de/veranstaltungen-termine/).

## Redaktionelle Regeln
Nur nachweislich zukünftige Familienfeste, Kinder- und Puppentheater, familiengeeignete Märkte, Bewegung, Baby-Eltern-Termine, Mitmach- und Naturaktionen veröffentlichen. Keine Vernissagen, allgemeinen Kunstausstellungen, Erwachsenenprogramme, ungesicherten Termine, ausverkauften Angebote oder geschätzte Uhrzeiten. Öffentliche Originalquelle, Termin, Ort, Familienbezug und Prüfdatum sind Pflicht.

Google ist Suchhilfe, kein vollständiger oder lizenzierter Feed. **Alle Google-Veranstaltungen werden nicht automatisch eingelesen.** Absagen, Preise, Tickets und tatsächliche Barrierefreiheit müssen auf der Originalseite geprüft werden. Mindestens wöchentliche redaktionelle Aktualisierung empfohlen. Unsichere Termine auf `published=false` setzen.

## Implementierung und Datenschutz
`public.ff_official_family_events` hat RLS, nur `published` und nicht abgelaufene Events sind für angemeldete Nutzer lesbar, keine Client-Schreibrechte. Anzeige im Veranstaltungsbereich und privaten Monatskalender, jeweils mit Quelle und Landkreis- und Themenfilter. Vormerken legt ausschließlich einen privaten Kalendereintrag an; es bucht keine Teilnahme. Eigene Familienfunke-Treffen bleiben in separater Tabelle. Idempotente Redaktionsquelle: `database/ff_official_family_events_seed_2026.sql`. CI prüft `npm run check:official-events` und `npm run check:calendar`; echte Geräte und Screenreader müssen zusätzlich geprüft werden.
