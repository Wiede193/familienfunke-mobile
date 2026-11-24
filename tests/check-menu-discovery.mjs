import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const menu=read('TopRightMenu.jsx'),app=read('App.jsx'),help=read('AboutAndHelp.jsx'),home=read('HomeAssistant.jsx');
const logic=read('MenuDiscovery.js');
const {searchMenuEntries,normalizeMenuText}=await import('data:text/javascript;base64,'+Buffer.from(logic).toString('base64'));
const start=menu.indexOf('export const MENU_GROUPS='),end=menu.indexOf('export const MORE_ITEMS=',start);
assert.ok(start>=0&&end>start,'Missing menu groups for navigation search');
const definition=menu.slice(start,end).replace('export const MENU_GROUPS=','const MENU_GROUPS=');
const groups=new Function(definition+'\nreturn MENU_GROUPS;')();
assert.equal(new Set(groups.flatMap(g=>g.items.map(item=>item[0]))).size,
 groups.flatMap(g=>g.items).length,'Menu destinations must be unique');
assert.equal(normalizeMenuText('Änderungen & Größe'),'anderungen grosse');
for(const [question,id] of [
  ['Basar','market'],
  ['Anzeige erstellen','sell'],
  ['Kleidung verkaufen','sell'],
  ['Meine Anzeigen','myListings'],
  ['Wo kann ich meine Anzeigen sehen?','myListings'],
  ['Merkliste','favorites'],
  ['Passwort','profile'],
  ['Passwort ändern','profile'],
  ['Kita','partners'],
  ['Schwimmbad','map'],
  ['Elterngeld','guide'],
  ['Nachrichten','chat'],
  ['Familien in meiner Nähe','discover'],
  ['Treffen & Veranstaltungen','events'],
  ['Hilfe','help']
 ]){
 const hits=searchMenuEntries(question,groups);
 assert.equal(hits[0]?.id,id,question+' should directly open '+id+', got: '+hits.map(h=>h.id).join(', '));
}
assert.deepEqual(searchMenuEntries('',groups),[]);
assert.deepEqual(searchMenuEntries('qzxwyv',groups),[]);
assert.match(menu,/accessibilityLabel="Funktion im Menü suchen"/);
assert.match(menu,/accessibilityLiveRegion="polite"/);
assert.match(menu,/searchMenuEntries\(search,MENU_GROUPS\)/);
assert.match(menu,/id==='inbox'/);
for(const shortcut of ['market','sell','myListings','chat','profile','inbox'])
 assert.ok(menu.includes("['"+shortcut+"'"),'Menu shortcut missing '+shortcut);
assert.match(menu,/\['favorites','♡','Merkliste'/);
assert.match(app,/const canOpen=tabIds\.includes\(id\)/,'Bottom tabs must route from menu');
assert.match(app,/id==='myListings'\?\{type:'myListings'\}/);
assert.match(app,/id==='favorites'\?\{type:'favorites'\}/);
assert.match(app,/entryIntent\?\.type!=='myListings'/);
assert.match(app,/entryIntent\?\.type!=='favorites'/);
assert.match(app,/marketLeaveRef\.current\(next\)/,'Forms need safe exit guards');
assert.match(app,/saveBoxSnapshot\(me,boxSnapshot\(\)\)/,'Box drafts need guaranteed local persistence on leave');
assert.match(app,/if\(selectedContact&&chatDraftDirty\)/,'Unsent message drafts must trigger a departure warning');
assert.match(app,/if\(tab==='events'&&eventDraftDirty\)/,'Partially filled event forms need a departure warning');
assert.match(app,/onDraftChange=\{setChatDraftDirty\}/);
assert.match(app,/onDraftChange=\{setEventDraftDirty\}/);
assert.match(app,/setMenuOpen\(false\)/);
assert.match(home,/onNavigate\('myListings'\)/);
assert.match(home,/\{id:'chat',icon:'message',title:'Nachrichten'/);
assert.match(help,/Wie melde ich ein problematisches Angebot/);
assert.match(help,/Warum ist meine Anzeige noch nicht sichtbar/);
assert.match(help,/faqDestination\(c,q\)/);
assert.match(help,/onNavigate\(destination\[0\]\)/);
assert.match(app,/tab==='help'\?<TechnicalHelpScreen onNavigate=\{selectMenuItem\}/);
assert.doesNotMatch(help,/Nach dem Speichern wird alles erneut geprüft/,'FAQ must not incorrectly describe manual review');
assert.doesNotMatch(help,/kannst du freiwillig bis zu drei verkleinerte Bilder durch KI auswerten lassen/,'FAQ must not promise disabled photo-AI');
console.log('Menu search, routes, FAQs, shortcuts, and draft preservation verified.');
