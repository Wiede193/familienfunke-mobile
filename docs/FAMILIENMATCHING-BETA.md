# Familienfunke – transparentes Familien-Matching

Stand: 19. November 2026 · Entwicklungsbranch `design/profil-momente-benachrichtigungen`, kein Merge nach `main`.

## Ziel
Die Suche soll zeigen, warum Familien vielleicht gemeinsame Aktivitäten und Interessen haben, ohne pseudogenaues Prozent-Matching, GPS-Entfernungen oder sensible Familienmerkmale zu erfinden.

## Matching-Signale
1. **Identische ausgewählte Interessen** – case-insensitiv und ohne doppelte Zählung; z. B. beide nennen „Wandern“.
2. **Ähnliches Thema** – beide wählen unterschiedliche Aktivitäten aus derselben Untergruppe (z. B. „Schwimmen“ und „Radfahren“ unter „Sport & Bewegung“). Anzeige ausdrücklich als *ähnliche Themen*, nicht als identische Vorliebe.
3. **Exakt gleiche freiwillig angegebene grobe Region** – nach Normalisierung von Leerzeichen und Schreibweise. Keine Aussage über Entfernung oder Erreichbarkeit. „Müllrose“ und „Landkreis Oder-Spree“ gelten bewusst nicht als gleich; dazu wären geprüfte regionale Zuordnungen und Einwilligung nötig.

Eine interne Punktzahl ordnet Vorschläge, wird aber **nicht als Prozentwert** oder vermeintlich objektive Verträglichkeit angezeigt.

## Suchansicht
- **Für euch passend** und **Alle Familien**; wenn keine passenden Familien vorhanden sind, führt eine Schaltfläche zurück zur gesamten Liste.
- Fokusfilter **Alle / Hobbys / Freizeit / Treffideen**. Der Fokus gewichtet und filtert nach Untergruppen; Gruppen entstammen den bereits vorhandenen Hobbys und Freizeitwünschen.
- Freitextsuche nach Familienname, grober Region, Beschreibung oder ausgewählten Interessen.
- Optionaler Filter für eines der selbst ausgewählten Interessen.
- **Gleiche Region** nur bei eigener grober Regionsangabe.
- Wechsel zwischen Sortierung nach Gemeinsamkeiten und Familienname.
- Vorschlagskarten zeigen konkrete gemeinsame Interessen, verwandte Themen und gegebenenfalls eine exakt gleiche Regionsangabe.
- Kontaktanfragen, Profilansicht, Sicherheitsprüfung und Familien-Kompass bleiben weiterhin vorhanden.

## Datenschutz und Grenzen
- Kein Speichern neuer Matching-Profile, kein Tracking und keine externen Standortdienste.
- Nur bereits über bestehende Supabase-RLS lesbare Profile mit `moderation_status='approved'` und `is_discoverable=true`. Eigene und selbst blockierte Nutzer werden zusätzlich clientseitig herausgefiltert; serverseitige RLS bleibt entscheidend.
- Keine Daten über Kinder, Einkommen, Religion, Gesundheitszustand oder genaue Anschriften.
- Familienkonstellation und gewünschte Lebenssituation sind noch **keine** verlässlichen Datenfelder und deshalb bewusst **nicht** Teil des Matching-Scores.
- Die technische Logik ist als `lib/familyMatching.js` getrennt; kleine echte Node-Tests in `tests/familyMatching.test.cjs`. GitHub führt diese Tests vor den Expo-Bundle-Checks aus.

## Abnahmetests
1. Familien mit gemeinsamen Interessen zeigen diese namentlich, keine ausgedachte Prozentzahl.
2. Unterschiedliche Unterthemen erscheinen höchstens als ähnliche Vorlieben.
3. Region nur bei exakt übereinstimmender freiwilliger Eingabe.
4. Unsichtbare, noch nicht geprüfte, eigene und lokal blockierte Profile fehlen.
5. Bei keinen Treffern funktioniert **Alle Familien ansehen**.
6. Expo-Android und -iOS können weiterhin gebündelt werden.

**Hinweis:** Automatisierte Unit- und Bundle-Tests ersetzen nicht den späteren echten Test mit mehreren angemeldeten Nutzern und Expo Go.
