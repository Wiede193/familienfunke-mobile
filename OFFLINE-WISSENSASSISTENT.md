# Familienfunke: Wissensassistent ohne kostenpflichtige KI (Beta)

**Stand: 24. November 2026**

## Antwortlogik

`HomeAssistant.jsx` zeigt einen Button **Antwort finden**. Die Funktion `answerFamilyQuestion`
aus `FamilyKnowledgeAnswer.js` arbeitet ausschließlich lokal mit den bereits mitgelieferten,
redaktionell kuratierten Daten in `FamilyTopicsKnowledge.js`, `InclusionKnowledge.js`,
`FamilyHealthyContent.js` und `HomeNavigation.js`.

Die Eingabe wird normalisiert, mit gewichteten Stichwörtern den Texten zugeordnet und
als **fest hinterlegte Beschreibung** beziehungsweise **Auszug aus vorhandenen Ratgebern**
angezeigt. Passende offizielle Quellen werden als externe Links gezeigt. Eine eigene
faktengenerierende KI ist das **nicht**.

Eine eng begrenzte Wissensfrage zur Sonne ist mit einer offiziellen NASA-Quelle hinterlegt:
https://science.nasa.gov/sun/facts/ — Durchmesser etwa 1,4 Millionen Kilometer.

Fehlen verlässliche Treffer, meldet die App das offen. Rechtliche Ansprüche, Gesundheitsfragen,
örtliche Barrierefreiheit, Preise und Veranstaltungstermine werden nicht erfunden oder live
durch das Antwortmodul geprüft.

## Geld und Sicherheit

- Die Antwortfunktion ruft **weder OpenAI noch Supabase** auf; Fragen werden nicht serverseitig gespeichert.
- Die gesonderte Taste **Suchen** nutzt weiterhin die bestehenden Supabase-Suchen.
  Das kostet keine Modell-Tokens, unterliegt aber den normalen Supabase-Kontingenten.
- Die vorherigen kostenpflichtigen GPT-Endpunkte `ff-app-assistant`, `ff-market-scan` und
  `ff-market-review` sind auf dem Server blockiert, auch für ältere App-Versionen.
  Der ursprüngliche Code bleibt nur als deaktivierte Entwicklungsgrundlage erhalten.
- Die Fotoerkennung, automatische Artikelprüfung und KI-Ausflugsrangfolge sind deaktiviert.
- Basarinserate bleiben bis zur **menschlichen Freigabe** im Status `pending`.
  Die bereits angewandte Datenbankmigration `ff_market_zero_cost_manual_review`
  stellt neue und bearbeitete Anzeigen direkt auf `manual` in der geschützten Warteschlange.
  Admin-Freigaben prüfen weiterhin Berechtigung, Verkäufer und unveränderte Versionen.
- Separate OpenAI-**Moderation**-Endpunkte anderer App-Funktionen sind davon nicht ersetzt;
  diese Integration ist weiterhin zu prüfen und ist keine eigene Offline-Moderation.
- Vollständig kostenloser Betrieb für unbegrenzt viele Nutzer ist nicht zugesichert.
  Das bestehende Supabase-Free-Kontingent und sonstige Infrastrukturgrenzen gelten weiter.

## Tests

`npm run check:home` prüft Testfälle für Fragen und original belegte Kurzantworten
sowie die Abwesenheit kostenpflichtiger KI-Aufrufe in den nativen Eingabepfaden.
Die vorhandenen CI-Prüfungen enthalten außerdem Rechte- und Moderationsverträge.

Vor einem öffentlichen Start: menschliche Moderation personell sicherstellen;
Ratgeber und externe Quellen regelmäßig überprüfen, neue Geräte in Expo Go testen und
den vollständigen nativen CI-Build abnehmen. Eine neue KI-Freigabe darf nur nach einer
bewussten Budgetentscheidung erfolgen.
