# Familienfunke als installierbare App testen

Stand: November 2026. Diese Anleitung betrifft das **native** Repository `familienfunke-mobile`, nicht die bestehende Web-App `Family-Sparkle`.

## Bereits vorbereitet

- Native React-Native-App mit Expo SDK 58 und bestehender Supabase-Anbindung.
- `eas.json`: Das Profil `preview` erstellt auf Android eine direkt installierbare **APK**; für iOS eine **intern verteilte, signierte App** (vorausgesetzt, Apple-Zugang und Provisioning sind eingerichtet).
- GitHub Action **Native App prüfen**: prüft Pakete und erzeugt JavaScript-Bundles für iOS und Android.
- GitHub Action **Installierbare Test-App bauen**: nach einmaliger Einrichtung manueller Start mit Android/iOS-Auswahl.
- `.gitignore` verhindert das versehentliche Einchecken von `.env`-Dateien. Das Repository ist derzeit öffentlich sichtbar; keine privaten Zugangsdaten committen.

## 1. Erst die Basis prüfen

1. GitHub: **Actions > Native App prüfen**. Der Lauf auf `main` bzw. einem Pull Request muss erfolgreich sein.
2. Wenn er scheitert: Erst den genauen Fehler beheben, nicht blind eine Store-Veröffentlichung starten.
3. Den bestehenden Supabase-Datenbankbestand nicht neu installieren oder löschen.

Ein erfolgreicher JavaScript-Build ist **noch kein** Nachweis, dass Login, Datenbankrechte, Fotos und Nachrichten auf einem echten Gerät funktionieren.

## 2. Expo-Projekt und Datenzugang

Das Projekt ist in `app.json` bereits einem Expo-EAS-Projekt zugeordnet. Überprüfe im **eigenen** Expo-Konto, dass es erreichbar ist.

Im Expo-Dashboard unter **Project > Environment variables** müssen für die Umgebung `preview` diese **öffentlichen** Clientwerte liegen:

```env
EXPO_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Es darf **kein** `service_role`-Schlüssel, `secret`-Schlüssel oder Passwort in GitHub, `.env.example` oder in einer App-Konfiguration landen. Die Supabase-RLS- und Storage-Policies müssen vor einem Test mit fremden Personen geprüft sein.

## 3. Einmalige Ersteinrichtung der Signierung

Für den **allerersten Build jeder Plattform** kann Expo eine interaktive Einrichtung von Zertifikaten/Android-Keystore verlangen. Diese erfolgt einmal über ein Terminal (z. B. **GitHub Codespaces**), nicht hier im Chat:

```sh
npm ci
npx expo install --check
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

Für ein echtes iPhone benötigst du zusätzlich das **Apple Developer Program** und eine Registrierung des Testgeräts für interne Ad-hoc-Verteilung:

```sh
npx eas-cli@latest device:create
npx eas-cli@latest build -p ios --profile preview
```

Expo fordert bei der iOS-Signierung gegebenenfalls eine Anmeldung bei Apple an. Gib Apple-Zugangsdaten und Bestätigungscodes **nur** in den vorgesehenen offiziellen Oberflächen ein. TestFlight ist eine alternative spätere Testverteilung über App Store Connect.

## 4. Künftige Builds ohne erneutes Terminal starten

Nach dem ersten erfolgreich signierten Build:

1. Im Expo-Konto unter **Access tokens** ein Token mit passender Berechtigung erzeugen.
2. GitHub: Repository `familienfunke-mobile` > **Settings > Secrets and variables > Actions > New repository secret**.
3. Secret exakt `EXPO_TOKEN` nennen und das Token **dort** eintragen, niemals in eine Chat-Nachricht oder Datei.
4. GitHub: **Actions > Installierbare Test-App bauen > Run workflow** öffnen, `android` oder `ios` wählen.
5. Der Lauf startet EAS und wartet auf das Build-Ergebnis. Den Installationslink im EAS-Builddetail öffnen.

**Android:** Die APK kann auf einem Android-Handy installiert werden (die Installation aus dem Browser muss gegebenenfalls erlaubt werden).

**iPhone:** Die intern signierte App kann nur auf einem berechtigten, registrierten Gerät installiert werden; die Apple-Signierung muss gültig sein. Für die spätere öffentliche Veröffentlichung im App Store ist ein anderes Release-Verfahren erforderlich.

## 5. Pflicht-Tests auf echten Geräten

Vor der Weitergabe an fremde Familien die folgenden Abläufe mit mindestens zwei eigenen Testkonten prüfen:

- Anmelden, Sitzungs-Wiederherstellung, Passwortwechsel, Abmelden
- Profil bearbeiten und Sichtbarkeitsregeln, Genehmigungsstatus, Fotos hochladen/löschen
- Kontaktanfrage annehmen/ablehnen, Blockieren, Chat und Nachrichtenmoderation
- Event erstellen, Freigabe/Teilnahme, Meldungen
- Verbindungsabbrüche, abgelehnte Fotoberechtigung, abgelaufene Authentifizierung
- Supabase-RLS, privater Storage, keine fremden Nachrichten oder Nutzerdaten abrufbar

Vor einem öffentlichen Start zusätzlich prüfen: Datenschutzerklärung, Lösch- und Auskunftswege, Schutz Minderjähriger, Moderationsbetrieb und App-Store-Vorgaben.

## Offizielle Hilfen

- [Expo: Ersten Build erstellen](https://docs.expo.dev/build/setup/)
- [Expo: Interne Verteilung](https://docs.expo.dev/build/internal-distribution/)
- [Expo: Builds über CI starten](https://docs.expo.dev/build/building-on-ci/)
- [Expo: Android APK](https://docs.expo.dev/build-reference/apk/)
