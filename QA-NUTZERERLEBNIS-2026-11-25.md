# Familienfunke – Nutzererlebnis und Wettbewerbsvergleich

## Stand der realen Android-Tests
- Login smoke: run 45710232096 passed.
- Member smoke: run 45710232184 failed on "Funktion im Menü suchen". Tour, personalized start and Kindergeld input with immediate result passed preceding assertions. Remaining steps untested.
- Artifact 15067901893: screenshots show Android system status bar over header and system navigation over bottom tabs. P0: correct native safe-area handling across app and modal surfaces. Do not relax the menu assertion to hide this. Root and menu currently use deprecated React Native SafeAreaView. Causality for failed tap remains to be confirmed after fixing.
- Search "Kindergeld" shows Kinderzuschlag as prominent direct result. P1: exact topic should outrank related topics; evaluate actual result opening and source. Button text inconsistent ("Ergebnisse anzeigen" vs "Suchen"). 
- Home: recommendation cards use repeated heart icons and crop descriptions. Test compact shortcuts, regional variety, relevance and source labels rather than adding more menus.

## Qualitative review research (25 Nov 2026)
Sources are a purposive sample, not a representative survey; no usage claims from reviews.
- Kleinanzeigen: local search, predictable filters and direct contact; complaints about irrelevant ads, duplicate or delayed messages and filter quality. https://play.google.com/store/apps/details?hl=de&id=com.ebay.kleinanzeigen ; https://apps.apple.com/de/app/kleinanzeigen-dein-marktplatz/id382596778?see-all=reviews
- Vinted: photo-first browse, favorites and item attributes; complaints about imprecise sizes, lack of local filtering, shipping price, irrelevant feed. https://apps.apple.com/de/app/vinted-secondhand-marktplatz/id632064380?see-all=reviews ; https://www.reddit.com/r/VintedDeutschland/comments/1y4bwdd/unpassende_gr%C3%B6%C3%9Fen_im_feed/
- Momunity: parent contacts and marketplace; complaints about polarized conversations. https://apps.apple.com/de/app/momunity-mamas-schwangere/id1264526741
- FamilyWall: calendars, reminders and daily coordination, voluntary use and support. https://apps.apple.com/de/app/familywall-familienplaner/id496889629

## Human-oriented QA tasks (offline fictional data first)
Run separate flows so failure in menu doesn't hide other issues. No live personal data, no public posts, no production writes. Human usability sessions remain necessary; automation cannot genuinely experience emotion or confusion.
1. New parent: open app, skip tour, find child benefit guidance without prior menu knowledge; open exact result, source and back. Record time/taps, wrong turns, result rank and screenshots. Target: direct relevant result, no more than 3 deliberate taps after typing.
2. Local bargain hunter: find children's trousers size 116, 0–5 EUR, within local pickup range, with both matching and distracting fixture records. Zero out-of-filter results; filters remain visible and preserved after opening/back; favorites work in fixture and later staging. Separate browse and sell tabs; two-column photos with readable price, size, condition and coarse location.
3. Seller: choose sample photo, enter title/category/size/price/condition, preview; wrong/empty values, repeated taps, offline save and return. Do not publish to production. Verify mock and later real staging writes separately.
4. New resident: select swimming and hiking plus custom hobby, find local contacts and outing, verify matches and privacy. Never expose exact home location.
5. Busy parent: locate family calendar, add sample event, edit, cancel, navigate back. Test error and offline state.
6. Accessibility: system bars, 48dp touch targets, large fonts, screen reader labels, contrast, keyboard, Android hardware back, small and normal display; iOS later.
7. Explore like a returning user: saved search, local weekend events, saved places, games, opt-in reminders. Observe value delivered; do not optimize raw session length at expense of user control.

Measure successful task completion, taps, elapsed time, search relevance, error recovery, duplicate actions, and voluntary 7-day/30-day return in real opt-in pilot. No analytics installation without privacy review. Targets are hypotheses to validate with 5–10 real parents initially. Preserve familiar conventions but no copying proprietary assets or branding.

## Video concept – research only, not implemented
Start editorial, parent-facing curated videos in optional existing knowledge/menu area; no new fixed tab, no auto-play or open uploads. Creator submits YouTube link and category; admin approves, source and advertising clear, load player after privacy decision. Use official embed, honor Made for Kids, branding, referrer, privacy and ads restrictions. No YouTube partnership implied, no downloading/rehosting. Independent hosting later only after audience and rights are secured, costs scale with delivered minutes. No paid providers activated.
Sources: https://developers.google.com/youtube/terms/developer-policies ; https://developers.google.com/youtube/terms/required-minimum-functionality ; https://support.google.com/youtube/answer/171780 ; https://developers.cloudflare.com/stream/pricing/ ; https://www.die-medienanstalten.de/service/merkblaetter-und-leitfaeden/leitfaden-werbekennzeichnung-bei-online-medien/ ; https://developer.apple.com/app-store/review/guidelines/
