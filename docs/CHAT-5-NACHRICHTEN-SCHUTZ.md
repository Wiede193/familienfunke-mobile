# Familienfunke – fünf aufeinanderfolgende Nachrichten ohne Antwort

**Stand: 19.11.2026 – noch nicht aktiv auf dem Supabase-Server.**  
Dieser Entwurf liegt im GitHub-Entwicklungs-Branch und darf erst nach Schema-/Sicherheitstests in der Datenbank eingesetzt werden.

## Gewünschtes Verhalten
- Pro **bestätigtem Chat** dürfen A und B jeweils **höchstens fünf eigene Nachrichten hintereinander** schreiben, solange die andere Familie nicht antwortet.
- Die **sechste** unmittelbar folgende Nachricht desselben Absenders wird von PostgreSQL abgewiesen.
- Sobald die andere Familie eine eigene Nachricht sendet, beginnt für sie eine neue Folge; der bisherige Absender kann dann wieder schreiben.
- Die Grenze zählt **pro Chat/Kontakt-ID**, nicht für alle Unterhaltungen zusammen.
- Diese Regel gilt auch außerhalb der App-Oberfläche. Die Existenz eines Kontakts, die Autorisierung, RLS und Inhaltsmoderation sind **separate** Sicherheitsprüfungen.

## Vorbereitete Änderungen
1. `supabase/migrations/20261119070000_five_unanswered_messages.sql`: 
   - `BEFORE INSERT`-Trigger auf `public.messages`.
   - Sperrt den zugehörigen Datensatz in `public.contact_requests` mittels `FOR UPDATE`, damit gleichzeitige Nachrichten nacheinander gezählt werden.
   - Setzt `created_at` nach dem Lock auf die tatsächliche **Serverzeit**, um manipulierte Client-Zeitstempel zu vermeiden.
   - Prüft, ob die letzten fünf Nachrichten im Chat alle vom selben Absender stammen, und wirft bei einer sechsten `FF_MSG_LIMIT_5`.
   - Legt einen Index auf `contact_id, created_at DESC, id DESC` an.
2. `App.jsx`: Bereitet eine verständliche Fehlermeldung vor, wenn die vorhandene `send-message`-Edge-Function den Fehlercode `FF_MSG_LIMIT_5` an die App weitergibt.

## Nicht erledigt – wichtig vor echter Aktivierung
- **Kein Zugang zur aktiven Supabase-Datenbank** in diesem Arbeitsschritt. Das SQL wurde weder ausgeführt noch die aktive Datenbankstruktur geprüft.
- Der aktuelle Quelltext der tatsächlich bereitgestellten `send-message`-Edge-Function liegt **nicht** in diesem GitHub-Repository. Sie wurde nicht geändert.
- Die Edge-Function muss den PostgreSQL-Fehler `FF_MSG_LIMIT_5` als maschinenlesbaren Code weiterreichen (z. B. HTTP 409 + JSON `{"code":"FF_MSG_LIMIT_5"}`) und weiterhin Authentifizierung, Kontaktfreigabe, Moderation und andere Verbote prüfen. Andernfalls sieht die App nur einen allgemeinen Sendefehler.
- Prüfen, ob Benutzer Nachrichten löschen oder Zeitstempel/Absender verändern können. **Kann ein Benutzer seinen Verlauf löschen, lässt sich eine rein verlaufsbasierte Beschränkung möglicherweise umgehen**. Für eine vollständige Absicherung müssen UPDATE/DELETE-Policies und mögliche Moderationslöschungen überprüft werden; ggf. eine separate unveränderbare serverseitige Zählung vorsehen.
- Prüfen, ob `public.messages` die Spalten `id`, `contact_id`, `sender_id`, `created_at` besitzt, und `contact_requests.id` als Elternzeile existiert. Erwartete Typen/Indexkollisionen vor Migration prüfen.
- Kein Test auf einer Staging-Datenbank durchgeführt. **Kein ungetestetes SQL ins produktive Projekt kopieren.**

## Testfälle für eine Staging-Datenbank
| Fall | Erwartung |
|---|---|
| A sendet in Chat X fünf Nachrichten in Folge | 5 Nachrichten gespeichert |
| A sendet eine sechste in Chat X | Insert abgelehnt, Code `FF_MSG_LIMIT_5` |
| B antwortet in Chat X einmal; A sendet danach | A darf wieder schreiben |
| A schreibt in Chat Y während X gesperrt ist | Chat Y nicht betroffen |
| A und B senden knapp gleichzeitig | keine sechste aufeinanderfolgende Nachricht gespeichert |
| B sendet sechs eigene Nachrichten direkt hintereinander | B wird beim sechsten Versuch genauso begrenzt |
| Fremdes Konto / unbestätigte Kontaktanfrage | weiterhin durch bestehende RLS/Edge-Function verboten |
| Benutzer sendet mit gefälschtem `created_at` | Datenbank setzt den tatsächlichen Serverzeitpunkt |
| Benutzer versucht, eigene Nachrichten zu löschen | DELETE-RLS / auditierter Zähler verhindert unerlaubtes Umgehen |
| Edge-Function erhält `FF_MSG_LIMIT_5` | gibt eine maschinenlesbare Kennung an die App zurück |
| App erhält `FF_MSG_LIMIT_5` | deutsche Meldung, Entwurfstext im Eingabefeld bleibt stehen |
| App erhält anderen Fehler | bisherige Moderations- und Netzwerkfehler weiterhin korrekt |

## Aktivierungsweg
1. Supabase-Projekt **explizit auswählen** und Schema/Policies/Edge-Function prüfen.
2. Migration in einer Staging-Datenbank einspielen und alle Testfälle erfüllen.
3. Funktion `send-message` so anpassen, dass der Fehlercode durchgereicht wird; bestehende Prüfungen beibehalten.
4. Erst nach fachlicher Freigabe für das aktive Projekt deployen.
5. Danach Tests mit zwei echten Beta-Konten auf iPhone und Android und einen Rollback-Plan dokumentieren.

**Status:** Implementierung im Quellcode vorbereitet; Schutzregel noch nicht live.
