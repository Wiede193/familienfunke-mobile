# Sicherheitsprüfung – 21. November 2026

## Umfang und Grenzen
Serverseitige Metadaten-/Codeinspektion, Supabase Security Advisor und gezielte SQL-Negativtests. Kein unabhängiger Penetrationstest, keine vollständige HTTP-/Geräteprüfung. Keine Nutzerinhalte oder realen Konten verändert.

## Befunde und umgesetzte Korrekturen
- Alter Edge-Endpunkt moderate-market-listing (nicht mehr in den aktuellen App.jsx-Dateien verwendet): prüfte nur Hauptfoto und keinen review_version-Wert. Version 2 antwortet 410 und nimmt keinerlei Änderungen vor. Aktuelle ff-market-review bleibt unverändert.
- Chat: der bestehende serialisierende Trigger prüft beim INSERT zusätzlich beide Teilnehmer auf is_active_adult und not_blocked. Vorher lagen diese Prüfungen nur vor der Moderationsanfrage im Edge-Dienst; die neue Prüfung reduziert das Zeitfenster bei zwischenzeitlicher Sperrung. Bestehende Fünf-Nachrichten-Grenze bleibt.
- ff_market_search: NULL für Limit/Offset wird abgewiesen, Suchnormalisierung erfolgt erst nach Längenprüfung. Bestehende Suchlogik und andere Berechtigungen bleiben.
- Zusatzfoto-Metadaten: RLS-Regel verwendet nun den tatsächlichen Verkäufer des Fotos statt eines tautologischen Vergleichs.
- Migration ff_security_hardening_20261121 angewendet; alle neuen Bedingungen anschließend auf dem Live-Datenbankschema bestätigt.

## Tatsächliche Prüfungen
- 38/38 Tabellen in public und private mit RLS; beide Storage-Buckets nicht öffentlich.
- Kein INSERT-Recht für authenticated auf messages, kein SELECT für anon auf messages, kein UPDATE von moderation_status auf ff_market_listings für authenticated.
- 0 von 13 Admin-RPCs für anon aufrufbar. Mit synthetischer JWT-Identität ohne Staff-Rolle in zurückgerollter SQL-Transaktion: fünf privilegierte Lesezugriffe (overview, accounts, market_reviews, market_photo_paths, photo_path) verweigert; can_preview_photo=false.
- Restriktive Zusatzpolicies bei gesperrten Mitgliedern/Statusänderungen geprüft; nicht pauschal entfernen.
- Security Advisor meldet 19 RLS-Tabellen ohne Policy (private bzw. nur serverseitige Jobs), 26 für authenticated aufrufbare SECURITY DEFINER-Funktionen (bewusst exponierte RPCs; interne Prüfungen weiterhin einzeln zu testen), deaktivierten Schutz gegen geleakte Passwörter.

## Vor öffentlichem Start
1. Schutz gegen bekannte kompromittierte Passwörter in Supabase Auth aktivieren, falls Tarif unterstützt; ansonsten geeignete Alternative evaluieren. Keine Änderung der Tarifkosten ohne Freigabe.
2. MFA für Betreiber und Admin-Workflows mit erneuter Bestätigung, rollenbezogen testen. Staff-Rollenprüfungen sind kein Ersatz für MFA.
3. Autorisierte Negativtests mit zwei getrennten Testkonten, unverified, suspended und geblockten Konten: Nachrichten, Profil-/Bildzugriff, Einwilligungsentzug, Signatur-URLs und Cache-Lebensdauer, Moderation, Admin-Aktionen. Logout/Kontowechsel und Standortdaten prüfen.
4. Alle öffentlich erreichbaren KI-/Kartenfunktionen auf globale und pro-Konto-Kostenlimits, Request-Größe, wiederholte Aufrufe, Fehlerantworten und Authentifizierung prüfen. Bei Nachrichten beachten, dass der Moderationsanbieter Nachrichteninhalte empfängt; Datenschutzinformation und Dienstleister prüfen. Keine Ende-zu-Ende-Verschlüsselung behaupten.
5. Push vor Aktivierung: Altimplementierungen vereinheitlichen, Geräte-Token an Opt-in und Nutzer binden, Kontowechsel testen; keine privaten Inhalte auf Sperrbildschirm ohne Einwilligung.
6. Unabhängige Sicherheitsprüfung, Abhängigkeiten, Secret-Scanning und Produktionsmonitoring vor Launch.

Advisor-Referenzen:
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
