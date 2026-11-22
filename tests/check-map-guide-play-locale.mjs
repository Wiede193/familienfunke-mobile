import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const load=path=>import('data:text/javascript;base64,'+Buffer.from(read(path)).toString('base64'));
const {translate}=await load('FamilyLocaleModel.js');
const t=key=>translate('en',key);
for(const [de,en] of [
 ['Familienkarte ♡','Family map ♡'],
 ['Stadt oder Ausflugsziel suchen','Search for a town or destination'],
 ['Familien-Wegweiser','Family guide'],
 ['Offen','Open'],['Erledigt','Completed'],
 ['Wörterrätsel','Word puzzle (German)'],
 ['Kreuzworträtsel','Crossword (German)'],
 ['Vier gewinnt','Connect four'],
 ['Dame','Checkers']
])assert.equal(t(de),en,de);
const map=read('FamilyMap.jsx'),guide=read('FamilyGuide.jsx');
assert.match(map,/const \{t,language\}=useFamilyLocale\(\)/);
assert.match(map,/findFamilyMapLocations\(placeQuery/);
assert.match(map,/inGermany\(p\.latitude,p\.longitude\)/);
assert.match(map,/accessibilityLabel=\{t\("Stadt oder Ausflugsziel suchen"\)\}/);
assert.match(map,/Originalbeschreibungen derzeit auf Deutsch/);
assert.match(map,/selected\.description\|\|t\('Keine Beschreibung hinterlegt\.'\)/);
assert.match(map,/TYPES\.filter\(t=>t\[0\]!=='all'\)/);
assert.match(guide,/const \{t,language\}=useFamilyLocale\(\)/);
assert.match(guide,/clampStatus\(value\)/);
assert.match(guide,/AsyncStorage\.setItem\(storageKey,JSON\.stringify\(statuses\)\)/);
assert.match(guide,/Fachinhalte derzeit auf Deutsch/);
assert.match(guide,/activeStep\.intro/);
assert.match(guide,/activeStep\.when/);
assert.match(guide,/activeStep\.documents/);
const mini=read('FamilyMiniGameScreens.jsx');
const helper=mini.slice(mini.indexOf('function localPatternExplanation'),mini.indexOf('const GLYPHS'));
const explain=new Function(helper+';return localPatternExplanation;')();
assert.equal(explain('Jedes Mal kommen 3 dazu.','en'),'3 is added each time.');
assert.equal(explain('Jede Zahl wird mit 2 multipliziert.','en'),'Each number is multiplied by 2.');
assert.equal(explain('Die Zahlen wachsen immer um 7.','en'),'The numbers increase by 7 each time.');
assert.equal(explain('Jedes Mal kommen 3 dazu.','de'),'Jedes Mal kommen 3 dazu.');
const play=read('FamilyPlayScreen.jsx');
assert.match(play,/ENGLISH_QUESTIONS/);
assert.match(play,/language==='en'\?makeEnglishRound/);
assert.match(play,/\{t\(title\)\}<\/Text><Text style=\{s\.text\}>\{t\(description\)\}/);
const classics=read('FamilyClassicGameScreens.jsx'),board=read('FamilyBoardPuzzleScreens.jsx');
assert.match(classics,/language==='en'\?ENGLISH_WORDS:undefined/);
assert.match(board,/language==='en'\?ENGLISH_CROSSWORDS:CROSSWORDS/);
for(const p of ['FamilyMiniGameScreens.jsx','FamilyClassicGameScreens.jsx','FamilyBoardPuzzleScreens.jsx'])
 assert.doesNotMatch(read(p),/\b(?:supabase|AsyncStorage|fetch)\s*\(/);
console.log('Map, guide, English game content, pattern math and German-only warnings checked');
