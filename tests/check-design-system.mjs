import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('FamilyTheme.js');
const {FAMILY_COLORS:C}=await import(
  'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
);
const luminance=hex=>{
  const rgb=hex.slice(1).match(/../g).map(part=>parseInt(part,16)/255)
    .map(x=>x<=0.04045?x/12.92:Math.pow((x+0.055)/1.055,2.4));
  return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
};
const contrast=(a,b)=>{
  const [high,low]=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (high+0.05)/(low+0.05);
};
for(const [foreground,background] of [
  [C.ink,C.bg], [C.muted,C.bg], [C.ink,C.sun],
  [C.white,C.accent], [C.accentDark,C.pale], [C.ink,C.sunPale]
]){
  assert.ok(contrast(foreground,background)>=4.5,
    'Insufficient text contrast for '+foreground+' / '+background);
}
for(const file of [
  'App.jsx','HomeAssistant.jsx','FamilyGuide.jsx','FamilyMap.jsx',
  'AboutAndHelp.jsx','WelcomeIntro.jsx'
]){
  assert.match(read(file),/import \{FAMILY_COLORS\} from '\.\/FamilyTheme';/,
    file+' must use the common visual language');
}
const app=read('App.jsx')+'\n'+read('FamilyAppStyles.js');
assert.match(app,/const C = FAMILY_COLORS;/,'Main app palette must be centralized');
assert.match(app,/headingBar:\{width:5/,'Section heading should have a consistent sun accent');
assert.match(app,/tabActive:\{backgroundColor:C\.sunPale\}/,'Bottom navigation uses sunny selected state');
assert.match(app,/styles\.tabIcon,\(tab===id\)/,'Primary bottom navigation shows selected screen');
assert.match(app,/styles\.tabLabel,\(tab===id\)/,'Primary bottom navigation label reflects selection');
assert.match(app,/chipSelected:\{backgroundColor:C\.accentDark/,'Selection should not rely on coral as primary');
const menu=read('TopRightMenu.jsx');
assert.match(menu,/import \{FAMILY_COLORS as C\} from '\.\/FamilyTheme'/);
assert.match(menu,/selected:\{backgroundColor:C\.sunPale\}/);
assert.match(app,/accessibilityLabel="Menü öffnen"/);
assert.match(app,/headerMenuButton:\{minWidth:44,minHeight:44/);
assert.match(menu,/accessibilityViewIsModal/);
assert.match(menu,/onRequestClose=\{onClose\}/);
assert.match(menu,/accessibilityLabel="Menü schließen"/);
assert.match(menu,/ScrollView/);
assert.match(menu,/\['profile','◉','Mein Profil'/);
for(const id of ['contacts','chat','inbox','push','events','outing','partners','inclusion','info','help','aboutApp','welcome','refresh','more']){
 assert.ok(menu.includes("['"+id+"',"),'Menu missing '+id);
}
assert.doesNotMatch(app.match(/const TABS = .*;/)[0],/\['more',/,'Move More up to the menu');
assert.match(app,/onSelect=\{selectMenuItem\}/);
assert.match(app,/const items=MORE_ITEMS/);
assert.match(app,/setTab\('home'\);\s*setMenuOpen\(false\)/,'Account switch closes menu');
assert.match(read('HomeAssistant.jsx'),/const C=FAMILY_COLORS;/,'Home keeps shared palette');
assert.match(read('FamilyMap.jsx'),/hero:\{backgroundColor:C\.sun/,'Family map uses sunshine intro');
assert.match(read('AboutAndHelp.jsx'),/hero:\{backgroundColor:C\.sun/,'About page uses sunshine intro');
console.log('Familienfunke design system: palette, contrast and UI integration verified.');
