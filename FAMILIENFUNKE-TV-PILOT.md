# Familienfunke TV – Pilot für erwachsene Familienmitglieder

Aufruf über die Startsuche (YouTube / Familienfunke TV) oder Menü → Ausflüge, Freizeit & Wissen. Keine zusätzliche Hauptregisterkarte. Drei statische Beispiele, Quellen:
- https://www.youtube.com/watch?v=ILIB9YOE1DM – Stiftung Lesen / Sally
- https://www.youtube.com/watch?v=VCHXgpOdfd4 – #DigitaleVorbilder
- https://www.youtube.com/watch?v=JQsHa6bf-xE – klicksafe

Kein Video-Hosting, keine neue Bibliothek, kein Datenbankzugriff, keine API-Schlüssel, keine externe Vorschaubilder. Nur explizite Freigabe pro Player, keine automatische Wiedergabe, beim Schließen oder Verlassen wird die WebView entfernt. Offizieller YouTube-iframe im Privacy Enhanced Mode, baseUrl mit Paket-/Bundle-ID aus app.json, Mindestgröße, native Vollbildfunktion, Originallink bei Einschränkungen. Keine Werbeunterdrückung. Keine behauptete Creator-Partnerschaft. Inhalte sind Beispiele anhand öffentlicher Quellen; redaktionelle Sichtung des vollständigen Videos und Einbettbarkeit müssen vor Veröffentlichung bestätigt werden.

Dokumentation: https://developers.google.com/youtube/terms/required-minimum-functionality ; https://support.google.com/youtube/answer/171780 ; https://developers.google.com/youtube/player_parameters .

Offen vor öffentlichem Rollout: Online-Test auf realem iOS/Android (nicht nur Expo Go; Referrer/Fehler 153, Vollbild, Schließen, gesperrte Videos, Fehlerfälle und Datenverkehr vor Freigabe), Prüfung der Datenschutzinformationen und Einwilligungsanforderungen, Zielgruppenprüfung inkl. YouTube self-designation für child-directed apps falls erforderlich. YouTube-Vorschläge/Werbung können nicht garantiert familiengeeignet sein. Nutzeruploads, Creator-Konten und redaktionelles Backend bewusst nicht Teil des Pilots. Kein direkter YouTube-Vertrag, keine kostenpflichtigen Dienste. Bestehende Android-Safe-Area-Probleme sind hiervon unabhängig.

## Erweiterung: optionales Autoplay und Programm
Fünf redaktionelle Kandidaten; zusätzlich WDR https://www.youtube.com/watch?v=QAF7iNFKg4U und Gespräch mit Jan-Uwe Rogge von Dominik Spenst https://www.youtube.com/watch?v=R_DVON0csog. Kein Kooperationsvertrag. Lokale Suche nach Thema, Titel, Anbieter, Kategorien. Standard Autoplay aus, pro Besuch wählbar, nur nach ausdrücklichem Start. Offizieller playlist-Parameter für endliche Auswahl ab ausgewähltem Video, loop=0, ein einzelner Player, kein eigener Empfehlungsalgorithmus. Player in gemessenem festem Bereich, bei weniger als 200x200 kein Einbetten. Hintergrund/Verlassen/Menü schließen den Player. Ausschalten beendet die Sitzung. Native Browser können Autoplay blockieren; manueller Start im Player bleibt verfügbar. Keine Garantie gegen YouTube-eigene Empfehlungen. Vor Veröffentlichung vollständige redaktionelle Sichtung, Made-for-Kids-Status jedes Videos, Einbettbarkeit, Datenschutz und Online-Test auf iOS/Android prüfen. Keine neuen Dienste oder Datenbankänderungen.
