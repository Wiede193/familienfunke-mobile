# Familienfunke – gegenseitige Matches, Neuigkeiten und Vertrauen
**Stand:** 19. November 2026. Entwicklungsbranch `design/profil-momente-benachrichtigungen`, **nicht nach main übertragen**.

## 1. Gegenseitige Matches

Im Nähe-Kartenmodus steht jetzt **„♡ Gefällt mir“** statt einer sofortigen Kontaktanfrage. Bei einem einzigen Like wird nur die private Tabelle `private.ff_swipe_likes` ergänzt und der andere Nutzer NICHT über dieses einzelne Interesse informiert.

Erst wenn **beide Familien** in der Nähe-Suche ausdrücklich „Gefällt mir“ wählen, erzeugt die Datenbank eine bestätigte Verbindung in der bestehenden Tabelle `contact_requests`. Die App zeigt **„Es hat gefunkt!“** und ermöglicht einen Chat. Kontaktanfragen, die bereits vor der Änderung bestanden, bleiben erhalten; der eingehende Antrag kann weiterhin über die Kontakte bestätigt oder abgelehnt werden. Bereits akzeptierte Kontakte bleiben unverändert.

Die RPC `ff_swipe_interest` prüft in der DB gegenseitige Zustimmung, Verifizierung/Erwachsenenstatus, Sichtbarkeit, gegenseitige Blockierung und bereits freiwillig aktivierte Nähe-Suche. Transaktionen und ein gemeinsamer Sperrschlüssel für beide Wischrichtungen verhindern doppelte Kontakte bei gleichzeitiger Auswahl.

**Sicherheitsgrenzen:** Keine einseitigen Like-Listen, keine Like-Pushs, keine neuen direkten Schreibrechte auf private Tabellen. Entfernen aus der Profilsuche oder Blockierung löscht gespeicherte Likes. Ablehnungen/abgebrochene Kontaktereignisse werden nicht automatisch erneut aktiviert. Die bestehenden Regeln zur Freigabe von Bildern und zum Chat mit maximal fünf unbeantworteten Nachrichten bleiben bestehen.

## 2. Neuigkeiten in der App – aktiv

Ein neuer Hinweisbereich in `components/NotificationCenter.jsx` ist über das Symbol in der Kopfzeile und über **Profil → Neuigkeiten** erreichbar:

- Neue Kontaktanfrage
- Gegenseitig bestätigtes Match („Es hat gefunkt!“)
- Neue Nachricht von einem bestätigten Kontakt

Die Quelle ist `public.ff_notifications`: Trigger erzeugen Ereignisse nur nach tatsächlichem Kontakt- oder Nachrichtenvorgang. Diese Hinweise enthalten **keinen Nachrichtentext, kein Foto und keine bloßen einseitigen Likes**. Der Kontoinhaber kann seinen Lesestand ändern, aber keine fremden Hinweise lesen oder selbst neue Hinweise erfinden. Nach dem Bestätigen/Ablehnen/Zurückziehen einer Kontaktanfrage wird der inzwischen unzutreffende Anfragehinweis entfernt. Beim Blockieren werden wechselseitige Hinweise entfernt.

In `public.ff_notification_preferences` kann jede Familie **Match-, Anfrage- und Nachrichtenhinweise separat ausschalten**. Die Einstellung gilt für neue Ereignisse. Die Mitteilungen werden bei neuem Abruf des App-Backends angezeigt, nicht als Hintergrund-Push.

## 3. Echte Push-Nachrichten – vorbereitet, derzeit NICHT aktiv

`private.ff_push_devices` und die `ff_push_register`-/`ff_push_is_registered`-RPCs sind für spätere Registrierung eines Expo-Push-Tokens vorbereitet. Die Tabelle ist für reguläre Clients nicht direkt zugänglich; Abmelden/Abschalten über die RPC löscht die gespeicherten Tokens. Aktuell wird **kein Token von der App erfasst**, es gibt keinen laufenden Push-Dispatcher und es wird noch keine externe Push-Nachricht ausgelöst.

Weshalb: `expo-notifications` und die benötigten nativen Konfigurationen/Benachrichtigungs-Zugangsdaten sind noch nicht als installierte Entwicklungs-App bereitgestellt. Echte Remote-Push-Nachrichten können nicht zuverlässig mit dem bislang genutzten Expo Go getestet werden. Für die Fertigstellung sind erforderlich:

1. Projektpassendes `expo-notifications` und `expo-constants` inklusive Lockdatei und App-Plugin hinzufügen, Android-Benachrichtigungskanal konfigurieren.
2. Eine EAS-Entwicklungs-App mit den korrekten Android-FCM-/iOS-APNs-Zugangsdaten und dem bestehenden EAS-Projekt bauen.
3. **Erst nach eindeutiger Einwilligung auf dem Gerät** das Berechtigungsdialogfeld öffnen und den gerätespezifischen Token über die gesicherte RPC registrieren.
4. Server-Dienst, der **nur für registrierte und zugelassene Geräte** serverseitige Benachrichtigungen verschickt, mit Ratenbegrenzung, Zustellungsprüfung, Fehlerbehandlung und Opt-out bei Abmeldung/Blockierung.
5. Gerätetests mit zwei Nutzerkonten, geschlossener App, verweigerter Zustimmung, Gerätewechsel und erneutem Abmelden.

Es ist deshalb absichtlich **kein funktionsloser Push-Schalter** im UI eingebaut, der bereits laufende Pushs suggerieren würde.

Expo-Dokumentation: https://docs.expo.dev/push-notifications/push-notifications-setup/

## 4. Sichtbarer Vertrauens- und Missbrauchsschutz

In `components/NearbySwipe.jsx` zeigt jede Karte einen Hinweis auf das überprüfte Erwachsenenprofil. **„Melden“** und **„Blockieren“** sind direkt auf der Karte zugänglich und nutzen das bestehende Bericht-/Blockierungssystem. Fremde Familienfotos werden ohne bestehenden bestätigten Kontakt nicht freigegeben.

## Prüfungen

- Supabase-Migrationsstatus für Likes, Mitteilungen, Gerätestatus geprüft.
- Datenbanktests in **ROLLBACK**-Transaktionen: vorhandene bestätigte Verbindung korrekt erkannt; eigenes Profil als Like-Ziel abgelehnt; Hinweise für andere Konten nicht lesbar/änderbar; doppelte Match-Hinweise nur einmal; abgeschaltete Match-Hinweise nicht erzeugt; Probe-Push-Token registriert/gelöscht, ohne einen echten Token zu speichern.
- GitHub prüft JavaScript-Regeln, Expo-Konfiguration, Android-Bundle und iOS-Bundle.
- Noch offen: echte Ende-zu-Ende-Tests auf dem iPhone und unabhängige Sicherheits-/Datenschutzprüfung vor öffentlicher Veröffentlichung.

**Keine Änderungen an der pausierten Idee „zusätzliche Familienfilter“ oder „Treffen nach einem Match planen“.** Bereits vorhandene Funktionen bleiben erhalten.
