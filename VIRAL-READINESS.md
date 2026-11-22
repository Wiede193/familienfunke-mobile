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
2. **Restliche Abfragen optimieren:** Familien-, Kontakt- und Chatbereiche sind
   jetzt cursor-paginiert. **Nicht vollständig optimiert** sind u. a. öffentliche
   Veranstaltungen, Teilnahmeanfragen, Profilfotolisten, eigene Inserate,
   Partner- und Organisationslisten. Die anfänglichen festen Grenzen können
   bei großen Datenbeständen weiterhin Einträge verbergen. Pro Bereich unter
   RLS nutzerspezifisch filtern, nachladen und auf echten Geräten testen.
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

## Status Phase 2

Backend-RPCs mit `SECURITY INVOKER` und ausschließlich `authenticated`-EXECUTE
sind im bestehenden Supabase-Projekt installiert. Der GitHub-Änderungssatz
enthält Client-Code und Tests. **Keine Freigabe für einen viralen Launch ohne
Lasttests, Prüfung im realen Mobilgerät und ausreichende Infrastruktur.**
