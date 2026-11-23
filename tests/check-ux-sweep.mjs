import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {FAMILY_COLORS:C,FAMILY_TYPE:T,FAMILY_SPACE:S}=await import(
 'data:text/javascript;base64,'+Buffer.from(read('FamilyTheme.js')).toString('base64')
);
const L=hex=>{
 const x=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255)
  .map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
 return x[0]*.2126+x[1]*.7152+x[2]*.0722;
};
const ratio=(a,b)=>{
 const [h,l]=[L(a),L(b)].sort((x,y)=>y-x);
 return (h+.05)/(l+.05);
};
for(const surface of [C.paper,C.bg,C.sunPale])assert.ok(ratio(C.muted,surface)>=4.5,
 'Secondary text must contrast against all shared bright backgrounds: '+surface);
assert.ok(T.small>=14&&T.meta>=13&&T.body>=15);
assert.ok(S.touch>=44);

const app=read('App.jsx'),home=read('HomeAssistant.jsx'),market=app.slice(app.indexOf('function MarketScreen('),app.indexOf('function MarketSortSelect('));
const family=app.slice(app.indexOf('function DiscoverScreen('),app.indexOf('function FamilyDetail('));
const profile=app.slice(app.indexOf('function ProfileScreen('),app.indexOf('function InfoScreen('));
const map=read('FamilyMap.jsx'),guide=read('FamilyGuide.jsx');
const topics=read('FamilyTopicsSection.jsx'),inclusion=read('InclusionKnowledgeScreen.jsx');
const decisions=read('OfficialDecisionsScreen.jsx'),notices=read('NotificationCenterScreen.jsx');
const health=read('HealthyScreen.jsx'),play=read('FamilyPlayScreen.jsx');
const calendar=read('FamilyCalendar.jsx'),dateFields=read('FamilyDateFields.jsx');

assert.match(app,/selectedMainTab=TABS.some/);
assert.match(app,/accessibilityState=\{\{selected:selectedMainTab===id\}\}/);
assert.match(app,/guardProfileExit/);
assert.match(app,/onDirtyChange=\{setProfileDirty\}/);
assert.match(app,/accessibilityLabel=\{'Zurück aus '\+navTitle\}/);
assert.match(app,/const showBack=!!\(/);
assert.match(app,/styles\.headerBackButton/,'Back action must be clearly visible at the left edge of the header');
assert.match(app,/if\(tab==='market'&&marketSubpage&&marketBackRef\.current\)/,
 'Back from Basar details must close the detail first');
assert.match(app,/setMapIntent\(\{returnTab:'inclusion'\}\)/,
 'Map opened from inclusion must provide a return route');
assert.match(profile,/Ungespeicherte Profiländerungen/);
assert.match(profile,/onDirtyChange\?\.\(dirty\)/);
assert.match(app,/tabLabel:\{fontSize:12\.5/);

assert.match(home,/showMoreFeed/);
assert.match(home,/active&&showMoreFeed/);
assert.match(home,/Verfahrensstand offen/,'Do not mislabel promulgation or mediation as a parliamentary vote');
assert.match(market,/sellChoicesOpen/);
assert.match(market,/Einzelnen Artikel einstellen/);
assert.match(market,/Mehrere Kleidungsstücke erfassen/);
assert.match(market,/onBackStateChange\(inMarketSubpage\)/);
assert.match(market,/navigationBackRef\.current=\(\)=>\{/);
assert.ok(market.indexOf('Was möchtest du anbieten?')<market.indexOf('Informationen zu Gebühren und Datenschutz'),
 'Inserieren selection must open directly under its trigger, not after unrelated content');
assert.doesNotMatch(market,/<MarketCategoryDropdown label="Kategorie" value=\{filter\}/,
 'Product category must not appear twice in a single filter flow');
assert.match(family,/Einzelansicht/);
assert.match(family,/showInterestFilter/);
assert.match(family,/Interessen auswählen/);

const mapSearch=map.indexOf('Ort oder Ausflugsziel suchen');
const mapList=map.indexOf('Orte im Kartenausschnitt');
const mapCatalog=map.indexOf('Weitere Ausflugsziele entdecken');
assert.ok(mapSearch>=0&&mapList>mapSearch&&mapCatalog>mapList,
 'Map must show search and real list results before the optional catalogs');
assert.match(map,/showCatalog\?</);
assert.match(guide,/showRegionalDirectory\?</);
assert.ok(guide.indexOf('Eure Zeitleiste')<guide.indexOf('Stellen und Formulare nach Wohnort finden'),
 'Journey should appear before detailed official directories');
assert.ok(inclusion.indexOf('Deine nächsten Schritte')<inclusion.indexOf('Worum geht es?'));
assert.ok(topics.indexOf('Das könnt ihr jetzt tun')<topics.indexOf('Worum geht es?'));

for(const label of ['Was wurde entschieden?','Betrifft euch das?','Gilt es schon?'])
 assert.ok(decisions.includes(label),'Missing plain-language decision key question: '+label);
assert.match(decisions,/showSources\?</);
assert.match(notices,/groupForKind/);
assert.match(notices,/Familien & Nachrichten/);
assert.match(notices,/Familienbasar/);
assert.match(health,/firstPerType/);
assert.match(health,/HEALTH_CATEGORIES.find/);
assert.match(play,/GAME_GROUPS/);
assert.match(play,/gameGroup===key/);
assert.match(play,/Schnelle Familienspiele/);

assert.match(dateFields,/monthDays\(month\)/);
assert.match(dateFields,/minHeight:46/);
assert.match(dateFields,/Andere Uhrzeit oder Datum eingeben/);
assert.match(dateFields,/accessibilityState=\{\{selected:date===day\}\}/);
assert.match(calendar,/<FamilyDateFields title="Terminzeit auswählen"/);
assert.match(app,/<FamilyDateFields title="Wann findet die Aktivität statt\?"/);
assert.match(app,/<FamilyDateFields title="Veranstaltungstermin auswählen"/);
assert.doesNotMatch(dateFields,/Math\.random|fetch\(|supabase/);

assert.match(read('AboutAndHelp.jsx'),/geschlossene Testversion/);
assert.match(app,/Testphase ist derzeit nur mit bereits eingerichtetem Konto zugänglich/);
console.log('App-wide UX checks: contrast, readability, navigation, forms, disclosures, workflows and grouping passed.');
