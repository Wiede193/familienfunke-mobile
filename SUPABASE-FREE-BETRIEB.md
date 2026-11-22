# Familienfunke – Supabase-Free-Betrieb und sichere Lasttest-Vorbereitung

Stand: 22. November 2026. **Die produktive Beta wurde keinem Lasttest unterzogen.**

## Tatsächlich geprüft

| Kennzahl | Beobachtung |
|---|---|
| Supabase-Projekt | Family Sparkle, Region eu-central-1, aktiv |
| PostgreSQL | Version 17.11 |
| Datenbank | rund 16 MB von 500 MB Free-Kontingent |
| DB-Verbindungen beim Audit | 7 von konfigurierten 60 PostgreSQL-Verbindungen |
| Konten / Profile | 2 / 2 |
| Basar-Inserate / Nachrichten | 2 / 27 |
| Bereits vorhandene Jobs | 4, davon 3 minütlich und einer alle 5 Minuten |
| Cron-Ausführungen im geprüften 24-h-Fenster | 4.608, keine fehlgeschlagen |
| Postgres-Erweiterungen | `pg_cron`, `pg_stat_statements`, `pg_net` installiert |

Der gemessene Stand ist eine **Momentaufnahme**. Die Konfiguration `max_connections=60`
bezeichnet PostgreSQL-Verbindungen, **nicht** die Zahl gleichzeitig erlaubter App-Nutzer
oder von Supavisor verwalteter Client-Verbindungen. CPU-/RAM-Auslastung, Netzwerk-/Storage-
Egress und API-p95 sind separat im Supabase-Dashboard zu prüfen.

Laut aktueller Supabase-Preisliste bietet der Free-Tarif 500 MB Datenbank,
geteilt genutzte CPU/500 MB RAM, 1 GB Storage und 5 GB Egress.
Er enthält **keine automatischen Datenbankbackups, kein PITR, keine
kostenlose Supabase-Branching-Funktion und keinen Metrics-Endpunkt**.
`50.000 MAU` ist ein Abrechnungskontingent, kein Lastkapazitätsnachweis.

Quellen:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/observability/reports
- https://supabase.com/docs/guides/cron

## Bereits aktiv: kostenlose technische Verlaufsmessung

Die Migration `database/ff_ops_hourly_snapshots_20261122.sql` ist auf dem
bestehenden Projekt angewendet. `cron.schedule('ff_ops_hourly_snapshot', ...)`
führt stündlich zur Minute 17 UTC eine kleine SQL-Messung aus.

Es werden ausschließlich aggregierte technische Kennzahlen in
`private.ff_ops_snapshots` gespeichert: DB-Bytes, Postgres-Verbindungen,
aktive Abfragen, wartende Locks, kumulierte Transaktionen/Rollbacks/Deadlocks,
temporäre DB-Bytes sowie Zahl und Fehler der Cronjobs in der letzten Stunde.

**Keine** E-Mails, Namen, IDs von Familien, Nachrichtentexte, Foto-Pfade,
IP-Adressen oder Zugangsschlüssel werden gespeichert. Die Tabelle liegt
im nicht API-exponierten Schema `private`; `anon` und `authenticated`
haben weder Leserechte noch Funktions-EXECUTE. Es werden höchstens 14 Tage
eigener Snapshots behalten. Die Statusansicht ist unter
`database/ff_ops_private_status_view_20261122.sql` versioniert.

Nur im **SQL-Editor mit Betreiberrechten** ausführen:

```sql
select
  observed_at,
  round(database_bytes / 1048576.0, 1) as database_mb,
  round(database_bytes * 100.0 / (500 * 1048576), 1) as database_free_quota_percent,
  connection_count,
  max_connections,
  round(connection_count * 100.0 / nullif(max_connections, 0), 1) as connection_percent,
  active_queries,
  waiting_locks,
  cron_runs_last_hour,
  cron_failures_last_hour,
  transactions_rolled_back,
  deadlocks
from private.ff_ops_snapshots
order by observed_at desc
limit 48;
```

Eine zusätzliche, ebenfalls private `SECURITY INVOKER`-Ansicht
`private.ff_ops_latest_status` berechnet aus dem jüngsten Snapshot
`ok`, `warning` oder `critical`. Sie erkennt auch, wenn länger als
zwei beziehungsweise vier Stunden kein neuer Snapshot einging.
Sie ist nur für Betreiber im SQL-Editor lesbar, nicht für App-Nutzer.

```sql
select observed_at, database_quota_percent, connections_percent,
       waiting_locks, cron_failures_last_hour, technical_status
from private.ff_ops_latest_status;
```

**Pragmatische Beobachtungsschwellen, noch keine automatischen Alarme:**
Ab 350 MB DB-Größe sowie 42 gleichzeitig geöffneten PostgreSQL-Verbindungen
(70 % des aktuell eingestellten Maximums) prüfen; bei 450 MB/54
Verbindungen umgehend gegensteuern. Schon ein unerwarteter Cron-Fehler
ist zu untersuchen. Das sind konservative Betreiber-Schwellen, keine
offiziellen Kapazitätsgrenzen.

Auch bei gesunden DB-Snapshots können HTTP-429, Storage-Egress,
CPU-Spitzen, langsamere API-Routen oder fehlschlagende Moderation auftreten.
Prüfe daher zusätzlich **Supabase Dashboard → Reports → API Gateway /
Database / Auth** und **Organization → Usage**. Im Free-Tarif lassen
sich die Dashboards auf bis zu 24 Stunden zurückstellen, nicht 7 Tage.

**Noch nicht aktiv:** automatischer E-Mail-/Webhook-Alarm, verlässliche
24/7-Erreichbarkeitsüberwachung, p95 je API-Route und Kostenalarm.
Nicht vorhandene Alarmzustellung darf nicht als vorhanden dargestellt werden.

**Bekannte Folgeaufgabe:** Die Supabase-Crontabelle
`cron.job_run_details` verzeichnet bereits mehrere Tausend Ausführungen
am Tag. Sie ist *nicht* Teil der 14-Tage-Bereinigung eigener Snapshots.
Historie und Speicherzuwachs getrennt prüfen und vor einer eventuellen
Löschroutine eine passende Retention-/Diagnostikregel vereinbaren.

## Staging: ohne Zugriff auf produktive Daten testen

Auf dem verbundenen Supabase-Konto wurde derzeit ein aktives Projekt
gefunden. Free erlaubt grundsätzlich zwei aktive Projekte; ein zweites
**eigenständiges** Projekt kann nach Prüfung von Organisation und
aktuellen Konditionen als Staging genutzt werden. Supabase-Branching
gehört dagegen nicht zum Free-Tarif. Es wurde **kein** Staging-Projekt
angelegt und **kein** Geld ausgegeben.

Für Staging:
1. Zweites Free-Projekt in EU-Region mit eigenem Projekt-Ref anlegen.
   **Keine** produktiven Nutzer, Fotos, Nachrichten, JWT-Schlüssel oder
   `service_role`-Schlüssel kopieren.
2. Anwendungs-Schema/Migrationen kontrolliert in der erforderlichen
   Reihenfolge übernehmen. Bestehende Cronjobs, Push-Sendewege, E-Mail-
   Workflows und KI-Kontingente vor Staging-Ausführung separat prüfen.
3. Testkonten ausschließlich mit synthetischen Profilen und bestätigten
   RLS-/Kontaktbeziehungen erzeugen; nur genehmigte Fake-Inserate/Fotos
   verwenden. Relevante RLS-Policies bleiben aktiv.
4. Einen **Staging-Publishable-Key** verwenden. Niemals einen Secret-/
   Service-Role-Key und niemals das produktive Projekt als Ziel.
5. Mit wenigen HTTP-Anfragen beginnen. Eine simulierte Anzahl virtueller
   Clients aus einem Rechner ist kein Ersatz für echte Geräte oder
   2.000 individuell authentifizierte Nutzer.

## Bereits im Repo: streng abgegrenzter manueller HTTP-Lesetest

`scripts/staging-readonly-load.mjs` prüft die Staging-URL, den separaten
Projekt-Ref, die ausdrückliche Bestätigung und den erlaubten Schlüssel,
**bevor** die erste Netzwerkanfrage erfolgt. Das produktive Projekt ist
im Code ausdrücklich ausgeschlossen. Es führt **nur authentifizierte
lesende RPCs** aus, keine Uploads, kein Senden von Nachrichten und keine
Änderungen an Inseraten.

Erforderliche Umgebungsvariablen:

```text
FF_STAGE_REF=<anderer-Projekt-Ref>
FF_STAGE_URL=https://<anderer-Projekt-Ref>.supabase.co
FF_STAGE_PUBLISHABLE_KEY=<publishable-key-aus-dem-Testprojekt>
FF_STAGE_USERS_JSON=[{"email":"synthetisches-testkonto@example.invalid","password":"NUR-STAGING-PASSWORT"}]
FF_STAGE_CONFIRM=STAGING_ONLY
FF_STAGE_CONCURRENCY=10
FF_STAGE_DURATION_SECONDS=30
FF_STAGE_RPS=5
```

Die echten Werte gehören in eine lokal **gitignorierte** Datei wie
`.env.staging.local`, niemals in GitHub-Code oder öffentliche Chats.
Mit Node.js 22 kann der Test lokal gestartet werden:

```bash
node --env-file=.env.staging.local scripts/staging-readonly-load.mjs
```

Standard: maximal 10 parallele HTTP-Arbeiter und 5 Leseanfragen pro Sekunde
über 30 Sekunden. Für mehr als 50 Worker, 10 RPS oder 60 Sekunden muss
zusätzlich `FF_STAGE_HIGH_LOAD_CONFIRM=HIGH_LOAD_ON_STAGING_ONLY`
gesetzt werden. Harte Obergrenzen: 2.000 Worker, 100 RPS,
300 Sekunden, maximal 12.000 Anfragen pro Lauf.

Das Programm zeigt p50/p95/p99, HTTP-Statuscodes, Fehlerrate und
Aufrufzahlen je RPC. Zielwerte sind zunächst *hypothetische Testkriterien*
von p95 höchstens 2 Sekunden und Fehlerquote höchstens 1 %.
Ausbleibende Treffer in leeren Tabellen beweisen **keine** Skalierbarkeit.
Login-Aufrufe werden vorher durchgeführt und damit noch **nicht**
unter Last getestet; Push, Chat-Schreibpfad, KI und Fotoupload ebenfalls nicht.

## Operative Freigabegrenzen

Ein sicherer öffentlicher Launch erfordert unabhängig von dieser Phase:
eine getestete Wiederherstellung/Backup-Strategie, realistische Datenvolumen,
Staging-Lasttests mit gemischten Lese- und Schreibpfaden, Logs und
Alarmempfänger, wirksame Schutzlimits, ausreichend Moderationskapazität und
eine Entscheidung zu einem verlässlich verfügbaren Betriebstarif.

Die produktive Datenbank ist aktuell zu klein, um aus ihren Responsezeiten
eine tragfähige Nutzerobergrenze abzuleiten.
