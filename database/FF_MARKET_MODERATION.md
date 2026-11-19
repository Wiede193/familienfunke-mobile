# Familienbasar – Kontextmoderation (19.11.2026)

## Grundsätze
Die **Kleinanzeigen-Grundsätze** dienen als Orientierung, nicht als automatisch übernommene AGB:
https://themen.kleinanzeigen.de/policy/

Unsere strengere Familienfunke-Regel: **Keine Tiere anbieten, suchen, verkaufen, verschenken, tauschen oder vermitteln.** Tierzubehör, Stofftiere, Motive und Kinderspielzeug sind dagegen zulässig.

Wir prüfen vor Veröffentlichung automatisch den tatsächlichen angebotenen Artikel und dessen Kontext aus **Titel + Beschreibung + optionalem Bild**:
- **approved**: unauffälliger Gegenstand, erscheint nach der Prüfung für berechtigte Mitglieder.
- **rejected**: eindeutig unzulässiger Artikel, für andere unsichtbar.
- **pending**: unklar, auffällig oder Prüfung technisch nicht verfügbar. Bleibt für andere unsichtbar bis manuelle Prüfung.

Zwei serverseitige KI-Durchläufe: OpenAI Moderationsmodell für Hass, Gewalt, Sexualität etc.; Kontextmodell für erlaubte Waren und die Abgrenzung zwischen echtem Tier und Plüschtier, echter Waffe und Spielzeug.

Keine einfache Wortliste: Begriffe wie „Hund“, „Katze“, „Schaf“, „Pistole“ sind ohne Kontext **nicht** verboten. Offensichtliche Spielzeugpistolen aus Plastik sind erlaubt; täuschend echt wirkende Waffenrepliken brauchen eine manuelle Prüfung.

## Weitere wesentliche Ausschlüsse
Echte Waffen und Munition, Gefahrstoffe/Explosives, Drogen und Suchtmittel, Alkohol, Tabak und Zubehör, Medikamente und Supplements, 18+-Medien und Sexartikel, Hass-/NS-Propaganda, Fälschungen, gestohlene Waren, Ausweise/persönliche Daten, dubiose Finanz-/Betrugsangebote sowie reine Anzeigen für Dienstleistungen. Zweifel werden zurückgehalten statt ohne Kontext abgelehnt.

## Sicherheitsgrenzen
- Die Edge Function **moderate-market-listing** authentifiziert den Nutzer, liest die Inseratdaten ausschließlich aus der Datenbank und akzeptiert als Eingabe nur die Inserat-ID.
- Sie prüft nur eigene Inserate mit Status **pending**; aktualisiert nur diesen Datensatz und niemals zusätzliche Felder.
- Bilddaten werden nur aus dem privaten Bucket `ff-market-photos` gelesen. Ein fehlendes oder kaputtes Bild bzw. fehlendes KI-Ergebnis führt nicht zur Freigabe.
- Die App darf niemals selbst `moderation_status` setzen; Datenbank-RLS unterbindet öffentliche Freigabezugriffe.
- Bereits freigegebene Inserate können über die mobilen Clients nicht mit einem neuen Foto versehen werden.
- KI ist nicht unfehlbar; Meldungen und menschliche Nachprüfung bleiben notwendig.
- Kein Zahlungsdienst wird ausgelöst.

## Testmatrix (vor Veröffentlichung auf echten Familienkonten prüfen)
| Fall | Erwartung |
| --- | --- |
| „Schaf Lena“ – Plüschtier mit Stofftierfoto | approved |
| „Pistole“ aus buntem Plastik, klar als Kinderspielzeug erkennbar | approved |
| Babykleidung mit Hundemotiv | approved |
| Hundeleine ohne Hund | approved |
| Lebender Welpe, „in gute Hände abzugeben“ | rejected |
| Katze kostenlos abzugeben | rejected |
| Schildkröte gegen Schutzgebühr | rejected |
| Foto eines echten Hundes mit Text „Plüschtier“ | pending/rejected |
| Echte Schusswaffe oder Munition | rejected |
| Täuschend echte Waffenreplik, schwer einzuordnen | pending |
| Medikament / Alkohol / Tabak / Drogen | rejected |
| NS-Propaganda / explizite sexuelle Inhalte | rejected/pending |
| Bild moderationsseitig auffällig bei sonst harmloser Beschreibung | pending |
| KI nicht verfügbar oder Bild fehlt im Storage | pending |
| Fremder Nutzer ruft Prüfung für andere Inserat-ID auf | 404 / keine Statusänderung |
| Direktes Update von `moderation_status` durch App-Nutzer | RLS verweigert |

**Wichtig:** Diese Matrix beschreibt Sollverhalten, nicht bereits erfolgreich durchgeführte Modelltests. Nach Deploy und Authentifizierung müssen reale Testfälle geprüft werden.
