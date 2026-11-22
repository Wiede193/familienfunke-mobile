# Familienfunke – Gestaltungsoffensive 22.11.2026

## Ziel
Familienfunke soll bei wenigen und vielen Nutzern gleichermaßen freundlich,
ruhig, gut erreichbar und glaubwürdig wirken. Die bestehende sonnengelbe,
cremeweiße und petrolfarbene Identität bleibt erhalten. Das Design wird
direkt in React Native/Expo umgesetzt – kein bloßes Mockup.

## 1. Personalisierte Startseite
- Die zentrale, Google-artige Suche mit getrennten Knöpfen „Suchen“ und
  „KI fragen“ bleibt der wichtigste Einstieg; keine heimliche Vermischung.
- Persönliche Begrüßung benutzt nur den freiwillig angegebenen Anzeigenamen
  des eigenen Profils. Ungelesene Neuigkeiten erscheinen mit tatsächlicher
  Inbox-Anzahl; es wird keine Anzahl erfunden.
- Hinweise zur Vervollständigung fehlender Region, Hobbys oder Vorstellung
  führen gezielt ins eigene Profil.
- Redaktionell bekannte Ausflugsorte werden aus der bereits vorhandenen
  Familienkarte nach (grober) Region und Interessen sortiert. Die App behauptet
  ausdrücklich **nicht**, dass alle Orte in unmittelbarer Nähe seien oder
  heute geöffnet hätten.
- „Frisch im Familienbasar“ zeigt nur echte, vom Backend freigegebene
  Angebote, nicht Demo-Inserate. Die interne RPC prüft Verifizierung,
  Blockierungen und Inseratfreigabe. Eine Basarkarte öffnet das konkrete
  Inserat direkt. Ergebnisumfang: maximal zehn angeforderte, drei angezeigte.
- Familien- und Partnertermine kommen aus der vorhandenen
  `ff_search_events`-Suche, maximal zwölf Kandidaten und zwei angezeigte.
  Die Funktion begrenzt auf bevorstehende, freigegebene Termine.
- Alle neuen Online-Anfragen werden **nur beim Öffnen der Startseite**
  gemacht, getrennt von der globalen App-Initialisierung. Fehler in einer
  Datenquelle verschweigen nicht erfolgreiche Ergebnisse der anderen.

## 2. Einheitliche natürliche Symbole
- `FamilyIcon.jsx`: konsistente Linienzeichen direkt aus
  React-Native-Views (keine gerätespezifischen Unicode-Navigationszeichen,
  keine neue native Bibliothek und keine generierten KI-Bildchen).
- Einheitliche Symbole in Bottom-Navigation, Top-Rechts-Menü,
  Suchleiste, Startseiten-Kacheln, Basar-Bildern und Profilregionen.
- Alle Symbol-Buttons erhalten weiterhin ihre Textbeschriftung
  und zugängliche Bezeichnungen.

## 3. Familienbasar mit Bildfokus
- Klare sonnige Titelfläche, eindeutig auffindbarer Inserier-Knopf.
- Horizontal sichtbare, direkt bedienbare Kategorienchips;
  erweiterte Filter (Angebotsart, Preis, Kategorien) bleiben verfügbar.
- Größere Produktbilder, deutlicher Preis unter dem Titel und
  ruhige Metadaten für Zustand, Kategorie und Region.
- Geschenk-Angebote sind als „Zu verschenken“ markiert.
- Gebühren, Datenschutzhinweise und der noch nicht verfügbare
  Online-Bezahlweg sind prominent als aufklappbarer Informationsbereich
  erhalten und dürfen nicht irreführend als Zahlungsfeature erscheinen.
- Der KI-Kistenmodus, Größen-/Preisfilter, KI-Prüfung, Merkliste,
  Statusangaben und Artikeldetails bleiben funktional unverändert.

## 4. Übersichtliches Menü
- Direkt nach Öffnen nur vier Schnellziele: Profil, Nachrichten,
  Neuigkeiten, Basar. Alle übrigen bisherigen Bereiche bleiben in
  drei aufklappbaren, zugänglichen Kategorien erreichbar.
- Der aktive Bereich bleibt erkennbar, die Schließen-Schaltfläche
  gut treffbar, die Modalöffnung dezent eingeblendet.

## 5. Schriften, Abstände, Oberflächen
- `FamilyTheme.js` enthält nun typografische, räumliche und
  flächenspezifische Tokens zusätzlich zur bestehenden Palette.
- Die wichtigsten Titelformen und Schaltflächen erhalten ein etwas
  ruhigeres Gewicht statt überwiegend `900`.
- Helle Flächen, klare Preis-/Überschrift-Hierarchie, warme Akzente.
  Vorhandene Kontrastregressionen bleiben im CI.

## 6. Mikrodetails
- Wiederverwendbare `FamilyEmptyState`, `FamilySkeleton` und
  `FamilySectionTitle` für fehlende Daten, Ladezeiten und Abschnitte.
- Leere Familien-/Basarlisten bieten echte Handlungen (Filter
  zurücksetzen, Basar entdecken) statt bloßer Dekoration.
- Netzwerkfehler bei Startseitenempfehlungen werden als solche
  gekennzeichnet; es wird kein fiktiver Live-Inhalt angezeigt.
- Profilansicht besitzt eine freundlichere Kopfleiste,
  sauber gegliederte Interessen und Aktionen. Bei lokal
  blockiertem Profil erscheint **kein** Nachrichtenschreib-Knopf.
- Die bestehenden Ladeanzeigen, Retry-Regeln und serverseitigen
  Sicherheitskontrollen bleiben bestehen. Dezente Press-Zustände
  und ein sanftes Menü-Fade vermeiden unnötige Animationen.

## Nicht enthalten / offen
- Ein vollständiges Design-Audit aller älteren Spezialmasken
  (z. B. komplexer Kisten-Editor und unterschiedliche Eventformulare)
  erfolgt später. Die neue Standardsprache ist geschaffen,
  aber nicht jedes alte Element bereits refaktoriert.
- Es wurden keine neuen Stock-Fotos eingebaut, die als echte
  lokale Familien oder Angebote missverstanden werden könnten.
  Produktfotos stammen ausschließlich aus dem bestehenden
  berechtigten und signierten Medienfluss.
- Keine A/B-Tests oder echten Nutzerinterviews durchgeführt.
  Vor einer Veröffentlichung auf kleinen Android-Geräten,
  iPhones mit größerer Schrift und Screenreadern visuell prüfen.
- Der Nutzer selbst muss die App mit neuem Build öffnen, um
  die Änderungen auf einem installierten Gerät zu sehen.

## Nachvollziehbarkeit
- `HomePersonalization.js`: prüfbare Pure Functions für
  Regionalvergleich, Freigabe, Empfehlungen und Profilhinweise.
- `tests/check-home-personalization.mjs` und
  `tests/check-design-refresh.mjs`: automatische UI- und
  Datenwahrheitsregressionen.
- `npm run check:design-refresh` ist Bestandteil des
  bestehenden Native-CI neben allen Funktionstests und iOS-/Android-Bundles.
