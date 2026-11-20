# Familienbasar – Bildergalerie, Bearbeiten und Merkliste

## Funktionsumfang
- Ein neues Inserat kann bis zu **fünf JPEG-Fotos** enthalten. Das bisherige einzelne `photo_path` bleibt als erstes Bild erhalten; weitere Bilder liegen in `ff_market_photos` (Slots 2–5).
- Verkäufer können eigene Inserate im Zustand `pending`, `approved` oder `rejected` bearbeiten. Speichern setzt auch bei vorher genehmigten Anzeigen den Status sofort auf **pending** und erhöht `review_version`.
- Auch zusätzliche Fotos werden bis zur Freigabe **nicht** für andere Nutzer sichtbar.
- Die authentifizierte Edge Function `ff-market-review` prüft Titel, Beschreibung und **alle** zum Inserat gehörenden Bilder. Fehlt ein Bild oder fällt ein KI-Aufruf aus, wird das Inserat nicht freigegeben.
- `review_version` ist ein Race-Condition-Schutz: Ein neues Bild während einer laufenden Prüfung erhöht den Wert. Das Freigabe-Update kann dann nicht mehr mit dem alten Snapshot stattfinden.
- Nutzer können freigegebene Inserate anderer Nutzer mit einem Herz als Favoriten speichern. Die **Merkliste** ist nur für die Person selbst sichtbar und zeigt keine inzwischen zurückgezogenen Inserate mehr.
- Der bestehende Verkäufer-Chat, Status `sold`, Kita-Angebote und die bisherige Basar-Kategorisierung bleiben erhalten. Kein Zahlungsverkehr.

## Sicherheitsgrenzen
- Keine öffentlichen Clientrechte für `moderation_status` – Status `approved` ist weiterhin ausschließlich serverseitig möglich.
- `ff_market_edit_listing`: mit `auth.uid()`, geprüftem Erwachsenenstatus, Eigentümerschaft, erlaubten Kategorien und Preisgrenzen; kann nur `approved`, `pending` oder `rejected` zu `pending` überführen, nie `sold` oder `removed` reaktivieren.
- Galerie-Metadaten haben kein UPDATE/DELETE-Recht für reguläre Clients. Alle Galeriepfade enthalten Eigentümer-ID, Inserat-ID und Slotnummer. Storage-Uploads sind nur für eigene `pending`-Anzeigen möglich.
- `ff_market_favorites` sind nur für den jeweiligen Nutzer lesbar und löschbar; Fremdanzeigen dürfen nur gespeichert werden, wenn sie für den Nutzer sichtbar und freigegeben sind.
- Fehlgeschlagene Uploads können ein Inserat in `pending` belassen. Solche Fälle benötigen derzeit manuelle Bereinigung beziehungsweise Wiederherstellung.

## Gezielte Tests vor Veröffentlichung
1. Neue Anzeige mit **5 unterschiedlichen** Fotos: alle erscheinen in Galerie und alle sind bei der KI-Prüfung berücksichtigt.
2. Ein unerlaubtes Motiv ausschließlich auf Bild 3 muss den ganzen Artikel zurückhalten oder ablehnen.
3. Bereits freigegebene Anzeige bearbeiten: für andere sofort unsichtbar, nach bestandener Prüfung wieder sichtbar.
4. Eine Änderung während laufender Prüfung darf die alte Freigabe nicht übernehmen (`review_version`).
5. Fremdes oder gesperrtes Konto darf keine Anzeige bearbeiten oder Bilder hinzufügen.
6. Bild-Upload nach bereits erfolgter Freigabe muss abgewiesen werden.
7. Gleichzeitiger Upload, abgebrochener Upload und fehlerhafte JPEG-Datei: niemals ungeprüft sichtbar.
8. Merkliste eines zweiten Kontos bleibt privat; `sold`- und `pending`-Inserate erscheinen nicht unter den verfügbaren Favoriten.
9. Basar-Chat und „Als vergeben markieren“ funktionieren weiterhin.
10. Reale iPhone-/Android-Tests einschließlich Expo Go, Berechtigungen und mehreren Fotos aus der Medienbibliothek durchführen.

Automatische iOS-/Android-JS-Bundles und Datenbank-Metadatenprüfungen **ersetzen keine End-to-End-Tests** mit echten Konten.
