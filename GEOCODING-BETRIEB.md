# Deutschlandweite Suche – Betrieb

Die Kartenansicht verbindet lokale Familienfunke-Tipps beim Tippen mit einer bewusst gestarteten Suche in einem Photon-Geocoder. Externe Treffer sind keine moderierten Empfehlungen.

## Beta
- Edge Function: ff-geocode, JWT und serverseitige Quotenprüfung; nur DE, maximal 10 Treffer.
- Der öffentliche Photon-Demoserver wird ausschließlich für die kleine Beta verwendet. Maximal 150 externe Anfragen täglich für die gesamte App, 20 je Konto, mindestens 2 Sekunden zwischen externen Anfragen; bei ausgelastetem Dienst bleibt der lokale Katalog verfügbar.
- Keine Speicherung von Suchtexten oder Zielkoordinaten durch diese Funktion. Die Quotentabelle enthält nur Kontokennung und Tageszähler. Keine GPS-Position, Profilangaben, Nutzerkennung oder Nachrichten an den Geocoder.
- Vor dem expliziten Absenden weist die App darauf hin, dass der Suchtext an Photon gesendet wird und keine vertraulichen Informationen oder privaten Wohnanschriften eingegeben werden sollen. Externe Betreiber können eigene Protokolle führen.

## Vor einer öffentlichen Veröffentlichung
- Eigenen oder vertraglich betriebenen Photon-Geocoder mit geeignetem Datenschutzkonzept, EU-Hosting und Verfügbarkeit festlegen. In Supabase Secret FF_PHOTON_ENDPOINT den vollständigen HTTPS-Suchendpunkt (einschließlich /api) konfigurieren. Keine Schlüssel im Client ablegen. Demoserver nicht für große Nutzerzahlen verwenden.
- Datenschutzerklärung, Auftragsverarbeitung soweit erforderlich, Nutzungsbedingungen, Attribution und Betreiberprotokollierung prüfen. Tages- und Nutzerlimits erst nach der Kapazitätsprüfung anheben.
- Adressdaten des Kartenanbieters können lückenhaft oder ungenau sein; Treffer niemals als amtlich verifizierte Adressen darstellen.
- Authentifizierten End-to-End-Test: Städte, Gemeinden, PLZ und öffentliche Straße/Hausnummer aus verschiedenen Bundesländern; Karten-Pin, Listenauswahl, Routenlink, Abbruch und neue Suchanfrage, Offline-Fallback, Quotenfehler, VoiceOver/TalkBack. Testadressen nicht mit Kontoinformationen verknüpfen.
- Referenz: https://github.com/komoot/photon und https://github.com/komoot/photon/blob/master/docs/api-v1.md
