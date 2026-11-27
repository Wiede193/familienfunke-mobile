# Zwei-Konten-Abnahme – 27.11.2026

## Aktueller Nachweis
- Native CI für die Sicherheitsänderungen: beide Läufe 45964769663 und 45964837212 erfolgreich (iOS- und Android-JS-Bundles, kein Gerätetest).
- Zusätzliche SQL-Tests mit drei vollständig zurückgerollten synthetischen Identitäten: 10/10 bestanden. Unverifizierte und suspendierte Konten sehen keine fremden Profile, Anzeigen oder Fotodatei-Metadaten; Kontaktaufnahmen sind gesperrt. Suspendierte Konten können den Chat nicht lesen; Versand an suspendierte Konten wird verweigert.
- Separates Staging-Projekt `trzficaeaczqpizgydbz` ist aktiv, EU-Central-1, zusätzliches Projekt laut Kostenprüfung 0/Monat. Schema aus Live-Katalogen übertragen: 65 Tabellen (alle mit RLS in Staging), 299 Constraints, 92 zusätzliche Indizes, 76 identische Policies (inkl. Storage), 25 Trigger, 120/123 Datenbankfunktionen. Tabellen- und Spaltenrechte für Clientrollen entsprechen Produktion. Ausgelassen: ff_market_review_retry_tick, ff_push_tick, ff_ops_capture_snapshot; keine Produktions-Cronjobs, Nutzerdaten oder Secrets übernommen.
- Staging SQL-Regressionsprüfung: 16/16 bestanden, einschließlich Profilerstellung, Kontaktanfrage, Chat-Isolation, freigegebene/unfreigegebene Fotos und Anzeigen, Blockieren und alter Chat. Alle Testzeilen zurückgerollt; 0 Konten und 0 Dateien.
- Edge-Funktionen send-message, moderate-content und moderate-photo in Staging aktiv (Version 1). Live-KI-Moderation benötigt einen eigenen OPENAI_API_KEY in Staging. Keine produktiven Secrets kopiert.
- Live-HTTP-Abnahme weiterhin nicht ausgeführt: echte Auth-Testkonten, Staging-API-Konfiguration und GitHub-Environment-Secrets fehlen. Produktionsdatenbank bleibt als Testziel gesperrt. Andere Edge-Funktionen, Cronjobs und Inhalts-Seeds wurden nicht übernommen; Staging ist keine vollständige Produktionskopie.

## Automatische Live-Abnahme
1. Staging-Schema und private Buckets sind eingerichtet. In Staging unter Edge Functions → Secrets einen separaten OPENAI_API_KEY hinterlegen, keine Produktionsschlüssel verwenden. Auth-Testkonten über Authentication → Users anlegen (bestätigte E-Mail). Anschließend ausschließlich diese Testkonten freigeben und sichtbar machen. Keine Produktionsdaten kopieren.
2. Drei neue synthetische Auth-Konten mit E-Mail-Präfix `qa-`, jeweils individuellem Passwort (mindestens 12 Zeichen), freigegebenem, sichtbarem Profil, bestätigter Erwachsenen-Verifikation und nicht gesperrter Mitgliedschaft vorbereiten. Keine bestehenden Kontakte oder Blockierungen. A/B sind die Testfamilien, C ist die unbeteiligte Kontrollfamilie.
3. In GitHub Settings → Environments → `staging-qa` die Variablen FF_STAGE_REF und FF_STAGE_URL und die Secrets FF_STAGE_PUBLISHABLE_KEY und FF_STAGE_USERS_JSON hinterlegen. JSON-Format: Liste von drei Objekten mit email und password. Niemals den Service-Role-Schlüssel oder tatsächliche Familienkonten verwenden.
4. Actions → Staging account isolation (manual) → Run workflow; Bestätigung: FRESH_SYNTHETIC_ACCOUNTS_ONLY.
5. Nach dem Lauf die ausschließlich synthetischen Testdaten in Staging bereinigen. Das Skript entfernt bei Erfolg das eigene Profilfoto, lässt Marktplatzanzeige, Kontakte und Blockierungen bewusst für die Inspektion stehen. Bei Abbruch können weitere Testdaten verbleiben. Für Wiederholung neue Testkonten verwenden.

Der Test prüft echte Anmeldungen, Kontaktannahme, Moderation und Nachrichten, einen realen synthetischen JPEG-Upload in beide privaten Buckets, unberechtigte Dateizugriffe, fremde Anzeigenbearbeitung und Blockierung. Er gibt keine Zugangsdaten, Nutzerdaten oder signierten Links aus. Ein Fehler bricht ab; der Lauf darf nicht als bestanden gelten.

## Manuelle Abnahme (Android und iOS)
- A und B auf getrennten Geräten anmelden, gegenseitig suchen, Anfrage annehmen, Nachricht und Antwort senden; C darf nichts davon lesen.
- Eigenes synthetisches Profilfoto und Anzeige hochladen, Freigabe über Staging-Moderation durchführen. Vor Freigabe nur Eigentümer sichtbar; nach Freigabe Profilfoto nur für bestätigte Kontakte, Anzeige entsprechend Marktplatzregeln.
- Blockieren: keine neue Kontaktannahme, Nachricht, Profil- oder neue Fotozugriffe, keine fremden Anzeigen des blockierten Kontos; alter Chat bleibt für ursprüngliche Teilnehmer lesbar.
- Bereits erstellte signierte Links separat vor und nach Ablauf testen; Download-Kopien können nicht zurückgerufen werden.
- A abmelden und B am selben Gerät anmelden: keine alten privaten Bilder, Chats, Suchdaten oder Benachrichtigungen im UI. Auch unter langsamer Verbindung testen.
- Suspendierung / fehlende Verifikation prüfen; Passwortschutz und Admin-MFA im Dashboard prüfen.
- Testdatum, App-Version, Plattform, Prüfschritt und Ergebnis ohne persönliche Daten dokumentieren.

Öffentliche Freigabe erst nach erfolgreicher Live-HTTP- und Geräteabnahme.
