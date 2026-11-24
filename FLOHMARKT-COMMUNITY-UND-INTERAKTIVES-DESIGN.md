# Familienfunke – Community-Flohmarkt ohne manuelle Vorabfreigabe

Stand: 24. November 2026. Für das verbundene Supabase-Projekt wurden drei
Datenbankmigrationen erfolgreich angewandt:

1. `market_direct_publish_and_community_report`
2. `disable_market_prepublication_manual_queue`
3. `market_admin_postpublication_report_resolution`

## Neuer Ablauf

- Nur weiterhin freigegebene erwachsene Mitglieder dürfen Inserate anlegen.
- Ein neues Inserat wird unter RLS zunächst als `pending` erstellt,
  damit die Fotos in einem kontrollierten Speicherzustand hochgeladen werden
  können. Anschließend bestätigt die autorisierte RPC
  `ff_market_publish_listing(p_listing_id)` die Veröffentlichung als
  `approved`, ohne Betreiberfreigabe.
- Es gibt **keine neue manuelle Vorab-Warteschlange**. Der alte
  `ff_market_review_queue_sync`-Trigger erzeugt keine neuen Aufträge.
- Nach Änderungen an einem bestehenden Angebot wird der neue Entwurf
  ebenfalls mit demselben RPC veröffentlicht. Fehlgeschlagene Foto-Uploads
  bleiben als Entwurf gespeichert. Der Nutzer kann die Veröffentlichung
  über **Meine → Jetzt veröffentlichen** wiederholen.
- Es werden für diese Freigabe **keine kostenpflichtigen KI-API-Aufrufe**
  ausgelöst.

## Serverregeln und Missbrauchsgrenzen

- RLS verhindert eine direkte Selbstfreigabe durch ein UPDATE.
  Der Publish-RPC kontrolliert `auth.uid()`, Inserats-Eigentümer,
  die Erwachsenen-Freigabe, ein ggf. erforderliches gültiges Partnerkonto,
  den Entwurfsstatus, Platzhalter und eine einfache Liste verbotener
  Produktbegriffe.
- Schutz vor Masseninseraten: maximal 30 neu veröffentlichte Anzeigen
  pro Verkäufer innerhalb von 24 Stunden. Weitere Versuche liefern einen
  verständlichen Fehler.
- Diese **Schlüsselwortprüfung kann Bildinhalte, subtile Täuschung,
  Fälschungen oder Umgehungsschreibweisen nicht erkennen**. Die Funktion
  ist keine vollständige automatische Inhaltsmoderation.

## Community-Meldungen

- Angebot öffnen → **Problem mit Anzeige melden**.
- Grund auswählen: Unzulässiger Artikel, Betrugsverdacht, Kinderschutz,
  Spam, Sonstiges. Beschreibung mit 10–1200 Zeichen.
- Die authentifizierte RPC `ff_market_report_listing(...)` prüft:
  gemeldetes Angebot muss sichtbar, der Meldende aktiv und nicht Verkäufer
  sein; pro Mitglied und Anzeige ist nur eine Meldung möglich.
- **Drei voneinander unabhängige Meldungen** durch freigegebene
  Erwachsene innerhalb von 30 Tagen führen zu `removed` – die Anzeige
  verschwindet aus Such- und Ergebnislisten.
- Bei Meldungen mit Grund **Kinderschutz** beträgt die Schwelle
  **zwei unabhängige Meldungen**.
- Meldungen werden in `public.reports` dokumentiert. Die allgemeine
  direkte `reports`-INSERT-Berechtigung ist für `subject_type='market'`
  bewusst gesperrt; der Markt-Meldeweg führt nur über die geprüfte RPC.
- Mit der separaten RPC
  `familienfunke_admin_market_report_action(...)` kann ein
  berechtigter Moderator **nach** einer Prüfung eine Anzeige entfernen
  oder wiederherstellen. MFA ist Pflicht, die Entscheidung wird im
  vorhandenen privaten Moderationsprotokoll erfasst.
- Eine Meldung allein beweist **keinen** Regelverstoß. Das Team muss
  Falschmeldungen und Missbrauch beobachten und bei Beschwerden reagieren.
  Bereits geschlossene Meldungen zählen nicht für neue Schwellen.

## Was diese Änderung nicht bedeutet

- Die Kontoverifizierung, Profilsichtbarkeit, Schutzregeln für private
  Nachrichten und die Prüfung von Veranstaltungen sind **nicht**
  abgeschafft.
- Es ist **kein Zahlungssystem** eingebaut.
- Die App ist damit noch kein unbeaufsichtigter Marktplatz für beliebige
  Produkte. Insbesondere Kinderschutz, Betrug, gefährliche Produkte,
  Missbrauchsmeldungen und Datenschutz erfordern vor breiter
  Veröffentlichung einen funktionierenden Betreiberprozess.
- Die zwei bereits vorhandenen, alten Entwürfe wurden **nicht pauschal**
  veröffentlicht. Eigentümer können die neue Schaltfläche benutzen.

## Überarbeitung der Benutzerführung

- `FamilyInteraction.jsx`: lesbare Aktionsrückmeldungen,
  Fortschrittsanzeigen und antippbare Hilfen.
- Gemeinsame Schaltflächen reagieren auf Berührung, Textfelder heben sich
  beim Fokus ab und zeigen bei Bedarf Zeichenzähler.
- Neue Seiten gleiten kurz hinein; reduzierte Animationen bleiben möglich.
- Die Startseite bietet Schnellzugriffe für Anzeigen, Nachrichten und
  Veranstaltungen. Bei nicht freigegebenen Konten führt die
  Anzeigen-Aktion zur Profilergänzung statt ins Leere.
- Die Angebots- und Veranstaltungsformulare zeigen konkrete noch
  fehlende Angaben. Nur der Flohmarkt veröffentlicht direkt;
  Veranstaltungsprüfungen bleiben aktiv.
- Regres­sionstest: `npm run check:market-community`.

## Unbedingt manuell am Gerät testen

1. Mit freigegebenem Testkonto eine harmlose Anzeige mit mindestens
   einem Foto erstellen: Nach erfolgreichem Upload muss sie direkt in
   der Basarsuche auftauchen.
2. Anzeige bearbeiten und erneut veröffentlichen, dann als vergeben markieren.
3. Foto-Upload abbrechen: Entwurf in **Meine** suchen und per
   **Jetzt veröffentlichen** abschließen.
4. Mit einem anderen Testkonto die Anzeige melden. Ohne mehrere
   verschiedene freigegebene Konten darf sie nicht automatisch verschwinden.
5. Kinderschutzmeldungen niemals für Testzwecke mit echten
   personenbezogenen oder problematischen Bildinhalten erzeugen.
6. Smartphone mit großer Schrift und aktivierter Bewegungsreduzierung
   testen; Meldegrund, Formulare und Hilfen müssen erreichbar bleiben.

Wenn der Betreiber die Community-Funktion allgemein freischaltet,
sind zusätzlich periodische Qualitätskontrollen und
Reaktionszeiten bei Meldungen zu planen.
