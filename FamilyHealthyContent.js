// Curated official entry points. Public access is not a reuse license.
export const HEALTH_CATEGORIES=[
 {id:'all',title:'Alle'},{id:'clubs',title:'Sportvereine'},
 {id:'activity',title:'Bewegung'},{id:'food',title:'Ernährung'},
 {id:'videos',title:'Videos'},{id:'routes',title:'Rad & Wandern'}
];
export const HEALTH_RESOURCES=[
 {id:'lsb',category:'clubs',title:'Sportvereine in Brandenburg finden',region:'Brandenburg',source:'Landessportbund Brandenburg',url:'https://lsb-brandenburg.de/mitglieder/sportvereine/',description:'Vereinssuche nach Sportart und Ort. Kurse, Altersgruppen und Kosten direkt beim Verein erfragen.',keywords:'vereine sportverein sportarten fussball schwimmen kinderturnen'},
 {id:'ksb-os',category:'clubs',title:'Kreissportbund Oder-Spree',region:'Oder-Spree',source:'Kreissportbund Oder-Spree',url:'https://www.ksb-os.de/',description:'Regionale Anlaufstelle für Kinder- und Jugendsport und Sportvereine.',keywords:'verein sport landkreis fürstenwalde beeskow erkner'},
 {id:'ssb-ffo',category:'clubs',title:'Sportangebote in Frankfurt (Oder)',region:'Frankfurt (Oder)',source:'Stadt Frankfurt (Oder)',url:'https://www.frankfurt-oder.de/Angebote-Beteiligungen/Angebote/Sport/Sportarten-und-Vereine/',description:'Offizielle Übersicht zu lokalen Sportarten und Vereinen.',keywords:'sport sportverein sportangebote frankfurt oder'},
 {id:'sport-inklusion',category:'clubs',title:'Inklusiven Sport und Rehasport finden',region:'Brandenburg',source:'Behinderten- und Rehabilitationssportverband Brandenburg',url:'https://www.bsbrandenburg.de/vereinssuche/',description:'Vereinssuche für Menschen mit Behinderungen. Eignung und Barrierefreiheit beim Anbieter prüfen.',keywords:'inklusion behinderung behindertensport rehasport barrierefreiheit'},
 {id:'in-form',category:'food',title:'Familien: Gesund essen, trinken und bewegen',region:'Deutschland',source:'IN FORM',url:'https://www.in-form.de/service/medienpakete/familie-alles-rund-ums-essen-trinken-und-bewegen',description:'Kostenlos zugängliche Broschüren, Erklärungen und Medien für Familien.',keywords:'ernährung gesund essen kochen rezepte bewegung obst gemüse'},
 {id:'bewegung',category:'activity',title:'Bewegung und Sport im Familienalltag',region:'Deutschland',source:'IN FORM',url:'https://www.in-form.de/service/broschueren/familien-und-berufstaetige/bewegung-und-sport-elterninfo',description:'Alltagstipps für mehr Bewegung mit Kindern.',keywords:'fitness bewegung sport sportspiele kinder eltern'},
 {id:'bmg',category:'activity',title:'Bewegungsförderung und Gesundheit',region:'Deutschland',source:'Bundesgesundheitsministerium',url:'https://www.bundesgesundheitsministerium.de/themen/praevention/bewegungsfoerderung',description:'Fachinformationen zu Bewegung für Kinder und Erwachsene.',keywords:'bewegung fitness gesund sport'},
 {id:'ernaehrung-kinder',category:'food',title:'Gesunde Ernährung von Kindern',region:'Deutschland',source:'gesund.bund.de',url:'https://gesund.bund.de/wege-im-gesundheitswesen/kindheit/gesund-aufwachsen/ernaehrung',description:'Einstieg zu Ernährung im Kindesalter mit weiterführenden Quellen.',keywords:'ernährung kinder essen lebensmittel'},
 {id:'videos-bzfe',category:'videos',title:'Offizielle Ernährungsvideos',region:'Deutschland',source:'Bundeszentrum für Ernährung',url:'https://www.bzfe.de/schule-und-kita/material-fuer-die-schule/videos',description:'Videos zu Ernährung, Küchenpraxis und Lebensmittelwissen.',keywords:'video kochen ernährung küche lernen'},
 {id:'videos-inform',category:'videos',title:'Familienvideos: Ernährung und Bewegung',region:'Deutschland',source:'IN FORM',url:'https://www.in-form.de/service/medienpakete/familie-alles-rund-ums-essen-trinken-und-bewegen',description:'Kostenlos auf der Anbieterwebsite abrufbare Familienmedien.',keywords:'video bewegung sport gesunde ernährung'},
 {id:'touren',category:'routes',title:'Touren-Datenbank Brandenburg',region:'Brandenburg',source:'Tourismus-Marketing Brandenburg',url:'https://tourismusnetzwerk-brandenburg.de/service/datenbanken/touren-datenbank',description:'Offiziell gepflegter Tourenkatalog für Rad- und Wanderwege; Track-Nutzung nur mit passender Lizenz.',keywords:'radwege wanderwege wandern radtour gpx radfahren'},
 {id:'routenplaner',category:'routes',title:'Rad-Routenplaner Brandenburgische Seenplatte',region:'Brandenburg',source:'Tourismusnetzwerk Brandenburg',url:'https://tourismusnetzwerk-brandenburg.de/themen/tourismusarten/radtourismus/neu-online-routenplaner-fuer-die-brandenburgische-seenplatte',description:'Externe Routenplanung mit GPX-Export nach Anbieterbedingungen.',keywords:'radweg radfahren fahrradroute routenplaner gpx radtour'}
];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ');
export function findHealthyResources(query,limit=12){
 const terms=norm(query).trim().split(/\s+/).filter(w=>w.length>2&&!['und','die','ich','der','mit','nach','suche','finden','fuer','gibt','welche'].includes(w));
 if(!terms.length)return HEALTH_RESOURCES.slice(0,limit);
 return HEALTH_RESOURCES.map((r,i)=>({r,i,score:terms.reduce((sum,w)=>sum+(norm(r.title+' '+r.region).includes(w)?4:norm(r.description+' '+r.keywords+' '+r.source).includes(w)?2:0),0)}))
 .filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,limit).map(x=>x.r);
}
