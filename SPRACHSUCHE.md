# Lokale Spracheingabe – vorbereitete native Integration

Der Quellcode ist vorhanden, die native Erweiterung ist bewusst noch NICHT als Abhängigkeit eingetragen: der npm-Registry-Zugriff der Entwicklungsumgebung konnte die Paket-Integrität und Lockfile-Auflösung nicht verifizieren. Vor Aktivierung in einem eigenen Entwicklungsbuild:
1. npm install --save-exact expo-speech-recognition@58.0.1
2. Paket-Herkunft, npm-Lockfile (Integrity, Peer-Abhängigkeiten), npm audit und Expo-SDK-Kompatibilität prüfen. app.config.js aktiviert den Config-Plugin nur wenn das Paket vorhanden ist.
3. Native iOS-/Android-Entwicklungsbuilds neu erstellen; Expo Go enthält das native Modul nicht. Ohne Modul bleibt die normale Texteingabe (und Systemdiktat) erreichbar. Keine Veröffentlichung bis Gerätetests bestanden sind.
4. Deutsch auf dem Gerät, Android-Sprachmodell, fehlende/entzogene Mikrofonrechte, Hintergrundwechsel, Abbruch, Kontowechsel, Wiederholung, verspätete Resultate und ältere Geräte testen.
5. Prüfen, dass Audio nicht gespeichert oder über das Netzwerk gesendet wird. Der Code verlangt lokale Erkennung und verzichtet auf Netzwerk-Fallback. Transkription wird nur ins Suchfeld übernommen, nicht automatisch abgesendet. Erst bewusster Such-/KI-Aufruf sendet Text gemäß vorhandener Datenschutzregeln.

Quellen: https://github.com/jamsch/expo-speech-recognition und https://docs.expo.dev/versions/v58.0.0/sdk/expo/
