# Familienfunke – Regeln für den Familienbasar

**Zweck:** Ein privater, familienfreundlicher Flohmarkt zum Verkaufen, Tauschen und Verschenken von Gegenständen. Kein Ersatz für einen allgemeinen Kleinanzeigenmarkt.

## Geeignete Angebote
Kinder- und Babykleidung, Spielzeug, Bücher, Babyausstattung, Möbel, Alltags- und Freizeitgegenstände. Auch Hilfsmittel für den Alltag wie Rollstühle und Rollatoren sind grundsätzlich willkommen, sofern das jeweilige Angebot rechtmäßig ist. Haustierzubehör, Kuscheltiere, Spielzeugwaffen und ungefährliche Kostümartikel dürfen nicht allein wegen einzelner Schlagwörter ausgeschlossen werden.

## Nicht zugelassen
- Waffen, Munition, gefährliche Waffen-Nachbildungen, Explosivstoffe, Feuerwerk und gefährliche Chemikalien oder Pestizide.
- Alkohol, Tabak, E-Zigaretten und Vapes, Drogen, Cannabisprodukte und Konsumzubehör.
- Arzneimittel, Nahrungsergänzungsmittel, Dopingpräparate und gesundheitlich riskante oder rezeptpflichtige Erzeugnisse.
- Pornografische oder erotische Waren, sexuelle Dienstleistungen und nicht jugendfreie Inhalte (FSK/USK 18).
- Lebende Tiere (auch zum Verschenken oder Tauschen), geschützte Tierarten und verbotene Tierprodukte. Anders als bei Kleinanzeigen gibt es bei uns **keine Tiervermittlung**.
- Fälschungen, Diebesgut, illegal kopierte Software/Medien, Marken- oder Urheberrechtsverletzungen, gefälschte Ausweise.
- Extremistische, rassistische, gewaltverherrlichende oder diskriminierende Propaganda.
- Gewisse Gefahrstoffe, illegal gehandelte Produkte und Artikel aus Sicherheitsrückrufen.
- Finanzprodukte, Kredite, Wetten, Glücksspiel, digitale Accounts und handelbare Daten.
- Reine Werbung, Spam, Dienstleistungen, Jobanzeigen, Mehrfachangebote und Inserate mit Täuschungsabsicht.
- Private Adressen, Telefonnummern, sensible personenbezogene Daten und fremde Bilder ohne Berechtigung in Anzeigen.

Die Liste ist nicht abschließend. Rechtliche Regeln und produktspezifische Sicherheitsbestimmungen gelten zusätzlich.

## Moderation
1. Neue Inserate werden grundsätzlich zunächst als **pending** gespeichert. Bis zum erfolgreichen Review sind sie für andere Familien unsichtbar.
2. Der Server prüft Besitzberechtigung/Anmeldestatus, Angebotsdaten, Text und – falls vorhanden – das private hochgeladene JPEG-Foto. Ein klientseitiger Check ist niemals die einzige Sicherheitsgrenze.
3. Der kostenlose OpenAI-Moderationsendpunkt überprüft schädliche Texte und Bilder. Zusätzlich bewertet ein kontextbewusstes KI-Modell den tatsächlich angebotenen Gegenstand anhand von Titel, Beschreibung und Foto gemeinsam – ausdrücklich ohne alleinige Ablehnung aufgrund eines Schlüsselworts.
4. Nur eindeutige, technisch erfolgreich geprüfte Inhalte können automatisch freigegeben werden. Klare Verstöße wie echte Tierangebote werden abgelehnt. Bei auffälligen Moderationsergebnissen, fehlgeschlagenen Prüfungen oder zweifelhaften Fällen bleibt das Inserat gesperrt und wartet auf menschliche Sichtung. **Spielzeugpistolen, Kuscheltiere und Tierzubehör dürfen nicht wegen eines einzelnen Wortes scheitern.**
5. Auch die kombinierte Text-/Bild-Klassifikation ist nicht fehlerfrei: Ein irreführendes Bild oder zweideutige Beschreibung können durchrutschen oder zu einer falschen Bewertung führen. Meldungen, menschliche Nachprüfung und regelmäßige Tests bleiben erforderlich. Vor öffentlichem Rollout sollte der gesamte Freigabefluss mit realen Testkonten geprüft werden.
6. Alle Freigaben müssen serverseitig gegen nachträgliches Ändern bereits geprüfter Daten abgesichert werden; eine aktuell schwebende Prüfung darf kein geändertetes Inserat freigeben.

**Maßgebliche Referenz für den Umfang, nicht zur wörtlichen Übernahme:** https://themen.kleinanzeigen.de/policy/

## Gezielte Prüffälle für die neue Kontext-KI
| Inserat | Soll-Ergebnis |
|---|---|
| „Schaf Lena“ – weiches Kuscheltier mit Foto | automatisch freigeben |
| Bunte Plastik-Spielzeugpistole im Kinderzimmer | automatisch freigeben |
| Kinderdecke mit Hundemotiv | automatisch freigeben |
| Hundeleine ohne Tierangebot | automatisch freigeben |
| „Welpe in gute Hände“ oder „Katze zu verschenken“ | ablehnen |
| Schildkröte gegen Schutzgebühr | ablehnen |
| Echte Schusswaffe oder scharfe Munition | ablehnen |
| Täuschend echt aussehende Spielzeugwaffe | zur manuellen Prüfung |
| Foto zeigt echtes Tier, Titel behauptet „Stofftier“ | ablehnen oder zurückhalten |
| Medikamente, Alkohol, Tabak, Drogen | ablehnen |
| Fehlender KI-Dienst, unlesbares Foto oder laufende Änderung | niemals automatisch freigeben |
| Unberechtigter Nutzer ruft fremde Inserat-ID auf | keine Freigabe |

Das sind **Soll-Ergebnisse**, keine bereits durchgeführten Live-Tests. Ein End-to-End-Test mit authentifizierten Familienkonten steht noch aus.
