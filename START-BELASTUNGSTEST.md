# Familienfunke – Stabilität vor einer großen Nutzerkampagne

Stand: 22.11.2026. **Dies ist keine Produktionsfreigabe.** Keine Änderungen an der produktiven Supabase-Datenbank und keine Lasttests auf dem Produktivprojekt ohne schriftlich abgestimmte Freigabe. Das bestehende Projekt besitzt **noch keine Staging-Umgebung**.

## Bestandsaufnahme

- Der Entwicklungsbranch `ux/generationenfreundlich` hat funktionierende iOS-/Android-JavaScript-Builds; es gibt keine End-to-End-Freigabe auf echten Geräten oder unter großem Nutzeransturm.
- Die App fragt beim regulären Konto-Start aktuell 15 Datenbereiche ab. Die neue `runBoundedQueries`-Begrenzung startet höchstens 4 davon gleichzeitig (unveränderte Gesamtzahl, möglicherweise längere Einzelanmeldung). Sie ist **kein Ersatz** für Lazy Loading und Paginierung.
- Der Start lädt auf einmal bis zu 150 fremde Profile, 200 Kontaktanfragen, 300 Nachrichten, 150 Termine, 160 Angebote, 800 zusätzliche Angebotsfotos, 100 Profilfotos u. a. Große Mengen werden dadurch irgendwann abgeschnitten; die angezeigten Vorschauen sind keine vollständige Suchergebnisliste.
- Gesonderte indexierte Markt-Suche existiert bereits; künftige Hauptabfragen für Nachrichten, Familien, Veranstaltungen und Fotos müssen featurebezogen, seitenweise und mit passenden Indizes ablaufen.
- Die Anmeldung bietet derzeit nur Login und Hilfe; es gibt **noch keine öffentliche Registrierung mit skalierbarer Erwachsenenverifizierung**.
- Die Supabase-Advisor-Prüfung am 22.11.2026 meldete: 37 an authentifizierte Nutzer ausführbare `SECURITY DEFINER`-RPCs (darunter Admin-Funktionen), 25 nicht indexierte Fremdschlüssel, zwei doppelte Indexpaarungen, und deaktivierten Schutz gegen bekannte kompromittierte Passwörter. Das sind **Audit-Hinweise**, kein pauschaler Sicherheitsnachweis für Missbrauch; nicht blind Berechtigungen entziehen oder Indizes löschen.
- Gebühren- und Compute-Kontingente, Backups, Auth-Mail-Kapazität und Moderationsdurchsatz sind noch nicht für einen Massenstart bestätigt.

## Verbindliche Reihenfolge vor Influencer-Werbung

| Priorität | Arbeitsblock | Freigabekriterium |
| --- | --- | --- |
| P0 | Separate Supabase-Staging-Umgebung mit schema- und RLS-gleichen Tabellen, Buckets, RPCs und Edge Functions einrichten; synthetische Testdaten | Nachweislich getrennte Projekt-ID/Keys, keine echte Nutzerkopie, keine echten Push-/E-Mail-Aktionen |
| P0 | 37 privilegierte RPCs einzeln auf Ausführungsrechte, interne Admin-Prüfung, Besitzer-/Objektbindung, `search_path`, MFA und Rate-Limits prüfen | Kein unberechtigter Admin- oder Fremddatenzugriff; Negativtests für fremde Nutzer; bestehende legitime Funktionen bleiben nutzbar |
| P0 | Öffentliche Registrierung mit E-Mail-Bestätigung, Erwachsenenprüfung, Warteschlange, Missbrauchsschutz und verständlichem Freigabestatus bauen | Jeder legitime neue Nutzer erreicht einen klaren nächsten Schritt, ohne händisch eingeladene Zugänge; Registrierung ist nicht gleich Freischaltung |
| P0 | Lasttest und Fehlersimulation auf Staging, einschließlich Login/Session, Suche, Fotos, Kontakte, Treffen und Edge Functions | Messbare p50/p95/p99, Fehlerrate, CPU/RAM/DB-Verbindungen, Queuelänge; kein Datenleck oder fataler Fehler |
| P0 | Produktive Sicherung, Wiederherstellung, Monitoring, Alarmierung und Verantwortlichkeiten | Wiederherstellung getestet; mindestens eine verantwortliche Person und ein Vorgehen bei Ausfällen definiert |
| P0 | Moderation bei Ansturm (Profile, Fotos, Anzeigen, Events, Meldungen) und Schutz des KI-Budgets | Keine ungeprüfte Veröffentlichung; wartende Personen erhalten ehrlichen Status; Kostenlimits und Not-Aus-Schalter getestet |
| P1 | Lazy Loading/Paginierung für Profile, Nachrichten, Fotos und Termine | Anmeldezeit und Datenvolumen wachsen nicht linear mit Gesamtbestand; keine veralteten Treffer als aktuell dargestellt |
| P1 | Fehlende, im produktiven Lastpfad benötigte Indizes anhand von `EXPLAIN` und Advisor priorisieren; doppelte Indizes nur nach Vergleich bereinigen | Vergleichs-Messungen vor/nach in Staging, keine verschlechterten Schreibpfade |
| P1 | Bildergrößen, signierte URLs, Speicherung, CDN-/Caching-Konzept | Netzwerk- und Speicherverbrauch pro Nutzer bekannt; nur zugriffsberechtigte Bildansichten |
| P1 | Rückrollverfahren für App, Datenbankmigrationen und Edge Functions | Rückfall auf letzte getestete Version ohne Datenverlust und ohne Rechteöffnung möglich |
| P1 | Recht, Zahlungs-/Support-Prozesse, Datenschutzhinweise und reale Barrierefreiheitsabnahme | Veröffentlichungscheckliste unterschrieben, bevor Anzeigen oder Einladungen massenhaft ausgespielt werden |

## Staging-Lasttest (k6) – ausdrücklich nicht in Produktion

Datei `performance/k6/staging-reads.js` führt nur GET-Abfragen durch. Sie verweigert die bekannte Produktionsprojekt-ID, benötigt ein explizites Freigabewort und akzeptiert ausschließlich eine separate `*.supabase.co`-Umgebung mit mindestens zwei verschiedenen **synthetischen** Testkonten. Keine Registrierung, keine Kosten erzeugenden KI-Aufrufe, keine Schreibzugriffe, keine echten Familien-/Kinderinformationen. Vorsicht: Die Supabase Auth-, Storage- und Edge-Limits werden mit diesem kleinen Read-Test **nicht** geprüft.

```bash
FF_CONFIRM_STAGING=STAGING_READS_ONLY \
FF_STAGING_SUPABASE_URL=https://STAGING_PROJEKT_ID.supabase.co \
FF_STAGING_PUBLISHABLE_KEY=STAGING_PUBLISHABLE_KEY \
FF_STAGING_TEST_TOKENS="SYNTHETIC_USER_TOKEN_1;SYNTHETIC_USER_TOKEN_2" \
k6 run performance/k6/staging-reads.js
```

Der obige Aufruf ist eine Vorlage: vorher k6 installieren und echte **Staging-Testkonten** anlegen. Tokens nicht committen, nicht in Tickets kopieren, nicht als Parameter in Logs schreiben. Passenden Request-Pfad und RLS-Policies vorher manuell auf Testkonten prüfen.

### Aufsteigender Belastungstest

1. **Smoke:** 5 gleichzeitige virtuelle Nutzer / 45 Sekunden, nur synthetische Daten und gegen Staging. Der mitgelieferte Script-Default ist absichtlich klein.
2. **Pilot:** 20–50 gleichzeitige Nutzer / 5 Minuten, inklusive tatsächlicher App-Navigation auf Test-Builds; verlässliche Baseline schaffen.
3. **Regionaler Kampagnentest:** 100–200 gleichzeitige Sitzungen und schrittweiser Anmelde-Andrang. Nach Rücksprache mit Supabase-Kontingenten und E-Mail-Anbieter.
4. **Späterer Ansturm:** 500–1.000 gleichzeitige Sitzungen **nur** nach erfolgreich dokumentierten Vorstufen, möglicher Compute-Anpassung und kontrolliertem Testfenster. Künstliche Signups nur auf gesonderter Staging-Auth-Konfiguration.

### Vorgeschlagene, noch nicht validierte Gates

- P95 der getesteten API-GETs unter 1,5 s, HTTP-Fehlerquote unter 5 % im ersten Smoke-Test; Ziel für Kampagne unter 1 %, keine fortgesetzten 5xx-Serien. Die konkreten SLOs nach Gerät-, Netz- und realen Baseline-Messungen anpassen.
- Die Sitzung endet nicht ohne Rückmeldung, auch wenn Anmeldung, Geocoding, KI oder Bildverarbeitung vorübergehend nicht verfügbar sind.
- Keine private Nachricht, kein unmoderiertes Foto und kein nicht freigegebener Eintrag taucht in den Daten anderer auf.
- Kostenlimits für Moderation, Video-/Bildtraffic, KI und E-Mail werden eingehalten, Ausfall-/Stoppprozesse sind dokumentiert.
- Testprotokoll enthält Build-/Commit-Stand, Staging-ID (ohne Keys), Ankunftsrate, Maximalnutzer, P95/P99, Fehlermeldungen, DB CPU/Verbindungen und Ticketliste.

## Aktuelle offizielle Referenzen

- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Performance Tuning](https://supabase.com/docs/guides/platform/performance)
- [Security Advisor](https://supabase.com/docs/guides/database/database-linter)
- [Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
- [Database Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits)

**Go/No-Go:** Keine große Influencer-Kampagne, solange die P0-Punkte nicht auf einer separaten Testumgebung und danach auf echten Geräten bestanden sind.
