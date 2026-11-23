import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FAMILY_COLORS} from './FamilyTheme';
import {VERIFIED_GUIDE_DETAILS, ODER_SPREE_GUIDE} from './FamilyGuideVerified';
import {BRANDENBURG_REGIONS,BRANDENBURG_FAMILY_RESOURCES,
  guessBrandenburgRegion,findBrandenburgRegions,officeForGuideStep,REGIONAL_DIRECTORY_URL} from './BrandenburgFamilyRegions';
import {GERMANY_FAMILY_STATES,GERMANY_FAMILY_RESOURCES,findGermanyFamilyStates} from './GermanyFamilyDirectory';
import FamilyTopicsSection from './FamilyTopicsSection';

const P=FAMILY_COLORS;
const TYPES={
  recommended:{label:'Empfohlener Zeitpunkt',short:'Empfohlen',color:'#087F87',bg:'#E4F5F1'},
  voluntary:{label:'Freiwillig – keine Pflicht',short:'Freiwillig',color:'#785518',bg:'#FFF1D6'},
  individual:{label:'Individuell abhängig',short:'Abhängig',color:'#765791',bg:'#F2EEFF'},
};
const STATUSES=[
  {id:'open',name:'Offen'},
  {id:'started',name:'Begonnen'},
  {id:'done',name:'Erledigt'},
  {id:'not_relevant',name:'Nicht relevant'},
];
const LINKS={
  familienportal:{label:'Familienportal des Bundes',url:'https://familienportal.de/'},
  kindergeld:{label:'Bundesagentur für Arbeit – Familien und Kinder',url:'https://www.arbeitsagentur.de/familie-und-kinder'},
  gesund:{label:'Gesundheitsportal des Bundes',url:'https://gesund.bund.de/'},
  bildung:{label:'Deutscher Bildungsserver',url:'https://www.bildungsserver.de/'},
};
const PHASES=[
  {
    id:'pregnancy',symbol:'♡',name:'Schwangerschaft',period:'Der Anfang',description:'Orientierung, Vorsorge und erste freiwillige Vorbereitungen.',
    steps:[
      {id:'confirm',title:'Ersten Vorsorgetermin vereinbaren',kind:'recommended',intro:'Schwangerschaft ärztlich bestätigen lassen und die weitere Betreuung besprechen.',when:'Zeitnah nach Feststellung der Schwangerschaft – ein empfohlener Zeitpunkt, keine hier genannte gesetzliche Frist.',where:'Frauenarztpraxis oder Hebamme.',documents:'Krankenversicherungskarte; soweit vorhanden Medikamentenliste und relevante medizinische Angaben. Das Datum der letzten Periode kann hilfreich sein.',depends:'Art der Betreuung und persönliche Situation.',next:'Vorsorge planen und weitere Betreuungsmöglichkeiten besprechen.',link:'gesund'},
      {id:'midwife',title:'Hebamme suchen',kind:'voluntary',intro:'Eine Hebamme kann während der Schwangerschaft und im Wochenbett begleiten.',when:'Eine frühe Suche kann sinnvoll sein, weil Kapazitäten begrenzt sind. Es gibt keine Pflicht, eine Hebamme zu suchen.',where:'Hebammen in der Region, Hebammenverzeichnisse und die Krankenkasse.',documents:'Bei der Anfrage meist Wohnort/PLZ, voraussichtlicher Geburtstermin und gewünschte Betreuungsart.',depends:'Verfügbarkeit, Versicherungsstatus und gewünschte Leistungen; Zusatzleistungen können Kosten verursachen.',next:'Bei fehlender Rückmeldung freiwillig eine erneute Anfrage oder Erinnerung setzen.',link:'familienportal'},
      {id:'insurance_early',title:'Leistungen der Krankenkasse klären',kind:'recommended',intro:'Fragen zu Vorsorge, Hebammenhilfe, Mutterschaftsgeld und der späteren Versicherung des Kindes sammeln.',when:'Frühzeitig sinnvoll. Keine allgemeine Pflicht, die Schwangerschaft sofort der Krankenkasse zu melden.',where:'Eigene gesetzliche oder private Krankenversicherung.',documents:'Versicherungsdaten und konkrete Fragen zu Leistungen oder Tarifen.',depends:'Gesetzlich oder privat versichert; später können Versicherungsstatus des anderen Elternteils und Familienstand relevant sein.',next:'Kosten und Leistungsansprüche schriftlich bestätigen lassen.',link:'familienportal'},
      {id:'employer_early',title:'Arbeitgeber und Mutterschutz klären',kind:'individual',intro:'Rechte, Schutzmaßnahmen und passende Zeitpunkte für ein Gespräch überlegen.',when:'Bei Beschäftigten keine allgemeine Pflicht zur sofortigen Mitteilung. Eine frühere Information kann notwendige Schutzmaßnahmen ermöglichen.',where:'Arbeitgeber oder Personalstelle, bei Fragen zuständige Beratungsstellen.',documents:'Je nach Beschäftigungssituation ggf. ärztliche Bescheinigung über die Schwangerschaft.',depends:'Angestellt, selbstständig, verbeamtet, in Ausbildung oder Studium beziehungsweise nicht erwerbstätig.',next:'Beschäftigungsbezogene Regelungen und die weitere Planung prüfen.',link:'familienportal'},
      {id:'birth_place',title:'Geburtsort und Betreuung vorbereiten',kind:'recommended',intro:'Geburtsklinik oder Geburtshaus auswählen, Geburtsvorbereitung und Nachsorge organisieren.',when:'Während der Schwangerschaft nach eigenem Bedarf; Anmeldeverfahren sind regional und von Einrichtung zu Einrichtung unterschiedlich.',where:'Kliniken, Geburtshäuser, Hebammen und Beratungsangebote vor Ort.',documents:'Bei einer Anfrage gegebenenfalls Versicherungskarte und Angaben zum voraussichtlichen Termin.',depends:'Wohnort, Verfügbarkeit, medizinische und persönliche Bedürfnisse.',next:'Anmeldeverfahren direkt bei der gewählten Einrichtung erfragen.',link:'gesund'},
    ]
  },
  {
    id:'planning',symbol:'✿',name:'Vor der Geburt',period:'Gut vorbereitet',description:'Unterlagen, Leistungen und Familienzeit planen.',
    steps:[
      {id:'birth_registration',title:'Anmeldeverfahren für den Geburtsort erfragen',kind:'recommended',intro:'Bei der ausgewählten Klinik oder dem Geburtshaus die Aufnahme und erforderliche Vorbereitung klären.',when:'Nach den Vorgaben der jeweiligen Einrichtung; keine einheitliche Frist für alle Geburtsorte.',where:'Ausgewählte Geburtsklinik oder Geburtshaus.',documents:'Welche Unterlagen verlangt werden, sagt die jeweilige Einrichtung.',depends:'Geburtsort, Versorgungsbedarf und lokale Abläufe.',next:'Kontaktdaten und gewünschte Abläufe notieren.',link:'gesund'},
      {id:'maternity_benefits',title:'Mutterschaftsgeld und Leistungen prüfen',kind:'individual',intro:'Mögliche finanzielle Leistungen vor und nach der Geburt verstehen.',when:'Anspruch und Antragszeitpunkt hängen von Versicherungs- und Erwerbssituation ab. Rechtliche Fristen vor Antragstellung bei der zuständigen Stelle prüfen.',where:'Krankenkasse und gegebenenfalls zuständige Leistungsstelle.',documents:'Versicherungsnachweis und gegebenenfalls Bescheinigungen zum voraussichtlichen Geburtstermin.',depends:'Arbeitsverhältnis, Krankenversicherung und weitere persönliche Voraussetzungen.',next:'Nötige Bescheinigungen rechtzeitig beschaffen.',link:'familienportal'},
      {id:'parental_leave_plan',title:'Elternzeit und Familienzeit planen',kind:'individual',intro:'Absprechen, wer wann Elternzeit nehmen möchte, und die Voraussetzungen prüfen.',when:'Anmeldefristen hängen davon ab, wann Elternzeit beginnen soll. Vor der konkreten Anmeldung die aktuell geltenden Fristen prüfen.',where:'Arbeitgeber und Familienportal des Bundes.',documents:'Gewünschte Zeiträume und gegebenenfalls schriftliche Anmeldedaten.',depends:'Beschäftigungsverhältnis, Alter des Kindes und Aufteilung zwischen den Eltern.',next:'Individuelle Fristen festlegen und gegebenenfalls Elternzeit anmelden.',link:'familienportal'},
    ]
  },
  {
    id:'birth',symbol:'☀',name:'Geburt & erste Woche',period:'Willkommen, Baby!',description:'Urkunden, erste Meldungen und Versicherungsfragen.',
    steps:[
      {id:'birth_certificate',title:'Geburtsurkunde und Standesamt',kind:'individual',intro:'Klären, wie die Geburt beurkundet wird und wie benötigte Urkunden erhältlich sind.',when:'Die zuständige Stelle und die Geburtsklinik informieren über das konkrete Verfahren und die dafür geltenden Termine.',where:'Standesamt des Geburtsortes und gegebenenfalls Geburtsklinik.',documents:'Je nach Familienstand und Verfahren unterschiedliche Identitäts- und Personenstandsdokumente.',depends:'Geburtsort, Familienstand und örtliche Abläufe.',next:'Urkunden für weitere Anträge bereithalten.',link:'familienportal'},
      {id:'child_insurance',title:'Krankenversicherung des Kindes klären',kind:'individual',intro:'Prüfen, wie und bei welchem Träger das Kind versichert wird.',when:'Nach der Geburt zeitnah mit der Versicherung klären. Bei privater Nachversicherung können besondere Fristen gelten.',where:'Krankenkasse oder privates Versicherungsunternehmen.',documents:'Geburtsnachweis sowie Versicherungs- und Familiendaten je nach Anbieter.',depends:'Versicherung beider Eltern, Familienstand und gegebenenfalls Einkommen.',next:'Versicherungsbestätigung für das Kind aufbewahren.',link:'familienportal'},
      {id:'after_birth_notifications',title:'Weitere erforderliche Meldungen prüfen',kind:'individual',intro:'Anhand der persönlichen Situation klären, welche Stellen informiert werden müssen.',when:'Je nach Behörde und Situation unterschiedlich – keine allgemeine Frist für alle Meldungen annehmen.',where:'Zuständige lokale Behörden, Arbeitgeber und gegebenenfalls Versicherungen.',documents:'Geburtsurkunden und weitere Angaben je nach Verfahren.',depends:'Wohnsitz, Erwerbsstatus, Versicherung und individuelle Ansprüche.',next:'Nächste Schritte für Kindergeld und Elterngeld vorbereiten.',link:'familienportal'},
    ]
  },
  {
    id:'months',symbol:'◇',name:'Erste Lebensmonate',period:'Ankommen',description:'Leistungen, Kinderarzt und passende Unterstützung.',
    steps:[
      {id:'child_benefit',title:'Kindergeld beantragen',kind:'individual',intro:'Prüfen, ob Anspruch besteht und den Antrag bei der zuständigen Familienkasse stellen.',when:'Nach der Geburt. Für rückwirkende Leistungen gibt es gesetzliche Grenzen; aktuelle Regelung vor Antragstellung prüfen.',where:'Familienkasse der Bundesagentur für Arbeit.',documents:'Erforderliche Angaben zum Kind und den Eltern; konkrete Nachweise beim Antrag prüfen.',depends:'Anspruchsvoraussetzungen und persönliche Familienkonstellation.',next:'Antragsstand verfolgen und Bescheid aufbewahren.',link:'kindergeld'},
      {id:'parental_allowance',title:'Elterngeld prüfen und beantragen',kind:'individual',intro:'Anspruch, Bezugsmodelle und die zuständige Elterngeldstelle ermitteln.',when:'Nach der Geburt; für die rückwirkende Auszahlung bestehen Grenzen. Bitte aktuelle Regeln bei der zuständigen Stelle prüfen.',where:'Elterngeldstelle nach Wohnort.',documents:'Unter anderem Geburtsnachweis und je nach Situation Einkommens- und Erwerbsangaben.',depends:'Einkommen, Erwerbssituation, Geburtszeitpunkt und gewähltes Modell.',next:'Bescheid prüfen und erforderliche Änderungen mitteilen.',link:'familienportal'},
      {id:'pediatric_care',title:'Kinderarzt und Vorsorge organisieren',kind:'recommended',intro:'Passende Kinderarztpraxis sowie die vorgesehenen Vorsorgeuntersuchungen im Blick behalten.',when:'Zeitpunkte der Untersuchungen mit Praxis und geltenden Vorgaben abstimmen.',where:'Kinderarztpraxis und Krankenversicherung.',documents:'Versicherungsnachweis, Vorsorgeunterlagen und Impfpass, soweit vorhanden.',depends:'Alter des Kindes, örtliche Praxiskapazitäten und individuelle Betreuung.',next:'Weitere Untersuchungen und Beratungstermine im Blick behalten.',link:'gesund'},
    ]
  },
  {
    id:'year',symbol:'♧',name:'Erstes Lebensjahr',period:'Gemeinsam wachsen',description:'Vorsorge, weitere Leistungen und die Betreuungssuche.',
    steps:[
      {id:'checkups',title:'Vorsorge und Kinderarzttermine begleiten',kind:'recommended',intro:'Anstehende Untersuchungen und Fragen für die Kinderarztpraxis sammeln.',when:'Entsprechend dem für das Kind geltenden Vorsorgeplan.',where:'Kinderarztpraxis und Krankenversicherung.',documents:'Vorsorgeunterlagen und gegebenenfalls Impfpass.',depends:'Alter und individuelle gesundheitliche Situation.',next:'Bei Bedarf Empfehlungen und Überweisungen mit der Praxis klären.',link:'gesund'},
      {id:'family_support',title:'Weitere Familienleistungen prüfen',kind:'individual',intro:'Nachsehen, welche Unterstützungsangebote und Leistungen zur Familie passen.',when:'Wenn sich Bedarf, Einkommen oder Familiensituation ändern.',where:'Familienportal und jeweils zuständige Beratungs- oder Leistungsstellen.',documents:'Je nach Leistung Einkommens-, Haushalts- oder Familiennachweise.',depends:'Wohnort, Einkommen, Betreuungssituation und persönliche Voraussetzungen.',next:'Nur passende Anträge auswählen.',link:'familienportal'},
      {id:'childcare_search',title:'Betreuungsbedarf und Kita-Suche planen',kind:'individual',intro:'Überlegen, ab wann Betreuung benötigt wird und welche Angebote passen.',when:'Abhängig von Bedarf und regionalen Anmeldeverfahren. Frühzeitig informieren ist hilfreich, aber keine bundesweite Anmeldefrist.',where:'Kitas, Kindertagespflege, Gemeinde oder örtlicher Jugendhilfeträger.',documents:'Regionale Antragsunterlagen und gegebenenfalls Nachweise zum Betreuungsbedarf.',depends:'Bundesland, Landkreis, Gemeinde und gewünschte Betreuungsform.',next:'Örtliches Vergabe- oder Anmeldeverfahren recherchieren.',link:'bildung'},
    ]
  },
  {
    id:'kita',symbol:'✿',name:'Kita & Beruf',period:'Ein neuer Abschnitt',description:'Betreuung organisieren und den beruflichen Wiedereinstieg begleiten.',
    steps:[
      {id:'kita_application',title:'Kita-Anmeldung und Platzvergabe klären',kind:'individual',intro:'Das örtliche Anmeldeverfahren verstehen und passende Einrichtungen kontaktieren.',when:'Anmeldezeiträume können je nach Bundesland, Träger und Kommune variieren.',where:'Kita-Träger, Gemeinde, Jugendamt oder örtliches Kita-Portal.',documents:'Je nach Ort und Verfahren unterschiedliche Antragsdaten und Nachweise.',depends:'Wohnort, Betreuungsanspruch, Alter des Kindes und Platzangebot.',next:'Rückmeldungen und Fristen der zuständigen Stelle beachten.',link:'bildung'},
      {id:'settling_in',title:'Eingewöhnung vorbereiten',kind:'recommended',intro:'Den Übergang gemeinsam mit der Betreuungseinrichtung kindgerecht planen.',when:'Vor dem vereinbarten Betreuungsbeginn.',where:'Gewählte Kita oder Kindertagespflege.',documents:'Welche Unterlagen und persönlichen Dinge benötigt werden, erklärt die Einrichtung.',depends:'Kind, Betreuungskonzept, Familienalltag und individuelle Bedürfnisse.',next:'Tagesablauf und Ansprechpartner für die erste Zeit vereinbaren.',link:'bildung'},
      {id:'return_to_work',title:'Rückkehr in den Beruf organisieren',kind:'individual',intro:'Arbeitszeiten, Betreuungsumfang und individuelle Rechte gemeinsam abstimmen.',when:'Vor dem geplanten Wiedereinstieg. Etwaige Mitteilungs- und Antragsfristen anhand der konkreten Situation prüfen.',where:'Arbeitgeber, Personalstelle und gegebenenfalls zuständige Beratungsstellen.',documents:'Abgesprochene Arbeitszeitmodelle und gegebenenfalls Elternzeitunterlagen.',depends:'Beschäftigungsmodell, Betreuungszeiten und Familienorganisation.',next:'Praktische Übergangsphase planen.',link:'familienportal'},
    ]
  },
];
const ALL_STEPS=PHASES.flatMap(phase=>phase.steps.map(step=>({...step,...(VERIFIED_GUIDE_DETAILS[step.id]||{}),phaseId:phase.id,phaseName:phase.name})));
const clampStatus=(value)=>STATUSES.some(s=>s.id===value)?value:'open';

export default function FamilyGuideScreen({userId,regionLabel,initialKnowledgeQuery=''}){
  const [statuses,setStatuses]=useState({});
  const [ready,setReady]=useState(false);
  const [phaseId,setPhaseId]=useState('pregnancy');
  const [stepId,setStepId]=useState(null);
  const [showOderSpree,setShowOderSpree]=useState(false);
  const [regionSearch,setRegionSearch]=useState('');
  const [pickedRegionId,setPickedRegionId]=useState(null);
  const [showGermany,setShowGermany]=useState(false);
  const [stateSearch,setStateSearch]=useState('');
  const [pickedStateCode,setPickedStateCode]=useState(null);
  const visibleStates=findGermanyFamilyStates(stateSearch);
  const pickedState=GERMANY_FAMILY_STATES.find(s=>s.code===pickedStateCode);
  const guessedRegion=useMemo(()=>guessBrandenburgRegion(regionLabel),[regionLabel]);
  const selectedRegion=BRANDENBURG_REGIONS.find(r=>r.id===pickedRegionId)||guessedRegion;
  const visibleRegions=findBrandenburgRegions(regionSearch);
  const regionStepOffices=officeForGuideStep(selectedRegion,stepId);
  const storageKey='familienfunke.guide.status.v1.'+userId;
  useEffect(()=>{
    let active=true;
    setReady(false);
    setStatuses({});
    if(!userId)return;
    AsyncStorage.getItem(storageKey).then(saved=>{
      if(!active)return;
      let parsed={};
      try{const value=JSON.parse(saved||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))parsed=value;}catch{}
      setStatuses(Object.fromEntries(Object.entries(parsed).filter(([id])=>ALL_STEPS.some(s=>s.id===id)).map(([id,value])=>[id,clampStatus(value)])));
    }).catch(()=>{if(active)setStatuses({});}).finally(()=>{if(active)setReady(true);});
    return()=>{active=false;};
  },[storageKey,userId]);
  useEffect(()=>{
    if(ready&&userId)AsyncStorage.setItem(storageKey,JSON.stringify(statuses)).catch(()=>{});
  },[statuses,storageKey,ready,userId]);
  const phase=PHASES.find(p=>p.id===phaseId)||PHASES[0];
  const activeStep=ALL_STEPS.find(s=>s.id===stepId);
  const doneCount=useMemo(()=>ALL_STEPS.filter(s=>statuses[s.id]==='done').length,[statuses]);
  const relevantCount=useMemo(()=>ALL_STEPS.filter(s=>statuses[s.id]!=='not_relevant').length,[statuses]);
  const pct=relevantCount?Math.round(doneCount/relevantCount*100):100;
  function setStatus(id,status){setStatuses(before=>({...before,[id]:clampStatus(status)}));}
  const openLink=(url)=>Linking.openURL(url).catch(()=>{});
  if(!ready)return <View style={st.loading}><ActivityIndicator color={P.teal}/><Text style={st.small}>Deinen Wegweiser laden …</Text></View>;
  if(activeStep){
    const source=activeStep.source||LINKS[activeStep.link];
    const localNote=selectedRegion?.id==='oder-spree'&&showOderSpree?ODER_SPREE_GUIDE.steps[activeStep.id]:null;
    return <ScrollView style={st.page} contentContainerStyle={st.content}>
      <Pressable accessibilityRole="button" onPress={()=>{setStepId(null);setPhaseId(activeStep.phaseId);}} style={st.back}><Text style={st.backText}>‹ Zurück zur Zeitleiste</Text></Pressable>
      <View style={st.detailCard}>
        <Text style={st.eyebrow}>{activeStep.phaseName}</Text>
        <Text accessibilityRole="header" style={st.detailTitle}>{activeStep.title}</Text>
        <View style={[st.tag,{backgroundColor:TYPES[activeStep.kind].bg,alignSelf:'flex-start'}]}><Text style={[st.tagText,{color:TYPES[activeStep.kind].color}]}>{TYPES[activeStep.kind].label}</Text></View>
        <Text style={[st.body,{marginTop:15}]}>{activeStep.intro}</Text>
        {activeStep.deadline?<View style={st.deadlineCard}>
          <Text style={st.deadlineLabel}>{activeStep.deadlineLabel}</Text>
          <Text style={st.deadlineText}>{activeStep.deadline}</Text>
          <Text style={st.deadlineHint}>Diese Information bezieht sich auf die genannte Situation – sie ist nicht für jede Familie eine Pflicht zur Antragstellung.</Text>
        </View>:null}
        {localNote?<View style={st.localNotice}>
          <Text style={st.question}>Hinweis für den Landkreis Oder-Spree</Text>
          <Text style={st.body}>{localNote}</Text>
          {['parental_allowance','childcare_search','kita_application'].includes(activeStep.id)?<Pressable accessibilityRole="link" onPress={()=>openLink(ODER_SPREE_GUIDE.offices[activeStep.id==='parental_allowance'?0:1].url)}><Text style={st.localLink}>Zuständige Landkreis-Seite öffnen ↗</Text></Pressable>:null}
        </View>:null}
        {regionStepOffices.length?<View style={st.localNotice}>
          <Text style={st.question}>Zuständig für {selectedRegion.name}</Text>
          {regionStepOffices.map(office=><View key={office.topic+office.title} style={st.officeCard}>
            <Text style={st.question}>{office.title}</Text>
            <Text style={st.body}>{office.detail}</Text>
            {office.contact?<Text style={st.small}>Kontakt: {office.contact}</Text>:null}
            <Pressable accessibilityRole="link"
              accessibilityLabel={'Offizielle Seite: '+office.title}
              style={st.officeLink} onPress={()=>openLink(office.url)}>
              <Text style={st.localLink}>Verfahren, Formulare und Kontakt öffnen ↗</Text>
            </Pressable>
          </View>)}
        </View>:null}
        <View style={st.detailDivider}/>
        {[
          ['Was ist zu tun?',activeStep.intro],
          ['Wann?',activeStep.when],
          ['Wo?',activeStep.where],
          ['Welche Unterlagen?',activeStep.documents],
          ['Wovon hängt es ab?',activeStep.depends],
          ['Was folgt danach?',activeStep.next],
        ].map(([question,answer])=><View key={question} style={st.detailSection}><Text style={st.question}>{question}</Text><Text style={st.body}>{answer}</Text></View>)}
        <View style={st.source}>
          <Text style={st.question}>Quelle & Geltungsbereich</Text>
          <Text style={st.small}>{source.label} · Deutschland. Zuständigkeiten und Verfahren können je nach Region abweichen.</Text>
          <Text style={[st.small,{marginTop:4}]}>{activeStep.source?'Quelle im November 2026 abgeglichen. Vor einem verbindlichen Antrag die aktuell gültigen Regeln auf der offiziellen Seite prüfen.':'Allgemeine Orientierung; einzelne Angaben wurden nicht als verbindliche Fristen geprüft.'}</Text>
          <Pressable accessibilityRole="link" onPress={()=>openLink(source.url)} style={st.sourceButton}><Text style={st.sourceButtonText}>Offizielle Informationsseite öffnen ↗</Text></Pressable>
        </View>
        <Text style={[st.question,{marginTop:18}]}>Dein Stand</Text>
        <View style={st.statusRow}>{STATUSES.map(s=><Pressable key={s.id} accessibilityRole="button" accessibilityState={{selected:(statuses[activeStep.id]||'open')===s.id}}
          onPress={()=>setStatus(activeStep.id,s.id)} style={[st.statusButton,(statuses[activeStep.id]||'open')===s.id&&st.statusSelected]}>
          <Text style={[st.statusText,(statuses[activeStep.id]||'open')===s.id&&{color:P.paper}]}>{s.name}</Text>
        </Pressable>)}</View>
      </View>
      <View style={st.note}><Text style={st.noteText}>Diese Orientierung ersetzt keine individuelle medizinische, rechtliche oder steuerliche Beratung. Im Zweifel bitte die zuständige Stelle kontaktieren.</Text></View>
    </ScrollView>;
  }
  return <ScrollView style={st.page} contentContainerStyle={st.content}>
    <View style={st.hero}>
      <View style={st.sunDot}><Text style={st.sunSymbol}>♥</Text></View>
      <Text style={st.eyebrow}>VON DER SCHWANGERSCHAFT BIS ZUM KITA-START</Text>
      <Text accessibilityRole="header" style={st.heroTitle}>Familien-Wegweiser</Text>
      <Text style={st.heroDescription}>Was steht wann an? Wir begleiten euch mit verständlichen Schritten – ohne unnötigen Druck.</Text>
      <Text style={st.region}>⌖ {regionLabel?.trim()?regionLabel.trim():'Deutschland'} · örtliche Regeln beachten</Text>
    </View>
    <View style={st.progressCard}>
      <View style={st.flexRow}><View style={{flex:1}}><Text style={st.progressTitle}>Euer persönlicher Überblick</Text><Text style={st.small}>{doneCount} von {relevantCount} passenden Aufgaben erledigt</Text></View><Text style={st.progressNumber}>{pct}%</Text></View>
      <View style={st.progressTrack}><View style={[st.progressFill,{width:pct+'%'}]}/></View>
      <Text style={[st.small,{marginTop:9}]}>Nur eure Häkchen werden auf diesem Gerät für euer Konto gespeichert. Keine Schwangerschafts- oder Gesundheitsdaten erforderlich.</Text>
    </View>
    <View style={st.legend}>{[
      TYPES.recommended,TYPES.voluntary,TYPES.individual
    ].map(t=><View key={t.short} style={[st.tag,{backgroundColor:t.bg}]}><Text style={[st.tagText,{color:t.color}]}>{t.short}</Text></View>)}</View>
    <View style={st.regionCard}>
      <Text accessibilityRole="header" style={st.regionTitle}>Regionale Stellen & Anträge</Text>
      <Text style={st.small}>Alle 14 Landkreise und vier kreisfreien Städte Brandenburgs sind auswählbar. Für jede Region ist mindestens eine konkrete amtliche Fachseite hinterlegt. Nicht jede Leistung, jeder Kontakt oder jedes kommunale Formular ist einzeln geprüft. Die Auswahl ändert weder Profil noch Standort.</Text>
      {selectedRegion?<Text style={[st.small,{marginTop:8,fontWeight:'800',color:P.tealDark}]}>Aktuelle Auswahl: {selectedRegion.name} · {selectedRegion.coverage==='verified'?'Regionalquellen geprüft':'Amtliches Verzeichnis, Detailrecherche offen'}</Text>:null}
      <Pressable accessibilityRole="button" accessibilityState={{expanded:showOderSpree}}
        accessibilityLabel="Regionale Stellen und Formulare anzeigen"
        onPress={()=>setShowOderSpree(value=>!value)} style={st.regionButton}>
        <Text style={st.regionButtonText}>{showOderSpree?'Regionsauswahl schließen':'Landkreis oder Stadt auswählen'}</Text>
      </Pressable>
      {showOderSpree?<View style={st.regionDetails}>
        <Text style={st.question}>Wohnort-Landkreis oder kreisfreie Stadt suchen</Text>
        <TextInput accessibilityLabel="Brandenburger Landkreis oder Stadt suchen"
          placeholder="z. B. Barnim, Strausberg, Cottbus …"
          placeholderTextColor={P.muted} value={regionSearch}
          onChangeText={setRegionSearch} style={st.regionInput}/>
        <Text style={st.small}>{visibleRegions.length} {visibleRegions.length===1?'Region':'Regionen'} in der Auswahl</Text>
        {visibleRegions.map(region=><Pressable key={region.id}
          accessibilityRole="button" accessibilityLabel={region.name+' auswählen'}
          accessibilityState={{selected:selectedRegion?.id===region.id}}
          style={[st.regionChoice,selectedRegion?.id===region.id&&st.regionChoiceSelected]}
          onPress={()=>{setPickedRegionId(region.id);setRegionSearch('');}}>
          <View style={{flex:1}}>
            <Text style={st.regionChoiceTitle}>{region.name}</Text>
            <Text style={st.small}>{region.coverage==='verified'?'Konkrete Kontaktseiten geprüft':'Amtliches Verzeichnis, lokale Details folgen'}</Text>
          </View>
          <Text style={st.regionChoiceArrow}>{selectedRegion?.id===region.id?'✓':'›'}</Text>
        </Pressable>)}
        {selectedRegion?<View style={{marginTop:16}}>
          <Text accessibilityRole="header" style={st.regionTitle}>{selectedRegion.name}</Text>
          {selectedRegion.offices.length?selectedRegion.offices.map(office=><View key={office.topic+office.title} style={st.officeCard}>
            <Text style={st.question}>{office.title}</Text>
            <Text style={st.small}>{office.detail}</Text>
            {office.contact?<Text style={[st.small,{marginTop:5}]}>Kontakt: {office.contact}</Text>:null}
            <Pressable accessibilityRole="link"
              accessibilityLabel={office.title+' offizielle Fachseite öffnen'}
              onPress={()=>openLink(office.url)} style={st.officeLink}>
              <Text style={st.localLink}>Offizielle Fachseite und Formulare ↗</Text>
            </Pressable>
          </View>):<Text style={st.small}>Für diese Region liegt noch keine einzeln überprüfte Fachstelle vor. Nutze zunächst das amtliche Kommunalverzeichnis und die unten verlinkten landesweiten Antragsseiten.</Text>}
          <Pressable accessibilityRole="link" onPress={()=>openLink(selectedRegion.directory_url)}
            style={st.officeLink}>
            <Text style={st.localLink}>Amtliches Kommunalverzeichnis öffnen ↗</Text>
          </Pressable>
        </View>:null}
        <Text accessibilityRole="header" style={[st.regionTitle,{marginTop:16}]}>Brandenburgweite Anträge und Hilfen</Text>
        {BRANDENBURG_FAMILY_RESOURCES.map(item=><View key={item.id} style={st.officeCard}>
          <Text style={st.question}>{item.title}</Text>
          <Text style={st.small}>{item.explanation}</Text>
          <Pressable accessibilityRole="link" accessibilityLabel={item.title+' öffnen'}
            style={st.officeLink} onPress={()=>openLink(item.url)}>
            <Text style={st.localLink}>Amtliche Information / Antragsweg ↗</Text>
          </Pressable>
        </View>)}
      </View>:null}
    </View>
    <View style={st.regionCard}>
      <Text accessibilityRole="header" style={st.regionTitle}>Deutschlandweite Familienhilfe</Text>
      <Text style={st.small}>Alle 16 Bundesländer mit amtlichen Einstiegsportalen sowie überregionale Informationen zu Anträgen, Inklusion und barrierefreien Ausflügen. Ein Landesportal bestätigt noch keine konkrete kommunale Zuständigkeit.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:showGermany}}
        accessibilityLabel="Bundesländer und deutschlandweite Hilfen anzeigen"
        onPress={()=>setShowGermany(value=>!value)} style={st.regionButton}>
        <Text style={st.regionButtonText}>{showGermany?'Deutschland-Wegweiser schließen':'Bundesland oder bundesweite Hilfe finden'}</Text>
      </Pressable>
      {showGermany?<View style={st.regionDetails}>
        <Text style={st.question}>Bundesland suchen</Text>
        <TextInput accessibilityLabel="Bundesland oder Landeshauptstadt suchen"
          placeholder="z. B. Sachsen, Berlin, München …" placeholderTextColor={P.muted}
          value={stateSearch} onChangeText={setStateSearch} style={st.regionInput}/>
        <Text style={st.small}>{visibleStates.length} Bundesländer in der Auswahl</Text>
        {visibleStates.map(state=><Pressable key={state.code} accessibilityRole="button"
          accessibilityLabel={state.name+' als Bundesland auswählen'}
          accessibilityState={{selected:pickedStateCode===state.code}}
          onPress={()=>setPickedStateCode(state.code)} style={[st.regionChoice,pickedStateCode===state.code&&st.regionChoiceSelected]}>
          <View style={{flex:1}}>
            <Text style={st.regionChoiceTitle}>{state.name}</Text>
            <Text style={st.small}>Amtliches Landesportal · örtliche Zuständigkeit separat prüfen</Text>
          </View>
          <Text style={st.regionChoiceArrow}>{pickedStateCode===state.code?'✓':'›'}</Text>
        </Pressable>)}
        {pickedState?<View style={st.officeCard}>
          <Text style={st.question}>{pickedState.name}: offizielles Serviceportal</Text>
          <Text style={st.small}>Hier kannst du Leistungen und Zuständigkeiten nach Wohnort suchen. Für Brandenburg sind zusätzlich die Kreisstellen oben erfasst.</Text>
          <Pressable accessibilityRole="link" accessibilityLabel={'Amtliches Serviceportal '+pickedState.name+' öffnen'}
            style={st.officeLink} onPress={()=>openLink(pickedState.portal_url)}>
            <Text style={st.localLink}>Landesportal öffnen ↗</Text>
          </Pressable>
        </View>:null}
        <Text accessibilityRole="header" style={[st.regionTitle,{marginTop:16}]}>Bundesweite Anträge, Beratung & Teilhabe</Text>
        {GERMANY_FAMILY_RESOURCES.map(item=><View key={item.id} style={st.officeCard}>
          <Text style={st.question}>{item.title}</Text>
          <Text style={st.small}>{item.description}</Text>
          <Pressable accessibilityRole="link" accessibilityLabel={item.title+' öffnen'}
            style={st.officeLink} onPress={()=>openLink(item.url)}>
            <Text style={st.localLink}>Amtliche Information und Suchportal öffnen ↗</Text>
          </Pressable>
        </View>)}
      </View>:null}
    </View>
    <FamilyTopicsSection initialQuery={initialKnowledgeQuery}/>
    <Text style={st.sectionHeading}>Eure Zeitleiste</Text>
    {PHASES.map((p,index)=>{
      const selected=p.id===phaseId;
      const completed=p.steps.filter(s=>statuses[s.id]==='done').length;
      return <View key={p.id} style={st.phaseRow}>
        <View style={st.timelineRail}><View style={[st.circle,selected&&st.circleSelected]}><Text style={[st.circleLabel,selected&&{color:P.paper}]}>{index+1}</Text></View>{index<PHASES.length-1?<View style={st.railLine}/>:null}</View>
        <Pressable accessibilityRole="button" accessibilityState={{expanded:selected}} onPress={()=>setPhaseId(p.id)} style={[st.phaseCard,selected&&st.phaseCardSelected]}>
          <View style={st.flexRow}><View style={{flex:1}}><Text style={st.eyebrow}>{p.period}</Text><Text style={st.phaseTitle}>{p.name}</Text></View><Text style={st.phaseGlyph}>{p.symbol}</Text></View>
          <Text style={st.small}>{p.description}</Text>
          <View style={[st.flexRow,{marginTop:10}]}><Text style={st.countText}>{completed} / {p.steps.length} erledigt</Text><Text style={st.openText}>{selected?'Schritte anzeigen ⌃':'Öffnen ›'}</Text></View>
        </Pressable>
      </View>;
    })}
    <View style={st.stepsBox}>
      <Text style={st.sectionHeading}>{phase.name}: eure Schritte</Text>
      <Text style={[st.small,{marginBottom:12}]}>Tippt auf einen Schritt für Zeitpunkt, Zuständigkeit, Unterlagen und weitere Hinweise.</Text>
      {phase.steps.map((step,index)=>{
        const status=statuses[step.id]||'open';
        return <Pressable key={step.id} accessibilityRole="button" onPress={()=>setStepId(step.id)} style={st.stepCard}>
          <View style={st.stepIcon}><Text style={st.stepIconText}>{status==='done'?'✓':String(index+1)}</Text></View>
          <View style={{flex:1}}><Text style={st.stepTitle}>{step.title}</Text><Text style={st.small}>{TYPES[step.kind].short} · {STATUSES.find(x=>x.id===status)?.name}</Text></View><Text style={st.arrow}>›</Text>
        </Pressable>;
      })}
    </View>
    <View style={st.note}><Text style={st.noteText}>Gesetzliche Fristen, Empfehlungen und freiwillige Schritte sind nicht dasselbe. Persönliche Situationen und regionale Verfahren unterscheiden sich. Prüft verbindliche Fristen immer bei der zuständigen offiziellen Stelle.</Text></View>
  </ScrollView>;
}

const st=StyleSheet.create({
  page:{flex:1,backgroundColor:P.bg},content:{padding:17,paddingBottom:46},
  loading:{flex:1,justifyContent:'center',alignItems:'center',gap:12},small:{fontSize:12.5,lineHeight:19,color:P.muted},
  hero:{borderRadius:25,backgroundColor:P.sun,padding:22,marginBottom:15,borderWidth:1,borderColor:P.sunPale},
  sunDot:{width:49,height:49,backgroundColor:P.paper,borderRadius:18,alignItems:'center',justifyContent:'center',marginBottom:12},
  sunSymbol:{fontSize:27,color:P.coral,fontWeight:'900'},
  eyebrow:{fontSize:10,fontWeight:'900',color:P.tealDark,letterSpacing:1.3,marginBottom:6},
  heroTitle:{fontSize:27,fontWeight:'900',color:P.ink,letterSpacing:-0.6},
  heroDescription:{fontSize:14,color:P.ink,lineHeight:21,marginTop:8},
  region:{fontSize:11.5,fontWeight:'700',color:P.tealDark,marginTop:13},
  flexRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
  progressCard:{backgroundColor:P.paper,borderRadius:20,borderWidth:1,borderColor:P.line,padding:16,marginBottom:14},
  progressTitle:{fontSize:15,fontWeight:'900',color:P.ink,marginBottom:3},
  progressNumber:{fontSize:21,fontWeight:'900',color:P.tealDark},
  progressTrack:{height:9,backgroundColor:P.pale,borderRadius:8,marginTop:13,overflow:'hidden'},
  progressFill:{height:9,backgroundColor:P.coral,borderRadius:8},
  legend:{flexDirection:'row',gap:7,flexWrap:'wrap',marginBottom:16},
  tag:{paddingHorizontal:11,paddingVertical:6,borderRadius:14},
  tagText:{fontWeight:'800',fontSize:11},
  sectionHeading:{fontSize:19,fontWeight:'900',color:P.ink,marginBottom:14},
  phaseRow:{flexDirection:'row',gap:10,alignItems:'stretch',minHeight:107},
  timelineRail:{width:30,alignItems:'center'},
  circle:{width:28,height:28,borderRadius:14,backgroundColor:P.paper,borderWidth:2,borderColor:P.teal,justifyContent:'center',alignItems:'center'},
  circleSelected:{backgroundColor:P.teal,borderColor:P.teal},
  circleLabel:{fontSize:12,fontWeight:'900',color:P.teal},
  railLine:{width:2,backgroundColor:'#CCE3DA',flex:1,marginVertical:5},
  phaseCard:{flex:1,backgroundColor:P.paper,borderWidth:1,borderColor:P.line,borderRadius:18,padding:15,marginBottom:10},
  phaseCardSelected:{borderColor:P.teal,borderWidth:2,backgroundColor:'#F4FBF8'},
  phaseTitle:{fontSize:16.5,fontWeight:'900',color:P.ink,marginBottom:5},
  phaseGlyph:{fontSize:23,color:P.coral},
  countText:{color:P.muted,fontWeight:'700',fontSize:11},
  openText:{color:P.tealDark,fontWeight:'900',fontSize:11},
  stepsBox:{backgroundColor:'#FFF5E8',borderRadius:21,padding:14,marginTop:9,borderColor:'#F6E2CF',borderWidth:1},
  stepCard:{backgroundColor:P.paper,borderRadius:14,marginBottom:9,padding:12,flexDirection:'row',alignItems:'center',gap:11},
  stepIcon:{backgroundColor:P.pale,width:34,height:34,borderRadius:12,alignItems:'center',justifyContent:'center'},
  stepIconText:{fontSize:15,color:P.tealDark,fontWeight:'900'},
  stepTitle:{fontSize:13.5,color:P.ink,fontWeight:'900',marginBottom:3},
  arrow:{fontSize:24,color:P.teal},
  back:{minHeight:44,justifyContent:'center',paddingVertical:10,marginBottom:11},backText:{fontWeight:'900',fontSize:14.5,color:P.tealDark},
  detailCard:{backgroundColor:P.paper,borderRadius:24,padding:18,borderWidth:1,borderColor:P.line},
  detailTitle:{fontSize:24,fontWeight:'900',color:P.ink,marginBottom:13},
  body:{fontSize:13.5,color:P.ink,lineHeight:21},
  detailDivider:{height:1,backgroundColor:P.line,marginVertical:16},
  detailSection:{marginBottom:16},question:{fontSize:14,fontWeight:'900',color:P.ink,marginBottom:7},
  source:{backgroundColor:P.pale,borderRadius:15,padding:14,marginTop:5},
  sourceButton:{backgroundColor:P.teal,borderRadius:13,padding:12,alignItems:'center',justifyContent:'center',minHeight:44,marginTop:12},
  sourceButtonText:{fontSize:12.5,fontWeight:'900',color:P.paper},
  statusRow:{flexDirection:'row',flexWrap:'wrap',gap:7},
  statusButton:{minHeight:44,justifyContent:'center',paddingHorizontal:11,paddingVertical:10,borderRadius:13,backgroundColor:'#EDF3F2'},
  statusSelected:{backgroundColor:P.teal},
  statusText:{color:P.tealDark,fontSize:12,fontWeight:'900'},
  deadlineCard:{backgroundColor:'#FFF4D8',borderRadius:15,padding:15,marginTop:17},
  deadlineLabel:{fontSize:11,fontWeight:'900',color:'#7C5420',textTransform:'uppercase',letterSpacing:0.6},
  deadlineText:{fontSize:15,fontWeight:'900',color:P.ink,lineHeight:22,marginTop:7},
  deadlineHint:{fontSize:11.5,lineHeight:18,color:P.muted,marginTop:9},
  localNotice:{borderWidth:1,borderColor:'#D2E8E0',backgroundColor:'#F4FBF8',borderRadius:15,padding:14,marginTop:15},
  localLink:{fontSize:12.5,fontWeight:'900',color:P.tealDark,marginTop:9},
  regionCard:{backgroundColor:P.paper,borderWidth:1,borderColor:P.line,borderRadius:19,padding:15,marginBottom:21},
  regionTitle:{fontSize:16,fontWeight:'900',color:P.ink,marginBottom:6},
  regionButton:{backgroundColor:P.teal,paddingVertical:12,paddingHorizontal:12,borderRadius:12,alignItems:'center',marginTop:12},
  regionButtonText:{fontWeight:'900',color:P.paper,fontSize:13},
  regionDetails:{marginTop:15},
  regionInput:{borderWidth:1,borderColor:P.line,borderRadius:12,backgroundColor:P.paper,padding:12,minHeight:48,fontSize:14,color:P.ink,marginVertical:8},
  regionChoice:{minHeight:58,padding:11,borderRadius:13,flexDirection:'row',alignItems:'center',marginTop:7,borderWidth:1,borderColor:P.line,backgroundColor:P.bg},
  regionChoiceSelected:{borderColor:P.teal,backgroundColor:P.sunPale},
  regionChoiceTitle:{fontSize:14,fontWeight:'800',color:P.ink},
  regionChoiceArrow:{fontSize:18,fontWeight:'800',color:P.tealDark},
  officeCard:{paddingVertical:12,borderTopWidth:1,borderTopColor:P.line},
  officeLink:{minHeight:44,justifyContent:'center',marginTop:3},
  note:{backgroundColor:P.warn,padding:15,borderRadius:16,marginTop:16},
  noteText:{color:'#6A542E',lineHeight:20,fontSize:12.5},
});
