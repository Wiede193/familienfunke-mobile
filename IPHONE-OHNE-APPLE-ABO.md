# Familienfunke kostenlos auf einem echten iPhone testen (Expo Go)

**Dies ist eine eigenständige, experimentelle Testvariante.** Dein eigentliches App-Projekt auf `main` bleibt auf **Expo SDK 58**. Diese Testvariante verwendet **Expo SDK 54**, weil die Expo-Go-Version aus Apples App Store gegenwärtig nur mit SDK 54 funktioniert. Die Testversion wurde **noch nicht auf einem realen iPhone verifiziert**. Deshalb zunächst nur die vorhandenen eigenen Testkonten verwenden.

## Vorbereitungen auf dem iPhone

1. Die kostenlose **Expo Go** App aus Apples App Store installieren.
2. Ein kostenloses Konto bei https://expo.dev haben oder anlegen. In Expo Go anmelden.
3. GitHub im Safari-Browser öffnen: https://github.com/Wiede193/familienfunke-mobile/tree/test/iphone-expo-go-sdk54
4. Du brauchst **kein** kostenpflichtiges Apple Developer Program für diese Expo-Go-Variante.
5. Du brauchst nur dein bestehendes Supabase-Projekt mit den *öffentlichen* Werten (Project URL + Publishable Key). Niemals `service_role`, Secret Keys oder Passwörter als App-Konfiguration verwenden.

## Im GitHub-Repository Codespaces-Secrets einrichten

GitHub -> Repository `familienfunke-mobile` -> **Settings** -> **Secrets and variables** -> **Codespaces** -> **New repository secret**.

Diese beiden Namen einzeln anlegen und die Werte aus deinem vorhandenen Supabase-Dashboard als Value eingeben:

- `EXPO_PUBLIC_SUPABASE_URL` (z.B. `https://xyz.supabase.co`)
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (beginnt mit `sb_publishable_`)

Diese beiden Werte sind zur Verwendung in einer Client-App vorgesehen, müssen aber durch die richtigen Supabase-RLS- und Storage-Regeln abgesichert sein. Nachträglich hinzugefügte Codespaces-Secrets erfordern ggf. einen Neustart des Codespace.

## GitHub Codespaces starten – kein Mac nötig

1. Im Repository oben den Branch **`test/iphone-expo-go-sdk54`** auswählen.
2. **Code -> Codespaces -> Create codespace on test/iphone-expo-go-sdk54**.
3. Im Codespaces-Editor das **Terminal** öffnen.
4. Die folgenden Befehle nacheinander ausführen:

```sh
npm install
npx expo install --fix
npx expo login
npx expo start --tunnel
```

Wichtig:
- `npm install` erstellt hier die zur SDK-54-Testvariante passende `package-lock.json` neu. Bitte **nicht** `npm ci` vor dem ersten `npm install` verwenden.
- Für `expo login` dasselbe **kostenlose Expo-Konto** benutzen wie auf dem iPhone in Expo Go.
- Der Befehl `expo start --tunnel` braucht einen laufenden Codespace und einen Tunnel-Dienst. Bei Fragen nach der Installation von Tunnel-Abhängigkeiten die offizielle Expo-Anleitung beachten.
- Wenn `expo install --fix` Abhängigkeiten ändert, die Versionen in diesem Testzweig aktualisieren (nicht versehentlich in `main` übernehmen).
- Bei Installationsproblemen den Fehlertext nicht raten: Fehlermeldung aufnehmen und zuerst die Pakete kompatibel machen.

## Familienfunke auf dem iPhone öffnen

Im Terminal erscheint ein QR-Code und üblicherweise ein `exp://...`-Link.

- **Wenn du zwei Bildschirme hast:** QR-Code mit der iPhone-Kamera scannen, anschließend in Expo Go öffnen.
- **Wenn du nur das iPhone hast:** Den angezeigten `exp://...`-Link im Codespaces-Terminal kopieren, in Safari öffnen und das Öffnen mit Expo Go bestätigen, soweit iOS die URL-Übergabe anbietet.

Die App lädt ihren JavaScript-Code aus dem **laufenden Entwicklungsserver** in Codespaces. Wenn Codespaces beendet wird oder der Tunnel wegfällt, ist diese Testsession nicht verfügbar. Expo Go hat weiter sein eigenes App-Symbol; Familienfunke ist hier **noch keine separat signierte iPhone-App**.

## Erste echte Funktionsprüfung

Nach erfolgreichem Start:
1. Anmelden mit einem deiner **vorhandenen eigenen Testkonten**.
2. Profil und Region laden/bearbeiten.
3. Mit zwei Testkonten Kontaktanfrage, Chat und Blockierung prüfen.
4. Fotoauswahl, Events und Sichtbarkeit anhand bestehender Moderationsfreigaben prüfen.

Bei **`Einrichtung erforderlich`** fehlen die beiden `EXPO_PUBLIC_...`-Werte im gestarteten Prozess. Bei **`Project is incompatible with this version of Expo Go`** läuft meist irrtümlich der `main`-Branch (SDK 58), nicht `test/iphone-expo-go-sdk54`.

## Grenzen

Expo Go ist eine Testumgebung. Nicht alle App-Konfigurationen und nativen Funktionen werden identisch zu einer eigenständig installierten iOS-App ausgeführt. Der Weg zu einer echten App mit eigenem Icon erfolgt später über signierte iOS-Builds, z.B. mit Apple Developer Program und TestFlight. Ohne kostenpflichtiges Abo ist eine lokale Xcode-Installation auf einem eigenen Mac mit einem kostenlosen Apple-ID-Personal-Team eine weitere, aber deutlich aufwendigere Möglichkeit.

Quellen:
- https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/
- https://docs.expo.dev/get-started/start-developing/
- https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/
