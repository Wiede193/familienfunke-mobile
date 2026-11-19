# Nachrichtenbegrenzung: maximal fünf unbeantwortete Nachrichten

**Status: Serverregel aktiv im Supabase-Projekt „Family Sparkle“ seit 19.11.2026.**

## Verhalten

- Pro bestätigter Kontaktverbindung sind **bis zu fünf eigene Nachrichten in direkter Folge** zulässig.
- Die **sechste Nachricht wird serverseitig abgelehnt**, auch wenn jemand die mobile Oberfläche umgeht.
- Schreibt die andere Familie eine Nachricht, beginnt der Zähler für beide Richtungen erneut bei null.
- Die mobile App zeigt „n von 5“ an. Nach fünf eigenen Nachrichten wird der Eingabebereich gesperrt und „Antworten prüfen“ zum erneuten Datenabruf angeboten.
- Die Supabase-Edge-Funktion `send-message` gibt bei Begrenzung HTTP **429** und eine verständliche Meldung aus. Sonstige Moderations-, Blockierungs- und Berechtigungsprüfungen bleiben erhalten.

## Umsetzung

- GitHub: `supabase/migrations/20261119070000_five_unanswered_messages.sql`
- Supabase-Migrationshistorie: `20261119061358_ff_five_unanswered_messages_20261119` (angewendet)
- PostgreSQL: `BEFORE INSERT`-Trigger `ff_limit_unanswered_messages` auf `public.messages`
- Triggerfunktion: `private.ff_guard_five_unanswered_messages`, nicht öffentlich ausführbar
- Edge Function: `send-message`, aktive Version **5**
- GitHub-Quellspiegel: `supabase/functions/send-message/index.ts`
- React-Native-App: `App.jsx` mit lokaler Chat-Anzeige und Status-429-Behandlung im Design-Branch
- Der Server ermittelt die tatsächliche Nachrichtenfolge innerhalb derselben Kontakt-ID nach `created_at, id`, sperrt die zugehörige Kontaktzeile mit `FOR UPDATE` und setzt den Nachrichtenzeitpunkt selbst. Dies verhindert Manipulation per vorgegebenem Zeitstempel und serialisiert parallele Einfügungen pro Kontakt.

## Verifiziert

Am 19.11.2026 auf dem verknüpften Supabase-Projekt:

1. Datenbankschema bestätigt (`contact_requests`, `messages`, bestehende Auth-/Moderationsprüfungen).
2. Trigger ist aktiviert. Privilegierte Funktion befindet sich im Schema `private`; `authenticated` hat kein direktes `INSERT`, `UPDATE` oder `DELETE` auf `messages`.
3. Test in einer **zurückgerollten** Untertransaktion: fünf gleiche Absender in Folge erlaubt, sechste Nachricht zurückgewiesen, die Antwort des zweiten Absenders erlaubt danach wieder eine Nachricht.
4. Durch die Transaktion wurden **keine** Testnachrichten dauerhaft eingefügt. Gesamtbestand vor/nach Test: 27 Nachrichten.
5. Aktive Serverfunktion hat Version 5 und enthält die Fehlerzuordnung auf HTTP 429; in GitHub stehen die entsprechenden Source-Files bereit.

## Noch zu prüfen

- Gemeinsamer E2E-Test mit angemeldeten Konten und realer Expo-Go-App sowie HTTP-429-Anzeige unter Livebedingungen.
- Separater Parallelitätstest mit zwei gleichzeitigen authentifizierten Sendungen.
- Server-seitige RLS-/Security-Review vor öffentlicher Beta und Belastungstest bei höherem Nachrichtenaufkommen.

**Wichtig:** Der Schutz läuft schon in der verknüpften Supabase-Datenbank, aber die Chat-Anzeige im neuen Entwicklungsbranch ist noch nicht in die Hauptversion `main` übernommen und nicht auf dem iPhone getestet.
