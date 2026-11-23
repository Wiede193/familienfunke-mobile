# Beschluss-Monitor: sicherer Quellenabgleich

## Fakten, die wir auseinanderhalten

1. **Belegter aktueller Rechtsstand:** `ff_official_decisions.decision_status`, durch eine Redaktion anhand offizieller Unterlagen bestätigt. `status_checked_at` ist das tatsächliche Prüfdatum.
2. **Technischer Quellenabruf:** `last_official_check_at` und `ff_decision_source_snapshots`. Eine erfolgreiche HTTP-Abfrage bestätigt **nicht**, dass eine alte Rechtslage weiterhin gilt.
3. **Mögliche Änderung:** `ff_decision_change_candidates`. Nur intern zugänglich, niemals automatisch Gesetz oder Benachrichtigung. Webseitenänderungen können sich auch auf Layout, Cookie-Banner und technische Details beziehen.
4. **Bestätigte Statusänderung:** `ff_decision_status_history`, inklusive amtlichem Beleg. Nur nach expliziter redaktioneller Freigabe wird die öffentliche Statusanzeige geändert und für abonnierte Themen ein In-App-Hinweis ausgelöst.

## DIP-Parlamentsdaten

DIP-Beispielvorgänge: antragsloses Kindergeld (`333136`) und Kita-Startchancen (`338785`). Nur tatsächlich geprüfte Verknüpfungen in `dip_vorgang_id` speichern. Die API erfordert `DIP_BUNDESTAG_API_KEY` **als Server-Umgebungsvariable**, nicht im App-Code oder im SQL-Cron. Offizielle Hilfe: https://dip.bundestag.de/über-dip/hilfe/api

Fehlt der gültige Schlüssel, werden nur die offiziellen, erlaubten Quellwebseiten geprüft; `ff_decision_tracking_runs.dip_configured=false` signalisiert diesen Zustand. Keine automatische Annahme, der DIP-Abgleich habe stattgefunden. Die DIP-Angabe »Abgeschlossen« ist ausdrücklich kein Nachweis von Verkündung oder Inkrafttreten. Eine Eintragung in `inkrafttreten` kann einzelne Paragrafen oder zeitversetzte Termine betreffen.

## Redaktioneller Prüfablauf (ausschließlich Datenbankverwaltung, nicht per User-App)

Anstehende Hinweise im Supabase SQL Editor **ohne fremde Nutzerinformationen** ansehen:

```sql
select c.id,c.source_kind,d.title,d.decision_status,c.observed_source_status,
       c.proposed_status,c.evidence_url,c.first_seen_at
from public.ff_decision_change_candidates c
join public.ff_official_decisions d on d.id=c.decision_id
where c.review_state='pending'
order by c.first_seen_at
limit 30;
```

Die Quelle **vor** einer Änderung öffnen; soweit nötig, DIP, Bundesrat und Bundesgesetzblatt abgleichen. Ein Kabinettsentwurf ist kein gültiges Gesetz. Ein Vermittlungsverfahren kann weitere Beschlüsse benötigen. In-Kraft-Treten-Termine nicht aus dem Veröffentlichungsdatum ableiten.

Bestätigten Stand mit nachvollziehbarer Begründung (mindestens 30 Zeichen) übernehmen:

```sql
select private.ff_confirm_decision_status(
  '<CANDIDATE_UUID>'::uuid,
  'parlament',
  'Amtliche Quelle geprüft: parlamentarischer Beschluss mit Datum und Nachweis, kein Inkrafttreten behauptet.'
);
```

Bei reinen technischen Seitenänderungen (mindestens 20 Zeichen Begründung):

```sql
select private.ff_dismiss_decision_candidate(
 '<CANDIDATE_UUID>'::uuid,
 'Nur Webseitenlayout geändert, keinerlei neue Beschlussinformation.'
);
```

Die Funktionen sind nicht für `anon` oder `authenticated` ausführbar; nur Betreiber mit privilegierter Datenbankrolle dürfen sie ausführen. Die Benachrichtigungszentrale zeigt den Titel statt sensibler Daten, und eine weitere Statusänderung hat eine eigene, deduplizierte ID. **Kein Sperrbildschirm-Push** für diese Kategorie.

## Betriebsprüfung

```sql
select started_at,checked_pages,checked_dip,new_candidates,dip_configured,errors
from public.ff_decision_tracking_runs order by id desc limit 10;
```

Bei `errors` und wiederholten Quellfehlern keine juristische Richtigkeit suggerieren. Der Monitor kontrolliert aus Lastschutzgründen höchstens 15 Einträge pro Lauf und bevorzugt die am längsten nicht geprüften. Er ist kein vollständiger Ersatz für das Bundesgesetzblatt oder Rechtsberatung.
