# Familienfunke – Native iOS- und Android-App

**Version:** 1.0.0-beta.1 (2026-11-15)  
**Technik:** Expo SDK 58 / React Native 0.88 / Supabase  
**Datenbank:** Nutzt die bereits angelegte Struktur **Familienfunke 0.2**. Das ist ein eigenständiges natives App-Projekt, kein WebView.

## Was implementiert ist

- Login mit deinen schon vorhandenen Supabase-Testkonten; keine öffentliche Selbstregistrierung.
- Familienprofil bearbeiten, freiwillige Angaben und Interessen, grobe Region und Sichtbarkeit.
- Familien entdecken nach Interessen und Regionen, manuelle Kontaktanfragen.
- Kontaktanfragen annehmen, ablehnen, zurückziehen.
- Privater Textchat zwischen bestätigten Familienkontakten.
- Blockieren / Entsperren; Inhalte und Nachrichten melden.
- Events erstellen, nach manueller Freigabe sichtbar; Teilnahme beantragen und Anfragen verwalten.
- Profilfotos aus der iPhone-Fotomediathek, erneute JPEG-Kodierung, privater Storage, Freigabe-Status und Löschen.
- Elternwissen: Links zu amtlichen Quellen.
- Passwort ändern, ordentlich abmelden.
- Native Oberfläche mit eigenem App-Symbol, Splashscreen und iOS-/Android-Konfiguration.

**Bewusst nicht enthalten:** Pinnwand, Likes, Kommentarspalten, GPS-Ortung, öffentlicher Zugriff, Zahlungen, Flohmarkt, Forum, KI-Bildmoderation, automatisierte Identitätsprüfung und Push-Nachrichten. Für die private Beta bleiben neue Profilinhalte, Fotos und Events bis zur administrativen Freigabe unsichtbar. Private Nachrichten werden nicht pauschal mitgelesen.

## Sicherheits- und Veröffentlichungsstand

Es handelt sich um eine umfassende **implementierte Beta-Codebasis**, nicht um eine geprüfte oder signierte iPhone-App. Der Code wurde statisch auf JavaScript-/JSX-Syntax geprüft. Ein vollständiger Installations-/Buildtest und echte Ende-zu-Ende-Tests am Supabase-Projekt des Betreibers konnten mangels Zugriff auf npm, Apple-Konto und echte Projektzugänge **noch nicht** stattfinden. Diese Tests sind vor jeder Verteilung erforderlich. Eine produktive Veröffentlichung verlangt zudem eine Datenschutz- und Sicherheitsprüfung sowie Moderationsabläufe.

## Verzeichnis

```
index.js             Einstiegspunkt
src/App.jsx          Vollständige native App
src/supabase.js      Supabase Auth und Verbindung
assets/              App-Symbol und Splashscreen
app.json             iOS-/Android-Appdaten
package.json         Abhängigkeiten
babel.config.js      Expo Babel
.env.example         Öffentliche Projektkonfiguration
eas.json             Cloud-Build-Profile
```

## Verbindung mit bestehendem Supabase-Projekt

1. Eine Datei `.env` aus `.env.example` anlegen. Nur diese beiden **öffentlichen** Werte aus Supabase einsetzen:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

2. Die Datenbank muss dem bereits verwendeten SQL-Schema **Familienfunke 0.2** entsprechen: `profiles`, `verifications`, `memberships`, `contact_requests`, `messages`, `blocks`, `events`, `event_requests`, `profile_photos`, `reports` sowie privatem Storage-Bucket `familienfunke-photos` und den bestehenden RLS-Richtlinien.
3. **Kein neues SQL-Installationsskript** auf dem bestehenden Supabase-Projekt ausführen. Die App greift auf vorhandene Daten zu.
4. Keine Secrets oder Passwörter im Repository speichern. Der Publishable Key ist zur Client-Verwendung vorgesehen, aber **nur** zusammen mit aktivem, korrekt geprüftem RLS sicher.

## Entwicklungsstart mit Computer oder Cloud-Entwicklungsumgebung

Node.js 22.13+ verwenden (Expo SDK 58), dann:

```bash
npm install
npx expo install --fix
npx expo start
```

Die App in der aktuell passenden Expo-Go-Version öffnen oder einen Development Build erstellen. Expo-Go unterstützt nicht alle Funktionen einer endgültig installierten App.

## Apple-Cloud-Build ohne eigenen Mac

Expo EAS Build baut die App in der Cloud. Für ein privat signiertes iOS-Binary, das du unabhängig von Expo Go verteilen kannst, benötigst du in der Regel eine kostenpflichtige Apple Developer Program-Mitgliedschaft. Die Anmeldung bei Expo alleine ersetzt die Apple-Signierung nicht.

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build -p ios --profile preview
```

Für diesen Schritt muss das Projekt mit deinem eigenen Expo-Konto und dem vorgesehenen Apple-Team verbunden werden. Gib Codes und Schlüssel ausschließlich in offiziellen Oberflächen ein. Bei Cloud-Builds müssen die beiden Supabase-Umgebungsvariablen für das EAS-Projekt verfügbar sein (z. B. über die Expo-Umgebungsverwaltung), sonst startet die App im Einrichtungsmodus. Ein Bundle-Identifier (`de.familienfunke.app`) ist vor der Veröffentlichung auf Verfügbarkeit und rechtmäßige Nutzung zu prüfen.

## Wenn du nur iPhone oder iPad hast

Verwende das zweite Paket **`familienfunke-native-iphone-upload.zip`**. Es ist technisch dasselbe Projekt, enthält jedoch **alle Dateien ohne Unterordner**, damit die GitHub-Mehrfachauswahl auf dem iPhone funktioniert. Für die native App ein **neues** privates GitHub-Repository `familienfunke-mobile` anlegen. Nicht die funktionierende Web-App `Family-Sparkle` überschreiben. Das ZIP entpacken und alle Einzeldateien im neuen Repository hochladen. Nur das Projekt hochzuladen erstellt noch keinen signierten iPhone-Build. Für Weiterentwicklung/Build braucht es anschließend eine geeignete Cloud-Entwicklungsumgebung oder einen Computer.

## Daten- und Datenschutzgrenzen

- Keine Kinderprofile, keine Live-GPS-Abfragen oder präzisen Entfernungsangaben.
- Fotoauswahl wird in der App neu als JPEG gerendert. Die App speichert keine EXIF-Daten explizit; dennoch müssen Uploads vor einem öffentlichen Betrieb darauf geprüft werden, dass keine sensiblen Metadaten verbleiben.
- Fotos liegen im **privaten** Supabase Storage und werden nur als zeitlich begrenzte signierte URLs geladen. Zugriff wird durch Storage-Policies und Freigabestatus beschränkt.
- Freigaben der Erwachsenen, Fotos und Events erfolgen **weiterhin manuell** über das Backend; eine echte KI-Moderation ist noch nicht eingerichtet.
- Die App hat einen Meldedialog und Blockierfunktion. Ein externer Incident-Prozess / Moderator ist für öffentliches Wachstum erforderlich.
- Nachrichten werden im Backend gespeichert und sind nicht Ende-zu-Ende-verschlüsselt.
- `AsyncStorage` ist kein Hardware-Keychain-Speicher. Vor Veröffentlichung kann für Token ein sicherer Persistenzadapter (SecureStore) ergänzt werden.

## Konkrete Abnahme vor der Weitergabe

- Expo SDK-58-Paketinstallation und native Bundle-Erstellung erfolgreich.
- Login / Logout beider bereits vorhandenen Konten.
- RLS-Grenzen: keine fremden Nachrichten, kein fremder Upload, kein Manipulieren von Verifikation/Moderation.
- Profilsichtbarkeit und Blockiersperre (serverseitig).
- Kontaktanfrage, Annahme, Chat, Events, Fotos und Meldungen auf iOS.
- Fehlerfälle wie fehlendes WLAN, abgelaufene Session, abgelehnte Berechtigungen.
- Sicherheit, Datenschutz, Löschung und Moderation vor externer Beta.

## Externe Dokumentation

- Expo: https://docs.expo.dev/
- Expo Cloud Build: https://docs.expo.dev/build/introduction/
- Supabase Auth React Native: https://supabase.com/docs/guides/auth/quickstarts/react-native
