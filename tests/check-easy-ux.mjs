import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const interestModule=await import('data:text/javascript;base64,'+Buffer.from(read('FamilyInterests.js')).toString('base64'));
const {FAMILY_INTERESTS,FAMILY_INTEREST_GROUPS,MAX_PROFILE_INTERESTS,
 addFamilyInterest,removeFamilyInterest,filterFamilyInterests}=interestModule;
assert.ok(FAMILY_INTEREST_GROUPS.length>=5,'Interests need clear categories');
assert.ok(FAMILY_INTERESTS.length>=70,'Hobby choices must substantially exceed the old list');
assert.equal(new Set(FAMILY_INTERESTS).size,FAMILY_INTERESTS.length,'No duplicate hobby suggestions');
assert.equal(MAX_PROFILE_INTERESTS,24,'Profile cap must match database constraint');
assert.ok(filterFamilyInterests('töpfern').includes('Töpfern'),'Hobbies must be searchable');
assert.deepEqual(addFamilyInterest(['Yoga'],'yoga'),['Yoga'],'Do not add duplicates with different case');
assert.deepEqual(removeFamilyInterest(['Yoga','Reiten'],'Yoga'),['Reiten']);
assert.equal(addFamilyInterest(Array(24).fill('Natur'),'Tanzen').length,24,'Respect profile limit');
assert.deepEqual(addFamilyInterest(['Natur'],'https://example.com'),['Natur'],'Block links in free interests');
const app=read('App.jsx'),home=read('HomeAssistant.jsx'),menu=read('TopRightMenu.jsx');
assert.match(app,/interests:\(form\.interests\|\|\[\]\)\.slice\(0,MAX_PROFILE_INTERESTS\)/);
assert.match(app,/FAMILY_INTEREST_GROUPS\.filter/);
assert.match(app,/filterFamilyInterests\(interestQuery,group\.items\)/);
assert.match(app,/addCustomInterest/);
assert.match(app,/interestFilterQuery/);
assert.match(app,/headerMenuLabel/);
assert.match(home,/function submitSearch\(\)/);
assert.match(home,/looksLikeKnowledgeQuestion\(needle\)/);
assert.match(home,/onSubmitEditing=\{submitSearch\}/);
assert.match(home,/Direkt gefunden/);
assert.match(home,/visibleReplies\.map/);
assert.doesNotMatch(home,/Antwort finden'<\/Text>/,'Search should not require choosing between two large buttons');
assert.match(menu,/const \[expanded,setExpanded\]=useState\(null\)/);
const shortcuts=menu.slice(menu.indexOf('const QUICK_ITEMS='),menu.indexOf('const SEARCH_ICONS='));
for(const id of ['discover','map','market','guide'])
 assert.match(shortcuts,new RegExp("\\['"+id+"'"),'Main destination must be a top shortcut');
assert.ok(!shortcuts.includes("['sell'"),'Advanced actions should not dominate the menu');
// Regression from the real 150%-font screenshot: the column must stretch
// across the available width; an instant result must never use a half-width tile.
assert.match(home,/singleColumn&&s\.featuredSingle/);
assert.match(home,/featuredSingle:\{flexDirection:'column',flexWrap:'nowrap',alignItems:'stretch'/);
assert.match(home,/areaRow:\{\.\.\.UI\.card,width:'100%'/);
assert.match(home,/matches\[0\]\?<AreaCard route=\{matches\[0\]\} onNavigate=\{onNavigate\} query=\{needle\}\/>/);
assert.match(app,/flexWrap:'wrap',rowGap:2,marginBottom:6/);
console.log('Simplified menu, direct search and expanded interests verified.');
