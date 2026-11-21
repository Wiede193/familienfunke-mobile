import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('App.jsx');
const home=read('HomeAssistant.jsx');
const map=read('FamilyMap.jsx');
const guide=read('FamilyGuide.jsx');
const intro=read('WelcomeIntro.jsx');
const help=read('AboutAndHelp.jsx');

// These checks are regression guards, NOT an automated accessibility certification.
assert.doesNotMatch(intro,/setTimeout\(|15000|AccessibilityInfo\.isScreenReaderEnabled/,
  'The welcome dialog must never close because a timer expired');
assert.match(intro,/accessibilityViewIsModal/,'Welcome must isolate modal focus');
assert.match(intro,/accessibilityRole="header"/,'Welcome needs a semantic heading');

assert.match(app,/function Button\([\s\S]{0,350}accessibilityState=\{\{disabled:/,
  'Shared buttons need screenreader disabled state');
assert.match(app,/accessibilityLabel=\{accessibilityLabel\|\|title\}/,
  'Buttons including symbol buttons need a meaningful name');
assert.match(app,/function Chip\([\s\S]{0,200}if\(!onPress\)return <View/,
  'Static chips must not be announced as disabled buttons');
assert.match(app,/accessibilityLabel="Stadt oder Landkreis suchen"/,
  'Region picker input needs an accessible name');
assert.match(app,/accessibilityState=\{\{expanded:open\}\}/,
  'Region picker must announce expanded state');
assert.match(app,/accessibilityLabel="Private Nachricht schreiben"/,
  'Chat composer must have a label');
assert.match(app,/accessibilityLabel=\{'Gespräch mit '/,
  'Contacts should announce the action');
assert.match(app,/accessibilityLabel="Nur Familien aus meiner Region anzeigen"/,
  'Region filter switch needs an explicit label');
assert.match(app,/accessibilityLabel="Nur Familien mit gemeinsamen Hobbys anzeigen"/,
  'Interest filter switch needs an explicit label');
assert.match(app,/accessibilityLabel="Familienprofil für andere Familien sichtbar"/,
  'Privacy switch needs an explicit label');
assert.match(app,/accessibilityLiveRegion="assertive"/,
  'Errors should be announced when they appear');
assert.match(app,/accessibilityViewIsModal style=\{styles\.modalShade\}/,
  'Report dialog should isolate its contents');
assert.match(app,/<Modal visible=\{!!reportTarget\}/,
  'Report dialog should be a native modal');
assert.match(app,/singleColumn=screenWidth<375\|\|fontScale>=1\.5/,
  'Marketplace cards should reflow at large font sizes');
assert.match(app,/width:44,height:44,borderRadius:22/,
  'Kistenmodus photo position controls need larger touch surfaces');
assert.match(app,/minHeight:44,paddingVertical:9/,
  'Even small shared buttons need a touch target');
assert.doesNotMatch(app,/multiline&&\{height:95/,
  'Multiline input should grow with enlarged text');

assert.match(home,/AccessibilityInfo\.announceForAccessibility/,
  'Users should be notified when the AI reply arrives');
assert.match(home,/accessibilityRole="header"/,'AI home needs a semantic heading');
assert.match(home,/accessibilityLiveRegion="assertive"/,
  'AI errors must be announced');
assert.match(home,/singleColumn=screenWidth<360\|\|fontScale>=1\.5/,
  'Home navigation must reflow at large font sizes');
assert.match(home,/scrollTo\(\{y:0,animated:false\}\)/,
  'Suggestions should not force animation');

assert.match(map,/accessible=\{false\} importantForAccessibility="no-hide-descendants"/,
  'Visual map should not trap screenreader focus');
assert.match(map,/Ort ohne Kartenberührung markieren/,
  'Place creation needs a non-touch alternative');
assert.match(map,/function markCoordinates\(\)/,
  'Keyboard coordinates must be actionable');
assert.match(map,/inGermany\(latitude,longitude\)/,
  'Accessible coordinates must be validated');
assert.match(map,/accessibilityLabel="Wickeltisch vorhanden"/,
  'Map switches require names');
assert.doesNotMatch(map,/multi&&\{height:85/,
  'Map multiline fields should grow with text');

assert.match(guide,/accessibilityRole="header"/,
  'Guide should expose headings');
assert.match(help,/accessibilityLiveRegion="polite"/,
  'FAQ result count should be announced');
console.log('Barrierefreiheit: kritische Funktions- und UI-Verträge geprüft. Geräteprüfung bleibt erforderlich.');
