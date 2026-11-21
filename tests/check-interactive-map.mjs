import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../FamilyMap.jsx',import.meta.url),'utf8');
const htmlDecl=source.slice(source.indexOf('const MAP_HTML=['),source.indexOf('\n\nfunction Chip('));
assert.ok(htmlDecl.startsWith('const MAP_HTML=['),'Map HTML must remain available');
const html=vm.runInNewContext(htmlDecl+'\nMAP_HTML;');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'MapLibre script must be embedded');
const executable=script.replace(/import \* as ml from "https:\/\/[^"]+";/,
  'const ml={};');
assert.doesNotThrow(()=>new vm.Script(executable),'MapLibre HTML-JS must parse');
assert.match(html,/className="search-pin"/,'Search markers must have a visible map element');
assert.match(html,/search-dot/,'Search markers must be numbered and clearly styled');
assert.match(html,/\.search-pin\.selected/,'Selected marker must be visibly distinct');
assert.match(html,/send\(\{type:"searchPin",id:p\.id\}\)/,
  'A map marker tap must reach the React Native selection handler');
assert.match(html,/setSearchResults:function/,'Typing must update pins');
assert.match(html,/setSearchSelection:function/,'Selected search pin should be highlighted');
assert.match(html,/fitSearchResults:function/,'Map must pan and zoom to all results');
assert.match(html,/map\.fitBounds\(/,'Multiple results need an appropriate map viewport');
assert.match(html,/textContent=String\(p\.title/,
  'Untrusted place titles must use textContent, not innerHTML');
assert.doesNotMatch(html,/innerHTML/,'Never render user-supplied location labels as HTML');

assert.match(source,/useEffect\(\(\)=>\{\s*if\(!ready\)return;\s*const active=placeQuery\.trim\(\)\.length>=2/,
  'Map pins must update when search is active');
assert.match(source,/mapScript\('setSearchResults',\{/,
  'Search results must be sent to MapLibre');
assert.match(source,/locationMatches\.map\(\(\{id,title,latitude,longitude\}\)/,
  'Only validated searchable pin properties should be sent to WebView');
assert.match(source,/value\.type==='searchPin'/,
  'Search marker taps must route into native state');
assert.match(source,/locationMatches\.find\(x=>x\.id===value\.id\)/,
  'Native app must validate WebView marker selection against current search matches');
assert.match(source,/setSelectedSearchId\(match\.id\)/,
  'List and map pins must share selection state');
assert.match(source,/accessibilityState=\{\{selected:selectedSearchId===match\.id\}\}/,
  'Accessible result list must announce selected entry');
assert.match(source,/styles\.searchResultSelected/,'Selected list entry must be visually highlighted');
assert.match(source,/styles\.mapSelectedInfo/,'Selected location must display readable information');
assert.match(source,/scroll\.current\?\.scrollTo/,
  'Selecting a result must reveal the actual map');
assert.match(source,/selectedSearchMatch\.source==='city'\?/, 'City search should offer nearby place loading');
assert.match(source,/onPress=\{\(\)=>map\.current\?\.injectJavaScript\(mapScript\('fitSearchResults'\)\)\}/,
  'Users should be able to refocus map on matches');
assert.match(source,/accessible=\{false\} importantForAccessibility="no-hide-descendants"/,
  'Screenreader list must remain the map navigation alternative');
assert.ok(source.indexOf('<View style={styles.mapFrame} onLayout=')>=0&&
 source.indexOf('<View style={styles.mapFrame} onLayout=')<source.indexOf('locationMatches.map(match=>'),
 'Map should appear immediately after the search field, before search results');
console.log('Interaktive Karte: Pins, Suchergebnis-Auswahl, Kartenausschnitt und Barrierefreiheit geprüft.');
