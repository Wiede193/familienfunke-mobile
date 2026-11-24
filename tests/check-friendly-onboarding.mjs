import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const file=read('FamilyDraftTemplates.js');
const {
 MARKET_DRAFT_TEMPLATES,EVENT_DRAFT_TEMPLATES,MESSAGE_DRAFT_TEMPLATES,
 hasTemplatePlaceholders,applyMarketDraft,applyEventDraft
}=await import('data:text/javascript;base64,'+Buffer.from(file).toString('base64'));
assert.equal(MARKET_DRAFT_TEMPLATES.length,3);
assert.equal(EVENT_DRAFT_TEMPLATES.length,3);
assert.equal(MESSAGE_DRAFT_TEMPLATES.length,3);
for(const a of [MARKET_DRAFT_TEMPLATES,EVENT_DRAFT_TEMPLATES,MESSAGE_DRAFT_TEMPLATES]){
 assert.equal(new Set(a.map(x=>x.id)).size,a.length);
 assert.ok(a.every(x=>x.label&&x.id));
}
for(const t of MARKET_DRAFT_TEMPLATES){
 const d=applyMarketDraft(t);
 assert.equal(d.title,'');
 assert.equal(d.category,t.category);
 assert.ok(hasTemplatePlaceholders(d.description));
 assert.ok(/Zustand/i.test(d.description));
}
for(const t of EVENT_DRAFT_TEMPLATES){
 const d=applyEventDraft(t);
 assert.equal(d.title,'');
 assert.equal(d.date,'');
 assert.equal(d.region,'');
 assert.ok(hasTemplatePlaceholders(d.description));
 assert.ok(/Kosten/i.test(d.description));
 assert.ok(/Barrierefreiheit|Rollstuhl/i.test(d.description));
}
assert.equal(applyMarketDraft({id:'malicious'}),null);
assert.equal(applyEventDraft({id:'malicious'}),null);
assert.equal(hasTemplatePlaceholders('Alles geprüft, Zustand: gut'),false);
assert.equal(hasTemplatePlaceholders('Größe: [ergänzen]'),true);
assert.ok(MESSAGE_DRAFT_TEMPLATES.every(x=>hasTemplatePlaceholders(x.body)));
const app=read('App.jsx'),home=read('HomeAssistant.jsx'),motion=read('FamilyMotion.jsx');
const intro=read('WelcomeIntro.jsx'),picker=read('DraftTemplatePicker.jsx'),menu=read('TopRightMenu.jsx');
assert.match(app,/SparkleIntro onFinish=\{finishLoginSpark\}/);
assert.match(app,/familienfunke\.login-spark\.v1/);
assert.match(app,/familienfunke\.app-tour\.v1\./);
assert.match(app,/FamilyAppTour visible=/);
assert.match(app,/SoftTabIcon name=\{glyph\}/);
assert.match(menu,/\['tour','➤','App-Tour'/);
assert.match(intro,/GentleReveal active=\{visible\}/);
assert.match(motion,/isReduceMotionEnabled/);
assert.match(motion,/reduceMotionChanged/);
assert.match(motion,/Überspringen/);
assert.match(motion,/export const APP_TOUR_STEPS=TOUR/);
assert.match(motion,/length-1\?onClose/);
assert.match(motion,/TOUR\.map/);
assert.match(home,/GentleReveal distance=\{24\}/);
assert.match(home,/answerOffset\.current/);
assert.match(home,/Deine Antworten/);
assert.match(home,/answerCardNewest/);
assert.match(home,/accessibilityRole="header" style=\{s\.assistantLabel\}/);
assert.match(home,/Wissenssuche erklären/);
assert.match(home,/inputRange:\[0,200\]/);
assert.match(app,/title="Anzeige mit Steckbrief-Vorlage erstellen"/);
assert.match(app,/title="Treffen mit Vorlage planen"/);
assert.match(app,/title="Nachricht als Entwurf vorbereiten"/);
assert.match(app,/hasTemplatePlaceholders\(title\)\|\|hasTemplatePlaceholders\(description\)/);
assert.match(app,/disabled=\{disabled\|\|!text\.trim\(\)\|\|hasTemplatePlaceholders\(text\)\}/);
assert.match(picker,/\[ergänzen\] muss vor dem Absenden ersetzt werden/);
assert.doesNotMatch(motion,/react-native-reanimated|lottie|react-native-svg/);
console.log('Sanfte Animationen, App-Tour, mobile Lesbarkeit und sichere Vorlage-Sperren geprüft.');
