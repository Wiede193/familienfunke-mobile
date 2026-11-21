# Freigabeplan: geräteübergreifende Layout-Synchronisierung
Stand 21.11.2026: Isolierter PostgreSQL-17-Lauf 44954559045 bestanden. Die simulierten Kontorollen ersetzen keine reale Supabase-API-Abnahme.

## Vorbereitung
- Eindeutig eine nichtproduktive Supabase-Umgebung auswählen. Keine kostenpflichtige Branch-Erstellung ohne Zustimmung, keine echten Familiendaten kopieren.
- Exakt geprüfte Datei database/ff_layout_preferences.sql verwenden. Keine bestehenden Profil-, Nachrichten- oder Marktplatztabellen ändern. Bei gleichnamiger Tabelle zuerst Schema, Policies und Rechte vergleichen.
- Installation als transaktionale Migration, danach database/ff_layout_postflight.sql als Administrator ausführen und Sicherheitsadvisors prüfen.

## Abnahme im Staging
- Zwei künstliche Konten anmelden. Konto A speichert eine Anordnung; zweites Gerät erhält sie nach Aktualisierung.
- Konto B darf A weder lesen noch ändern; anonyme Anfragen müssen scheitern. Ungültige IDs, Duplikate, fehlendes Startsymbol und Revisionssprünge müssen abgelehnt werden.
- Offline speichern, wieder verbinden, konkurrierende Serveränderung erzeugen. Beide Konfliktoptionen testen.
- Kontowechsel, Abmeldung, Löschung eines Testkontos und vorübergehend nicht verfügbare Tabelle prüfen. Lokale Einstellungen bleiben verfügbar.

## Produktivfreigabe erst nach Freigabeentscheidung
- Backup-/Wiederherstellungspunkt und Zielprojekt kontrollieren. Nach bestandener Staging- und Geräteabnahme exakt dieselbe SQL-Datei anwenden, Postflight und Advisors erneut prüfen.
- Bei Problemen keine Nutzereinstellungen löschen. Zugriffsrechte für das Feature nach gesonderter Entscheidung pausieren; lokale Einstellungen bleiben verfügbar.
- App erst nach erfolgreicher Abnahme veröffentlichen. Keine Service-Role-Schlüssel im Client.
