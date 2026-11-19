# Familienfunke – Benachrichtigungsanzeigen der privaten Beta
Stand: 19.11.2026. Nur im Design-/Entwicklungs-Branch, nicht in `main` veröffentlicht.

## Jetzt integriert
- Kleine Zähler im unteren Menü für **Entdecken**, **Kontakte**, **Nachrichten** und **Kalender**, nur bei Zahl > 0; keine dekorativen Platzhalter.
- **Kontakte:** offene an *mich* gerichtete Kontaktanfragen (bis zum Annehmen/Ablehnen) sowie neue, freigegebene Fotos bestätigter Kontakte (seit lokalem Lesestand).
- **Nachrichten:** eingegangene Nachrichten bestätigter Kontakte nach der letzten Öffnung des **jeweiligen** Chats; eine zusätzliche Markierung erscheint in der Chatliste.
- **Kalender:** noch offene Teilnahmeanfragen zu selbst erstellten Terminen, außerdem neue freigegebene anstehende Events seit lokalem Kalender-Lesestand.
- **Entdecken:** neue Profile mit einer gemeinsamen Vorliebe in exakt derselben freiwillig angegebenen **groben** Region seit lokalem Entdecken-Lesestand (keine GPS-Nähe).
- Kontakte haben jetzt einen **Profil ansehen**-Knopf, um freigegebene Fotos bestätigen Kontakts direkt anzusehen.
- Im App-Kopf ist **Neuigkeiten aktualisieren** zum manuellen erneuten Abruf der vorhandenen Backend-Daten vorgesehen.

## Grenzen
- Keine Push-Benachrichtigungen, keine automatischen Hintergrundprüfungen.
- Die Nachrichten-, Foto-, Event- und Familien-Lesestände liegen in AsyncStorage **pro Benutzerkonto und Gerät**. Sie werden nicht serverseitig synchronisiert und können beim Löschen/Neuinstallieren verloren gehen.
- Beim allerersten Start wird der Zeitpunkt als Ausgangsstand gesetzt. Bereits ältere Nachrichten werden darum nicht rückwirkend pauschal als ungelesen markiert.
- Neue Freigaben bereits früher erstellter Fotos/Termine sind ohne verlässlich bereitgestellte serverseitige Freigabe-Zeitstempel nicht in allen Fällen erkennbar.
- Für mehr als die bestehenden Datenabfrage-Limits oder mehrere Endgeräte benötigen wir einen backendseitig gepflegten Lesestatus und paginierte Anfragen.
- Zähler zeigen nur Elemente, die der angemeldete Nutzer über bestehende RLS-Regeln abrufen kann. Sie ersetzen weder RLS noch Sicherheits-/Berechtigungsprüfungen.
- Keine sensiblen Inhalte oder Nachrichten-Vorschauen im Badge oder lokal gespeicherten Lesestand.
- Noch keine iPhone-/End-to-End-Tests durchgeführt. Nicht vor einem Test öffentlich verteilen.

## Spätere vollständige Umsetzung
- Serverseitig gespeicherter Lesestatus pro Chat/Konto und verlässliche Zeitpunkte für Freigaben/neu eingehende Ereignisse.
- RLS-geprüfte Trigger/Benachrichtigungs-Ereignisse statt kompletter Datenbank-Listen.
- Optional Push nur nach explizitem Opt-in, mit Datenschutzkonzept und Benachrichtigungsrechten.
- Verlässliche Hintergrundübertragung und optional Einstellungen nach Benachrichtigungskategorie.

## Qualitätschecks vor Merge
1. Zwei Testkonten: A sendet B einen Kontaktwunsch -> nur B bekommt einen Kontakt-Zähler; Annahme entfernt ihn.
2. In einem bestätigten Chat A an B schreiben, B Daten aktualisieren -> Nachrichtenzähler; B öffnet Chat -> Zähler für diesen Chat verschwunden; andere Chats bleiben ungelesen.
3. Eine neue Freigabe eines Kontakt-Fotos und Kalenderaktivität beobachten; neuere Daten korrekt im Backend vorhanden; keine Zähler für unfreigegebene Inhalte.
4. Entfernen/Blockieren eines Kontaktes -> kein Zähler aus dessen Chat oder Fotos.
5. Tab-Wechsel, Neustart, Abmeldung und Wiedereinloggen mit dem *anderen* Testkonto; keine Leckage des Lesestands.
6. Kontrollieren, dass das Profil und der Familien-Kompass weiterhin funktionieren.
