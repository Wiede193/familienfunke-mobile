# Familienfunke – gegenseitiges Matching, Mitteilungen und Sicherheit (private Beta)

**Stand:** 19. November 2026 · Branch `design/profil-momente-benachrichtigungen`; `main` bewusst nicht verändert.

## 1. Gegenseitige Matches
- In der Nähe-Ansicht lässt sich eine freigegebene Familie nach rechts wischen oder über **Gefällt mir** auswählen. Nach links: **Weiter**.
- Ein einseitiges „Gefällt mir“ wird ausschließlich in `private.ff_swipe_likes` gespeichert und **nicht** in öffentlichen Profilen oder Benachrichtigungen veröffentlicht.
- Erst wenn beide beteiligten, weiterhin freigegebenen, sichtbaren und nicht blockierten Erwachsenenprofile die Opt-in-Nähe-Suche nutzen und beidseitig Interesse bekundet haben, legt `public.ff_swipe_interest(uuid)` eine bestätigte Kontaktverbindung an oder bestätigt eine vorhandene offene Anfrage.
- Statusprüfungen finden im Datenbankcode statt: Konto-/Altersfreigabe, Sichtbarkeit, aktive Umkreis-Opt-ins, höchstens 100-km-Umkreis und gegenseitige Sperrungen.
- Bei vorhandenen `accepted`-Kontakten wird kein zweiter Kontakt erstellt. `declined`/`cancelled`-Verbindungen werden nicht wiederbelebt.
- Die private Like-Tabelle ist für normale App-Konten weder lesbar noch direkt beschreibbar.
- Wird die Nähe-Suche deaktiviert, das Profil versteckt oder eine Person blockiert, werden zugehörige unbestätigte Likes entfernt.
- **„Es hat gefunkt!“** wird nur nach einer serverseitig bestätigten Verbindung angezeigt. Danach führt die Aktion in den bestehenden Chat, der weiterhin Nachrichtenlimits und Moderation verwendet.

## 2. Mitteilungen

Familienfunke hat bereits einen RLS-geschützten **Neuigkeiten-Bereich** in `public.ff_notifications` samt pro Nutzer einstellbaren Kategorien `public.ff_notification_preferences`:
- **Match:** bei erstmalig bestätigtem Kontakt, für beide Seiten
- **Kontaktanfrage:** für Empfänger einer neuen Anfrage
- **Nachricht:** für den Empfänger einer Nachricht in einer akzeptierten Verbindung; keine Kopie des Nachrichtentextes in der Benachrichtigung
- Der bestehende Neuigkeiten-Bereich wird beim Öffnen aktualisiert und erlaubt das Markieren gelesener Hinweise; einseitige Likes erzeugen keine Benachrichtigung.
- Die vorhandenen Sicherheitsfunktionen `private.ff_create_notification` und die Sperr-/Benachrichtigungs-Trigger bleiben die maßgeblichen Prüfstellen. Eine versehentlich parallel angelegte private Test-Inbox wurde wieder entfernt.

### Echte Push-Mitteilungen: vorbereitet, nicht aktiv
- Die Datenbank hat jetzt private Tabellen für eine **zukünftige freiwillige Push-Einwilligung** und Geräte-Token sowie RPCs zum Ändern/Widerrufen. **Derzeit existiert kein registriertes Gerät.**
- **Es werden noch keine Server-Push-Mitteilungen zugestellt.** Die mobile App benötigt eine konfigurierte `expo-notifications`-Integration mit nativen Geräteberechtigungen und eine **Development-/Release-Build** statt Expo Go, dazu Apple-/Android-Push-Credentials und einen abgesicherten Zustellprozess.
- Es wurde deshalb kein automatischer Push-Versand eingeschaltet, keine neue App-Berechtigung erteilt und kein Nutzer ungefragt für Push registriert.
- Offizielle Referenz: https://docs.expo.dev/versions/v58.0.0/sdk/notifications/ und https://docs.expo.dev/push-notifications/push-notifications-setup/

## 3. Sicherheit und Vertrauenswürdigkeit
- Die Kartenansicht zeigt bei freigegebenen Familien bereits die Erwachsenenprüfung sowie leicht auffindbare Aktionen **Melden** und **Blockieren**.
- Server-RPC verhindert Selbst-Likes, Kontakte zu fremden nicht freigegebenen Konten, gesperrte Konten und nicht gegenseitig bestätigte Matches.
- Ein bestehender bestätigt chatbarer Kontakt bleibt erhalten; keine neuen freien Chat-Schreibrechte.
- Private Push-Geräte-Tokens sind für App-Konten nicht direkt auslesbar. Nutzer können die künftige Push-Einwilligung über eine authentifizierte RPC entfernen.
- Auch ein privater Standort bleibt als grober PLZ-Mittelpunkt geschützt; keine GPS-Daten werden veröffentlicht.

## Serverprüfungen
- Migration `ff_mutual_swipe_matches_20261119` und Hotfix `ff_swipe_mutual_pending_and_optout_20261119` sind angewendet.
- Vorhandene Kontakte innerhalb einer **ROLLBACK-Transaktion** korrekt als `matched` erkannt; gleichzeitige Standort-Opt-ins nur temporär angelegt.
- Selbst-Like und unbekanntes/nicht teilnehmendes Ziel in authentifizierten ROLLBACK-Tests abgelehnt.
- Temporäre Nachricht in einem bestätigten Chat erzeugte genau eine Nachricht-Benachrichtigung für den Empfänger, anschließend durch `ROLLBACK` rückgängig gemacht.
- SQL-Audit: `anon` kann die Like-RPC nicht ausführen. `authenticated` darf private Likes und Geräte-Tokens nicht direkt lesen. Bestand der vorhandenen 27 Nachrichten blieb erhalten.

## Vor der Freigabe
1. Mit zwei echten Testkonten erstmaliges gegenseitiges Like einschließlich offenem Kontaktwunsch und parallelen Anfragen testen.
2. Blockieren/Melden, Wiederfreigabe, Opt-out, neue Registrierung und Wechsel zwischen zwei Konten im UI prüfen.
3. Datenschutzprüfung zu Match- und Nähe-Suche (Rückschlussrisiken, Missbrauch durch massenhafte Testkonten).
4. Für echte Push-Mitteilungen zuerst native Entwicklungs-App/Apple- und Android-Zertifikate, `expo-notifications` und eine datensparsame, authentifizierte Zustellung hinzufügen, dann nur nach ausdrücklicher Nutzerzustimmung einschalten.
5. App in Expo Go manuell prüfen. Automatische Expo-Bundlechecks ersetzen keinen Interaktionstest.

**Keine Veröffentlichung nach `main` und keine Behauptung, dass echte Remote Pushs bereits funktionieren.**
