# Familienfunke – Vorbereitung auf plötzlichen Nutzeranstieg

Stand: 22. November 2026. Diese Änderungen sind **keine Aussage über getestete
Kapazität**. Der aktuell angebundene Supabase-Datenbestand ist eine kleine Beta.

## Bereits umgesetzt

- Fehlende FK-Indizes laut Supabase Performance Advisor: 25 additive Indizes
  (`database/ff_viral_readiness_fk_indexes_20261122.sql`). Auf dem bestehenden
  Supabase-Projekt als Migration angewendet und nachgeprüft.
- Private Foto-URLs: Anfragen werden auf höchstens 50 Pfade pro Anfrage gebündelt;
  maximal zwei gleichzeitige Storage-Signierungsanfragen pro Batch.
- Galerie-Initialisierung: Zusatzbilder werden nur für tatsächlich geladene
  Inserat-IDs abgefragt statt pauschal aus der gesamten Datenbank.
- Basarsuche: Bereits paginierte Suche (40 Treffer pro Seite) nutzt die
  gebündelte Signierung auch für Zusatzfotos.
- **Phase 2 (22.11.2026):** Familiensuche und Kontaktliste laden mit stabilen
  Zeitstempel-/ID-Cursorn 40 Datensätze pro Seite. Benachrichtigungen können
  ältere Kontakte gezielt nachladen. Kontakt-Anzeigenamen werden getrennt und
  ausschließlich innerhalb bestehender RLS-Rechte angefragt.
- **Privater Chat:** Kein globales Einlesen von Nachrichten beim App-Start.
  Der Verlauf wird erst beim Öffnen des ausgewählten Gesprächs in 40er-Seiten
  geladen; weitere alte Nachrichten nur nach ausdrücklicher Auswahl.
  Vorschautexte erscheinen weiterhin in der Chatliste, aus einer separaten
  geschützten, gebündelten Abfrage (bis 50 Kontakte pro Aufruf).
- **Chat-Versand:** Nach einer gesendeten Nachricht wird nur das betroffene
  Gespräch aktualisiert statt alle App-Listen erneut einzulesen.
- Sicherheitsgrenze: Storage-RLS und kurze Ablaufzeit signierter URLs bleiben
  unverändert. Fehlerhafte bzw. nicht erlaubte Bilder liefern keinen Link.
- CI-Regressionsprüfungen für Batching, Fehler, Parallelität und SQL/Abfrageform.

## Bereits vorhanden, bei viraler Nutzung zwingend beachten

- Per-Konto- und globale KI-Kontingente begrenzen die Kosten serverseitig:
  KI-Startseite 20/Account und 500/Tag global,
  Fotoscan 12/Account und 300/Tag global, plus Moderationskontingente.
  Wenn die Tageskontingente ausgeschöpft sind, **funktionieren diese KI-Features
  nicht mehr**. Budgetänderungen sind gesondert zu prüfen.
- Supabase RLS, Freigabe-/Verifikationslogik, Moderationswarteschlange und
  serverseitige Inhaltsprüfung sind vorhanden. Nicht zum Skalieren abschalten.
- Die App ist aktuell eine **einladungsbasierte Beta ohne öffentliche Registrierung**.
  Viralität führt so nicht automatisch zu neuen nutzbaren Accounts.

## Noch vor einer breiten Freigabe verpflichtend

1. **Lasttest unter realistischem Datenvolumen:** getrennte Testumgebung mit
   synthetischen Konten, Inseraten und Fotos. Stufen von 100, 500 und 2.000
   gleichzeitig aktiven Clients über längere Zeit, jeweils mit Mischlast:
   Login, Discovery, Chat, Basarsuche, Bilder, Push und Meldungen.
   Zielwerte vor dem Test vereinbaren (z. B. p95 für Lesen <2s und Fehler <1%
   ohne absichtliche Quota-429); keine echten Nutzer-/Privatfotos kopieren.
2. **Restliche Abfragen optimieren:** Die Hauptbereiche Familie, Kontakte,
   Chat, Veranstaltungen, Teilnahme, Profilfotos, eigene Basar-Anzeigen,
   Merkliste und Partnerveranstaltungen werden jetzt bedarfsgerecht bzw.
   seitenweise geladen. Einzelne Nebenbereiche (z. B. Blocklisten,
   Einrichtungsverwaltung und organisatorische Profile) benötigen weitere
   fachliche Limits und Überprüfung auf echten Geräten.
3. **Supabase-Kapazität und Kosten:** Datenbank-Compute, Pooler/Verbindungslimits,
   API-Raten, Speicher-Bandbreite, CDN und Egress am tatsächlichen Tarif prüfen.
   Bei Bedarf Budgetalarm, Upgrade und getrennte Staging-Umgebung einrichten.
   Keine unbegrenzte Skalierung behaupten.
4. **Betriebsüberwachung:** p95 Antwortzeit, 5xx/429, DB-CPU, Verbindungen,
   Queue-Alter, Fehler bei Moderation und Push, Storage-Egress und KI-Kosten
   täglich und nach Release prüfen; Alarme und Bereitschaftsverantwortliche.
5. **Kosten- und Missbrauchsschutz:** globale KI-Limits nicht blind erhöhen;
   wirksame Limits für Anmeldung, Registrierung, Uploads und Nachrichten prüfen.
   KI- und Moderations-Quota-Erschöpfung muss für Nutzer klar erklärt werden.
6. **Wiederherstellung und Datenschutz:** automatisierte Backups/PITR gemäß
   Tarif, Wiederherstellungsprobe, Retention, Löschroutinen, RLS-/Penetrationstest
   und Moderationskapazität für Nutzeransturm vor Veröffentlichung bestätigen.
7. **Onboarding:** rechtssichere öffentliche Registrierung oder Einladungs-/
   Wartelistenstrategie mit Bot-Abwehr definieren; aktuelle Konto-Verifizierung
   erfordert menschliche Freigabekapazität.
8. **Echte Tests:** Expo-Builds für iOS und Android, Login, Scrollen, Galerie,
   abgelaufene signierte URLs, langsames Mobilfunknetz und Passwortänderungen
   gegen einen isolierten Testbestand verifizieren.

## Aktuelle Beratungshinweise

Die Supabase Performance Advisors melden derzeit keine fehlenden FK-Indizes
mehr. Zwei bestehende Paare identischer Indizes wurden nicht gelöscht, um
Abhängigkeiten zuerst zu prüfen. Die Security Advisors melden warnende
Security-Definer-Funktionen: diese dürfen nicht pauschal entzogen werden,
weil ihre Berechtigungen Bestandteil der App- und Adminlogik sind; pro Funktion
müssen Auth-Prüfungen und EXECUTE-Rechte geprüft werden. Aktivierung der
Supabase-Prüfung auf kompromittierte Passwörter ist ein Dashboard-Schritt.

## Phase 3 – Veranstaltungen, Zusagen und private Fotos

- Veranstaltungen werden nicht mehr beim Start geladen. Der separate
  Ereignisbereich verwendet `ff_events_page`: 20 Termine pro Seite, Cursor
  `(starts_at,id)`, unter den bestehenden Veranstaltungs-RLS-Regeln.
- Der Status der eigenen Teilnahmeanfragen wird pro sichtbarem Batch
  abgefragt. Organisatoren öffnen ausstehende Anfragen explizit und laden sie
  in 20er-Schritten nach. Keine systemweite Liste mit fremden Antworten.
- Persönliche Profilfotos werden nur für das tatsächlich geöffnete Profil
  (eigenes Profil oder ausgewählte Familie) geladen, ebenfalls in 20er-Seiten.
  Private Bilder werden über kurzlebige, signierte Links angezeigt.
- Änderungen an eigenen Fotos aktualisieren nur die Fotoansicht; Aktionen
  innerhalb des Veranstaltungsbereichs lösen keinen vollständigen Startabruf
  aller App-Daten mehr aus.
- Vier neue SQL-RPCs verwenden `SECURITY INVOKER`, `anon` hat keine
  EXECUTE-Rechte; bestehende RLS bestimmt die tatsächlich sichtbaren Zeilen.

**Offen:** Die Liste eigener Basar-Inserate hat noch eine feste Grenze von
160 Einträgen. Auch Organisationen, Partnerveranstaltungen, Blocklisten
und Favoriten müssen weiter gezielt geprüft und optimiert werden.
Geräte-Integrationstests, Testdaten in größerer Menge sowie ein gestufter
Lasttest fehlen weiterhin.

## Phase 4 – Eigenanzeigen, Merkliste und Partnerwelt

- **Eigene Basar-Inserate:** nicht mehr beim allgemeinen App-Start abgerufen.
  Erst beim Betreten des Basars lädt die App höchstens 30 eigene Anzeigen über
  `ff_my_market_page` (Cursor `created_at,id`). Weitere Anzeigen lassen sich
  ausdrücklich nachladen. Zugehörige private Fotos werden nur für diese IDs
  gelesen und gebündelt signiert; ältere Anzeige-Benachrichtigungen lösen
  eine gezielte, RLS-geschützte Detailabfrage aus.
- **Favoriten:** statt bis zu 800 Merkliste-IDs pro App-Start werden die
  Herz-Symbole ausschließlich für tatsächlich angezeigte Suchtreffer
  geprüft (`ff_market_favorite_flags`, höchstens 40 IDs je Aufruf).
  Die Merkliste selbst wird weiter von der bestehenden, seitenweisen
  `ff_market_search`-Funktion serverseitig gefiltert. Eine bisher falsche,
  nur mit eigenen Listings verrechnete Merkliste-Zahl wurde entfernt.
  Einzelne Favorit-Aktionen erfordern keinen globalen App-Refresh mehr.
- **Kita- und Partnerwelt:** zugängliche Einrichtungen und bevorstehende
  Partnerveranstaltungen werden erst beim Aufruf des Bereichs über
  `ff_partner_orgs_page` und `ff_partner_events_page` mit jeweils 20
  Einträgen geladen. Auch hier gibt es Nachladen und RLS-Schutz.
  Verknüpfte Einrichtungsnamen werden nur für tatsächlich angezeigte
  Partnertermine abgefragt. Eigene Einrichtungen werden für den
  Anzeigeneditor separat und nach Eigentümer gefiltert vorgeladen.
- Die vier neuen Funktionen verwenden `SECURITY INVOKER` und sind nur
  für `authenticated` ausführbar. Die bestehenden RLS-Regeln bleiben
  alleinige Instanz für lesbare Daten.

**Noch offen:** Persönliche Favoritenzähler über einen separaten
aggregierten Endpoint, vollständig paginierte eigene Einrichtungslisten,
Blocklisten und weitere Randbereiche, Monitoring, gestufte Lasttests und
eine echte Staging-Umgebung mit synthetischen Testdaten.
Der Free-Tarif ist unverändert.

## Status Phase 2

Backend-RPCs mit `SECURITY INVOKER` und ausschließlich `authenticated`-EXECUTE
sind im bestehenden Supabase-Projekt installiert. Der GitHub-Änderungssatz
enthält Client-Code und Tests. **Keine Freigabe für einen viralen Launch ohne
Lasttests, Prüfung im realen Mobilgerät und ausreichende Infrastruktur.**

## Phase 5 – kostenlose Betriebsbasis und sichere Lasttests (22.11.2026)

- Bestand geprüft: PostgreSQL 17.11, rund **16 MB** Datenbankgröße gegenüber
  500 MB Free-Kontingent, **7** PostgreSQL-Verbindungen bei konfigurierten
  60; 2 Profile und nur 2 eigene/fremde Inserate im Testbestand.
  Daher weiterhin keinerlei Kapazitätsbeleg für Tausende Nutzer.
- Die vier schon vorhandenen `pg_cron`-Aufgaben wurden ausgewertet:
  **4.608 Ausführungen in 24 Stunden, 0 Fehler** in diesem Fenster.
- Aktiviert: `private.ff_ops_snapshots` mit **stündlichen** technischen
  Messpunkten über `pg_cron`, 14 Tagen Eigenretention und
  **ohne personenbezogene Daten**. `private.ff_ops_latest_status`
  erkennt Warn-/Kritischschwellen und veraltete Messungen. Keine Rechte
  für `anon` oder `authenticated`; noch **kein** automatischer
  Alarmversand an Betreiber.
- Separates CLI-Programm `scripts/staging-readonly-load.mjs` für
  gedrosselte Lese-Lasttests vorbereitet. Produktive Projekt-URL ist
  **explizit verboten**, und der Test läuft nicht automatisch in CI.
  Testprojekt, synthetische Freigabe-/Marktdaten und Zugangsdaten
  fehlen weiterhin; es wurde **kein Produktions-Lasttest** durchgeführt.
- Kostenpflichtige Supabase-Funktionen oder Plan-Upgrades wurden
  **nicht** aktiviert. Der Free-Tarif bietet nach aktuellen Konditionen
  keine automatischen Datenbankbackups. Echte Backup-Probe,
  nachhaltige Fehlermeldungen, öffentliche Registrierung,
  Datensätze im Millionenbereich und p95-Ermittlung bleiben offen.

Betreiberanleitung: `SUPABASE-FREE-BETRIEB.md`.

## Phase 6 – Zuverlässige Aktualisierungen (22.11.2026)

- Das Öffnen einer Neuigkeit löst keinen allgemeinen Startabruf mehr aus.
  Ausschließlich die gewählte Benachrichtigung und ihr RLS-sichtbares
  Ziel werden gelesen; Anzeigenamen werden optional nachgeladen.
- Globale Datenladungen nutzen jetzt Konto-ID und eine monotone
  Request-Generation; veraltete Ergebnisse derselben Session werden
  verworfen. Auch das Nachladen von Familien und Kontakten prüft,
  ob zwischenzeitlich eine neue Aktualisierung gestartet wurde.
- Beim Kontowechsel werden alte Fehlermeldungen, Hinweise und
  noch nicht abgeschickte Meldetexte gelöscht.
- Nicht mehr erforderliche allgemeine Reloads nach Fotobeiträgen,
  Meldungen, Passwortwechsel, neuen Orten und Partneraktionen entfernt.
- Für bereits bestätigte Schreiboperationen wird ein später fehlgeschlagener
  Leserefresh nicht fälschlich als Schreibfehler dargestellt.
- Zusätzliche Regressionstests in CI. **Nicht ersetzt:** Echte
  Gerätetests bei Netzwerkwechsel, Integrationstests mit zwei Konten,
  Staging-Lasttests, Backups und Betriebsalarmierung.

Technische Details: `TECHNISCHE-ZUVERLAESSIGKEIT.md`.

## Phase 7 – Netzwerkfehler und doppelte Klicks (22.11.2026)

- Einmaliger zusätzlicher Versuch nur für temporär fehlgeschlagene
  **Leseanfragen**; niemals automatisches Wiederholen von
  Login, Chatversand, Inseraterstellung oder anderen Schreibaktionen.
- Konto-Start lädt nach Verbindungsfehler über eine sichtbare
  Schaltfläche neu, Basarsuche besitzt einen eigenen Retry-Button.
- Gemeinsame atomare Aktionssperre verhindert parallele
  Schreibaufrufe bei schnellen Mehrfachklicks und trennt die Sperre
  bei Kontowechsel. Sign-in ebenfalls mit unmittelbarer Sperre.
- Bei unklarer Serverbestätigung wird auf das Risiko einer bereits
  erfolgten Speicherung hingewiesen. **Noch keine Ende-zu-Ende-
  Idempotenz** für alle Schreibpfade nach App-Neustarts.
- Zusätzliche Unit- und statische Regressionstests im Native-CI.

Details: `TECHNISCHE-ZUVERLAESSIGKEIT.md`.

## Phase 8 – Nachrichten-Deduplizierung und sichere Kontakte (22.11.2026)

- Chatversand erkennt anhand einer eindeutigen, vom Client vor dem
  ersten Senden dauerhaft vorgemerkten UUID identische Wiederholungen;
  `messages.id` erzwingt die serverseitige Einmaligkeit.
  Der Moderations- und Zugriffsweg bleibt erhalten. Der neue Endpunkt
  unterstützt ältere App-Versionen ohne diese Sende-ID weiter,
  allerdings ohne Deduplizierung für alte Clients.
- Kontaktanfragen nutzen nun geprüfte RPCs statt der bereits
  entzogenen Tabellen-INSERT-/UPDATE-Rechte. Ein eindeutiger
  Paar-Index war bereits vorhanden und bleibt unverändert.
- `anon`-Aufrufe dieser RPCs sind gesperrt; privilegierte
  Kontaktschreiblogik liegt ausschließlich in einem nicht
  exponierten Schema. Keine direkten Tabellen-Schreibrechte
  für App-Konten eingeführt.
- Die Sendevormerkung enthält einen Hash des Texts, keine
  Nachrichteninhalte. Sie gilt je Konto/Kontakt und läuft nach
  sieben Tagen ab; nach bestätigtem Versand wird sie entfernt.
- **Offen:** Echte Staging-E2E-Läufe mit zwei freigegebenen
  Konten, Verbindungsabbruch nach erfolgreichem Insert,
  parallelen wiederholten Aufrufen und Moderationsfehlern.

Details: `TECHNISCHE-ZUVERLAESSIGKEIT.md`.
