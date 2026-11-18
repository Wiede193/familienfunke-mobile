# Familienfunke – Benachrichtigungen und Spam-Schutz (Konzept)

## Ziel
Die Navigation erhält kleine numerische Badges für tatsächlich neue Ereignisse:
- Entdecken: neue passende, freigegebene Familien in einer groben Region (keine exakten Standortdaten)
- Kontakte: neue eingehende Kontaktanfragen
- Nachrichten: ungelesene Nachrichten
- Kalender: neue sichtbare, freigegebene Termine
- Profil: neue freigegebene Fotos von bestätigten Kontakten (gegebenenfalls an anderer geeigneter Stelle als Profil-Badge)

## Datenbasis
Bisher gibt es laut App-Code die Tabellen profiles, contact_requests, messages, events und profile_photos.
Es fehlen verlässliche serverseitige Lesebestätigungen / pro Nutzer gespeicherte gesehen-Zeitpunkte.
Die bloße Anzahl geladener Nachrichten ist *keine* korrekte Ungelesen-Zahl.

Vor einer Aktivierung der Badges:
1. Bestehendes Supabase-Schema und RLS-Policies prüfen.
2. Pro Gespräch einen nutzergebundenen Lesezeitpunkt / last_read_message bzw. read_at erfassen.
3. Für neue Familien, Termine und Fotos nutzerbezogene Ereignis-Zeitpunkte oder sichtbare Cursor speichern.
4. Badges nur aus tatsächlich berechtigten, freigegebenen und noch nicht gesehenen Daten berechnen; blockierte Konten ausschließen.
5. Optional Supabase Realtime, dabei Polling und Reconnect-Verhalten berücksichtigen.

## Schutz vor Nachrichtenflut
Zielregel: Maximal 5 aufeinanderfolgende Nachrichten einer Familie pro Gespräch, solange die andere Seite nicht geantwortet hat.
Unbedingt im serverseitigen Supabase-Edge-Function-Workflow send-message atomar prüfen. UI darf eine verständliche Nachricht zeigen, ersetzt die Serverprüfung aber nicht.
- Ein fremder Reply setzt die Folge für den nächsten Sender zurück.
- Gleichzeitige Anfragen und Geräte müssen sauber serialisiert werden.
- Rate-Limits pro Zeitfenster und Missbrauchs-/Blockregeln zusätzlich prüfen.
- Niemals bestehende RLS-Policies mit ungetesteten SQL-Skripten überschreiben.

## Abgrenzung
Dieser Entwurf implementiert das neue Familienprofil und den Made-in-Germany-Beta-Designstempel.
Die Benachrichtigungszähler und der serverseitige Spam-Schutz sind noch nicht implementiert und müssen vorab anhand der tatsächlichen Datenbank / Edge Functions umgesetzt und getestet werden.
