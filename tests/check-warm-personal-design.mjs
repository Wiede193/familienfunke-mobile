import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {FAMILY_UI:UI,FAMILY_RADII:R,FAMILY_SPACE:S,FAMILY_COLORS:C}=await import('data:text/javascript;base64,'+Buffer.from(read('FamilyTheme.js')).toString('base64'));
assert.equal(UI.card.borderRadius,R.card);assert.equal(UI.primary.borderRadius,UI.secondary.borderRadius);assert.ok(UI.primary.minHeight>=48&&UI.secondary.minHeight>=48);assert.ok(S.touch>=48);
for(const p of ['App.jsx','HomeAssistant.jsx','FamilyMap.jsx','OfficialFamilyEvents.jsx','FamilyCalendar.jsx','TopRightMenu.jsx','FamilyFeedback.jsx','FamilyInteraction.jsx','FamilyGuide.jsx']) assert.match(read(p),/\.\.\.UI\.card/,'Shared card styling missing in '+p);
const home=read('HomeAssistant.jsx');assert.match(home,/FULL_PLACE_CATALOG,\{region,interests:profile/);assert.match(home,/placeRecommendationReason\(\{isLocal,matchedInterests\}\)/);assert.match(home,/!userId\|\|!active\|\|!showMoreFeed/);assert.match(home,/Region & Hobbys anpassen/);assert.ok(home.indexOf('Ausflugsideen für euch')<home.indexOf('Schnell erledigt'));assert.match(home,/homeGreeting\(profile\)/);
console.log('Warm design and explainable personalization: source checks passed.');
