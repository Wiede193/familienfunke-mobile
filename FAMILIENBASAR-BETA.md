# Familienbasar: sichere Beta und Zahlungen (Stand November 2026)

## Was im Test jetzt umgesetzt ist
- Inserate: Verkauf, Tausch und Verschenken; Text und optionales JPEG-Foto; zunächst nur für den Ersteller sichtbar.
- Öffentlich für eingeloggte, geprüfte Erwachsene erst nach **manueller Moderationsfreigabe**. Direkte SQL-/Storage-Zugriffe werden über Row-Level Security eingeschränkt.
- Kita-/Förderverein-/Familienzentrum-Anträge werden zunächst nur intern bzw. für Antragsteller sichtbar. Nur bestätigte Einrichtungen erscheinen öffentlich und erhalten die dezente Kennzeichnung ✦.
- Erst bestätigte Einrichtungen dürfen Partnerveranstaltungen einreichen; Veröffentlichung erst nach Moderation. Im Basar können solche Einrichtungen als Anbieter auftreten.
- Kontakte laufen über bestehende Kontaktanfragen und private Nachrichten (nicht über öffentliche Kommentarfelder).
- Ein freiwilliger Inklusionsbereich informiert ohne Speicherung von Behinderungs-/Diagnosedaten. Geschützte Gruppen sind noch **nicht** implementiert.

## Keine Zahlung, kein kostenpflichtiger Vertrag
- Keine Stripe-Abhängigkeit, keine Zahlungs-API-Aufrufe und keine echten Transaktionen.
- **Aktuelle Online-Zahlungsgebühr: 0 € – weil Online-Zahlungen nicht möglich sind.**
- Verkaufspreise sind reine Angebotsangaben. Übergabe und eventuelle Zahlung erfolgen außerhalb der App nach eigener Absprache.
- Vor der Einführung von Zahlungen müssen Stripe-Connect-Konto, KYC/Onboarding, steuerliche und rechtliche Anforderungen, Webhooks, Rückerstattungen, Dispute-Prozesse und Plattform-Provisionen geplant und getestet werden.
- Zahlungsstatus, Käufer- und Verkäufer-Salden dürfen **nicht** durch mobile Clients geschrieben werden. Entsprechende Tabellen und serverseitige Edge Functions entstehen erst bei echter Zahlungsintegration.
- Alle Gebühren sollen vor dem verbindlichen Kauf im Checkout transparent ausgewiesen werden. Die Höhe ist noch **nicht beschlossen**.
- Keine Kartendaten oder geheimen Stripe-Schlüssel in der App speichern.

## Wichtige Sicherheitsgrenzen
- Eine geprüfte Identität ist keine Garantie für einen sicheren Handel. Kein Käuferschutz und kein Versandtracking in dieser Beta.
- Der private Bucket ff-market-photos ist für Eigentümer und für freigegebene Artikel für angemeldete geprüfte Erwachsene sichtbar. Kein allgemeiner öffentlicher Zugriff.
- Medienfreigaben, Betrugsfälle, Verifizierung von Kita-Berechtigungen und verbotene Kinderartikel benötigen Betreiberprozesse und Moderationswerkzeuge vor öffentlichem Start.
- Detaillierte Datenschutzerklärung, Barrierefreiheitstests und rechtliche Prüfung sind vor der breiten Veröffentlichung notwendig.

## Betreiber-Freigabe (Beta)
- Organisation: in `public.ff_organizations` nach realer Prüfung `status='approved'` setzen. Ungeprüfte Einrichtungen bleiben verborgen und zeigen nie ein Abzeichen.
- Inserat: Text/Bilder nach Sichtprüfung in `public.ff_market_listings` den Status `moderation_status='approved'` geben.
- Veranstaltung: nach Sichtprüfung in `public.ff_partner_events` den Status `moderation_status='approved'` geben.
- Diese Vorgänge dürfen nur von berechtigten Betreibern ausgeführt werden, niemals durch öffentliche Client-Rollen. Ein eigenes Admin-UI folgt.

## Nächste Tests
1. Authentifiziertes und gesperrtes Konto: lesen, inserieren und Kontaktanfrage überprüfen.
2. Eigenes Inserat mit Foto einreichen; unsichtbar für andere bis zur Freigabe.
3. Organisation beantragen; nach Betreiberfreigabe Markierung ✦, Event anlegen und moderieren.
4. Screenreader, vergrößerte Schrift, Tastaturnavigation, Bedienbarkeit mit Motorik-Einschränkungen.
5. Stripe Connect erst nach freiwilliger Entscheidung und Freigabe aktivieren.
