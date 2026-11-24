# Qualitätssicherung – technische Runde

## Implementiert
- Fotos: maximale Kantenlänge 900 px Basar / 1024 px Profil, keine unnötige Vergrößerung kleiner Fotos, JPEG-Kompression und 5-MB-Grenze bleiben. Unbekannte Maße werden beim Rendern ermittelt. Keine zusätzliche KI-Analyse.
- Basar: unabhängige Leseabfragen (Fotos, Favoriten, Organisationen) parallel, jeweils begrenzte Wiederholung bei temporären Netzwerkfehlern. Abbruchprüfung vor dem Signieren; alte Bilder und Organisationen bei neuer erster Seite verwerfen. Keine neuen Freigaben/Cache für private Daten.
- Startseite: Empfehlungsranking und lokale Suche nur bei geänderten Eingaben berechnen. Keine ungemessenen Zeitversprechen.
- Einführung: eine optionale 3-Schritt-Tour mit der tatsächlichen Suchschaltfläche. Kein automatischer Wechsel zwischen Tabs. Die längere Begrüßung bleibt im Menü; bisherige Konto-Einstellungen werden respektiert.

## Geräte-Abnahme (keine Behauptung realer Gerätetests)
| Ablauf | Prüfung | Soll |
|---|---|---|
| Start/Anmeldung | Neues eingerichtetes Testkonto, Tour überspringen/abschließen, neu starten | Keine zweite automatische Begrüßung; Tour nicht erneut automatisch |
| Basar | Kleine, große Hoch-/Querformatbilder, Artikel anlegen, Suche/Filter schnell wechseln, Detail öffnen, verkauft markieren | Kein Hochskalieren, nur aktuelle Treffer, Fotos sichtbar, keine doppelte Veröffentlichung |
| Familie | Hobbys suchen, Profil speichern, Filtern, Anfrage senden/annehmen, blockieren | Nur erlaubte Profile/Kontakte, keine verlorenen Eingaben |
| Chat | Zwei Konten, Sendetaste mehrfach, Netzwerk unterbrechen, Verlauf neu öffnen | Keine doppelten Nachrichten, Entwurf bei fehlender Bestätigung |
| Kalender | Termin merken, verändern, entfernen, zurück navigieren | Richtiger Tag und Status, kein unerwarteter Datenverlust |
| Wissen | Suchfrage, Quellenlink, Regionalverzeichnis | Passender Artikel, offizielle Quelle, Rücknavigation |
| Barrierefreiheit | Große Schrift, VoiceOver, reduzierte Bewegung | Lesbare Texte, erreichbare Schaltflächen, optionaler Rundgang |

Offen: reale Zeiten/Netzlast, native Darstellung, kontrollierter Mehrkonto- und Staging-Test. Kein Produktivlasttest, keine Datenbankmigration und keine Behauptung einer vollständigen Funktionsprüfung.

Zusätzlich abgesichert: Filterwechsel und Aktualisierung nach weiterer Basarseite starten wieder bei Seite 1; keine Abfrage mit altem Offset. Tour blendet sich automatisch nur auf der freien Startseite ein, Schritte bleiben auch bei Mehrfachtippen im zulässigen Bereich.
