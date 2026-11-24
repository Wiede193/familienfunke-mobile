// Einheitliche, rein lokale Entwürfe. Ein Muster ist kein echtes Angebot.
// Platzhalter müssen vor der Einreichung ersetzt werden.
export const DRAFT_PLACEHOLDER='[ergänzen]';
export const MARKET_DRAFT_TEMPLATES=[
 {id:'clothes',label:'Kleidung',category:'Kleidung',
  description:'Artikelart: [ergänzen]\nMarke/Größe: [ergänzen]\nFarbe/Material: [ergänzen]\nZustand und bekannte Mängel: [ergänzen]\nLieferumfang: [ergänzen]\nÜbergabe: [ergänzen]'},
 {id:'toy',label:'Spielzeug',category:'Spielzeug',
  description:'Spielzeugart/Modell: [ergänzen]\nAltersempfehlung laut Hersteller: [ergänzen]\nVollständigkeit/Zubehör: [ergänzen]\nZustand und Mängel: [ergänzen]\nÜbergabe: [ergänzen]'},
 {id:'equipment',label:'Babyausstattung',category:'Babyausstattung',
  description:'Produkt/Modell: [ergänzen]\nMarke/Größe: [ergänzen]\nHerstellungsjahr, soweit bekannt: [ergänzen]\nZustand, Mängel und Sicherheitshinweise: [ergänzen]\nLieferumfang: [ergänzen]\nÜbergabe: [ergänzen]'}
];
export const EVENT_DRAFT_TEMPLATES=[
 {id:'playground',label:'Spielplatztreffen',
  description:'Für wen (Alter der Kinder): [ergänzen]\nÖffentlicher Treffpunkt: [ergänzen]\nGeplantes Programm: [ergänzen]\nMitbringen: [ergänzen]\nKosten: [ergänzen]\nBarrierefreiheit, soweit bekannt: [ergänzen]\nBei Regen: [ergänzen]'},
 {id:'family_walk',label:'Familienspaziergang',
  description:'Altersgruppe: [ergänzen]\nStart und Wegstrecke: [ergänzen]\nDauer und Pausen: [ergänzen]\nKinderwagen- / Rollstuhleignung (nur geprüft): [ergänzen]\nMitbringen: [ergänzen]\nKosten: [ergänzen]\nSchlechtwetterplan: [ergänzen]'},
 {id:'swap_meet',label:'Kinderflohmarkt',
  description:'Für wen: [ergänzen]\nÖffentlicher Veranstaltungsort: [ergänzen]\nWas wird angeboten: [ergänzen]\nTeilnahme/Anmeldung: [ergänzen]\nGebühren oder Eintritt: [ergänzen]\nBarrierefreiheit, soweit bekannt: [ergänzen]\nKontakt über Familienfunke: [ergänzen]'}
];
export const MESSAGE_DRAFT_TEMPLATES=[
 {id:'hello',label:'Kennenlernen',body:'Hallo! Wir haben gesehen, dass wir uns für [Interesse ergänzen] interessieren. Hättet ihr Lust, euch über Familienfunke näher kennenzulernen? Viele Grüße!'},
 {id:'outing',label:'Gemeinsam etwas unternehmen',body:'Hallo! Wir würden gern gemeinsam etwas unternehmen. Uns schwebt [Aktivität ergänzen] in [grobe Region ergänzen] vor. Habt ihr Interesse? Einen öffentlichen Treffpunkt können wir gemeinsam abstimmen.'},
 {id:'market',label:'Frage zu einem Angebot',body:'Hallo! Ich interessiere mich für [Artikel ergänzen]. Ist er noch verfügbar? Könntet ihr mir bitte etwas zu Zustand und Übergabe sagen? Viele Grüße!'}
];
// Formulare dürfen niemals sichtbare Musterangaben als echte Fakten veröffentlichen.
// Freie Nachrichten bleiben ausdrücklich editierbare Vorschläge; es wird nichts automatisch versendet.
export function hasTemplatePlaceholders(text){
 return /\[(?:[^\]]*ergänzen|[^\]]*eintragen)\]/i.test(String(text||''));
}
export function applyMarketDraft(template){
 if(!MARKET_DRAFT_TEMPLATES.some(x=>x.id===template?.id))return null;
 return {title:'',category:template.category,description:template.description};
}
export function applyEventDraft(template){
 if(!EVENT_DRAFT_TEMPLATES.some(x=>x.id===template?.id))return null;
 return {title:'',region:'',date:'',description:template.description};
}
