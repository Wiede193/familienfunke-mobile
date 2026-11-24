import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, ActivityIndicator, Animated, Keyboard, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {supabase} from './supabase';
import {FAMILY_COLORS} from './FamilyTheme';
import {GentleReveal,useReducedMotion} from './FamilyMotion';
import {ContextHelp} from './FamilyInteraction';
import {FAMILY_TYPE as T,FAMILY_SPACE as S} from './FamilyTheme';
import FamilyIcon,{FAMILY_ROUTE_ICONS} from './FamilyIcon';
import SearchResultFeedback from './SearchResultFeedback';
import {FamilyEmptyState,FamilySkeleton,FamilySectionTitle} from './FamilyFeedback';
import {recommendFamilyPlaces,selectHomeOffers,selectHomeEvents,missingFamilyProfileStep,homeGreeting} from './HomePersonalization';
import {retryRead} from './NetworkResilience';
import {HOME_ROUTES,findHomeRoutes,looksLikeMarketProductQuery,looksLikeKnowledgeQuestion} from './HomeNavigation';

import {findFamilyMapLocations} from './FamilyMapSearch';
import {findHealthyResources,HEALTH_RESOURCES} from './FamilyHealthyContent';
import {findFamilyTopics,FAMILY_TOPIC_ARTICLES} from './FamilyTopicsKnowledge';
import {findInclusionArticles,INCLUSION_ARTICLES} from './InclusionKnowledge';
import {answerFamilyQuestion} from './FamilyKnowledgeAnswer';
import {KNOWLEDGE_ALIASES,KNOWLEDGE_FACTS,KNOWLEDGE_PROMPTS} from './FamilyKnowledgeCatalog';
import {BRANDENBURG_REGIONS,BRANDENBURG_FAMILY_RESOURCES} from './BrandenburgFamilyRegions';
import {GERMANY_FAMILY_STATES,GERMANY_FAMILY_RESOURCES} from './GermanyFamilyDirectory';
import {GERMANY_STATE_SERVICES,matchGermanState} from './GermanyFamilyServices';
import {VERIFIED_GUIDE_DETAILS} from './FamilyGuideVerified';
import {CURATED_FAMILY_PLACES} from './FamilyMapCurated';
import {BRANDENBURG_FAMILY_PLACES} from './FamilyMapBrandenburg';
import {NATIONAL_FAMILY_PLACES} from './FamilyMapNational';

const C=FAMILY_COLORS;
const FEATURED=['discover','map','market','guide'];
const FULL_PLACE_CATALOG=[...CURATED_FAMILY_PLACES,...BRANDENBURG_FAMILY_PLACES,...NATIONAL_FAMILY_PLACES];
function SunMark(){
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.sunWrap}>
    {Array.from({length:8},(_,i)=><View key={i} style={[s.ray,{
      transform:[{rotate:(i*45)+'deg'},{translateY:-20}]
    }]}/>)}
    <View style={s.sunCore}/>
  </View>;
}
function AreaCard({route,onNavigate,query,compact=false}){
  const productSearch=route.id==='market'&&looksLikeMarketProductQuery(query);
  return <Pressable accessibilityRole="button"
    accessibilityLabel={route.title+' öffnen'}
    onPress={()=>onNavigate(route.id,['healthy','guide','inclusion','decisions'].includes(route.id)?query.trim():productSearch?query.trim():'')}
    style={({pressed})=>[compact?s.areaGrid:s.areaRow,pressed&&s.pressed]}>
    <View style={s.areaIcon}><FamilyIcon name={FAMILY_ROUTE_ICONS[route.id]||'compass'} size={compact?25:23}/></View>
    <View style={{flex:1}}>
      <Text style={[s.areaTitle,compact&&{fontSize:15}]}>{route.title}</Text>
      <Text style={s.areaSubtitle} numberOfLines={compact?3:2}>{route.subtitle}</Text>
    </View>
    <FamilyIcon name="chevron-right" size={19} color={C.accentDark}/>
  </Pressable>;
}
function AssistantReply({entry,onNavigate,onAsk,prominent=false}){
  return <GentleReveal distance={12}><View accessibilityLiveRegion="polite" style={[s.answerCard,prominent&&s.answerCardNewest]}>
    <Text style={s.youLabel}>DEINE FRAGE</Text>
    <Text style={s.questionText}>{entry.question}</Text>
    <View style={s.answerDivider}/>
    <View style={s.answerHeadingRow}>
      <Text accessibilityRole="header" style={s.assistantLabel}>{entry.kind==='unanswered'?'NOCH KEINE GESICHERTE ANTWORT':'DEINE ANTWORT'}</Text>
      <View style={s.answerIconBadge}><FamilyIcon name="book" size={18} color={C.accentDark}/></View>
    </View>
    <Text selectable style={s.answerText}>{entry.answer}</Text>
    <Text style={s.answerOrigin}>Redaktionelle Informationen · keine Live-Prüfung</Text>
    {entry.sources?.length?<View style={s.offerGroup}>
      <Text style={s.offerHeading}>Quellen und weiterführende Informationen</Text>
      {entry.sources.map(src=><Pressable key={src.url} accessibilityRole="link"
        accessibilityLabel={src.title+' öffnen'}
        onPress={()=>Linking.openURL(src.url).catch(()=>{})} style={s.offerItem}>
        <Text style={s.answerActionLabel}>{src.title} ›</Text>
      </Pressable>)}
    </View>:null}
    {entry.related?.length?<View style={s.related}>
      <Text style={s.relatedTitle}>{entry.kind==='places'?'Weitere Katalogziele':'Das könnte auch helfen'}</Text>
      {entry.related.slice(0,3).map((item,i)=><Pressable key={(item.placeId||item.question||item.label)+i}
        accessibilityRole="button"
        accessibilityLabel={item.label+' öffnen'}
        onPress={()=>item.placeId?onNavigate('map','',item.placeId):onAsk(item.question||item.label,entry.contextRef||null)}
        style={s.relatedButton}>
        <Text style={s.relatedLabel}>{item.label}</Text>
        <FamilyIcon name="chevron-right" size={17} color={C.accentDark}/>
      </Pressable>)}
    </View>:null}
    {entry.searchQuery&&!entry.offersError&&Array.isArray(entry.offers)?
      <View style={s.offerGroup}>
        <Text style={s.offerHeading}>Tatsächlich freigegebene Angebote</Text>
        {entry.offers.length?entry.offers.map(offer=>
          <Pressable key={offer.id} accessibilityRole="button"
            accessibilityLabel={offer.title+' im Basar suchen'}
            onPress={()=>onNavigate('market',entry.searchQuery)}
            style={s.offerItem}>
            <Text style={s.offerTitle}>{offer.title}</Text>
            {offer.matchItem?<Text style={s.mutedSmall}>Passender Artikel: {offer.matchItem}</Text>:null}
            <Text style={s.offerPrice}>{offer.price}</Text>
          </Pressable>
        ):<Text style={s.mutedSmall}>Für diese Suche gibt es momentan keine freigegebenen Treffer.</Text>}
      </View>:null}
    {entry.searchQuery&&entry.offersError?
      <Text style={[s.mutedSmall,{marginTop:12}]}>Treffer lassen sich gerade nicht laden. Die Suche im Basar ist weiterhin möglich.</Text>:null}
    {entry.pageId?<Pressable accessibilityRole="button"
      accessibilityLabel="Vorgeschlagenen App-Bereich öffnen"
      onPress={()=>entry.placeId?onNavigate('map','',entry.placeId):onNavigate(entry.pageId,entry.navigationQuery||entry.searchQuery||entry.question)}
      style={({pressed})=>[s.answerAction,pressed&&s.pressed]}>
      <Text style={s.answerActionLabel}>{HOME_ROUTES.find(x=>x.id===entry.pageId)?.title||'Passenden Bereich öffnen'} ›</Text>
      
    </Pressable>:null}
  </View></GentleReveal>;
}
export default function HomeAssistant({onNavigate,profile,userId,active=false,inboxUnread=null}){
  const {width:screenWidth,fontScale}=useWindowDimensions();
  const reducedMotion=useReducedMotion();
  const scrollY=useRef(new Animated.Value(0)).current;
  const answerOffset=useRef(0);
  const [showAnswerInfo,setShowAnswerInfo]=useState(false);
  const singleColumn=screenWidth<360||fontScale>=1.5;
  const [question,setQuestion]=useState('');
  const [conversation,setConversation]=useState([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [showAll,setShowAll]=useState(false);
  const [selectedTopicGroup,setSelectedTopicGroup]=useState(KNOWLEDGE_PROMPTS[0].title);
  const [showMoreFeed,setShowMoreFeed]=useState(false);
  const scrollRef=useRef(null);
  const searchResultOffset=useRef(0);
  const requestSeq=useRef(0),alive=useRef(true),pending=useRef(false);
  const [searchResult,setSearchResult]=useState(null);
  const [searchBusy,setSearchBusy]=useState(false);
  const [homeFeed,setHomeFeed]=useState({offers:null,events:null});
  const [feedLoading,setFeedLoading]=useState(false);
  const [feedRetry,setFeedRetry]=useState(0);
  const region=profile?.region_label||'';
  const profileStep=missingFamilyProfileStep(profile);
  const suggestedPlaces=recommendFamilyPlaces(
    [...CURATED_FAMILY_PLACES,...BRANDENBURG_FAMILY_PLACES],{region,interests:profile?.interests||[]},3
  );
  useEffect(()=>{
    let live=true;
    if(!userId||!active){
      setHomeFeed({offers:[],events:[]});setFeedLoading(false);
      return()=>{live=false;};
    }
    setFeedLoading(true);setHomeFeed({offers:null,events:null});
    (async()=>{
      // Home recommendations are NOT fetched with the global app bootstrap.
      // Both calls respect server-side approvals, RLS and block policies.
      const [offerResponse,eventResponse]=await Promise.allSettled([
        retryRead(()=>supabase.rpc('ff_market_search',{
          p_query:'',p_category:'Alle',p_trade_type:'all',
          p_sort:'newest',p_limit:10,p_offset:0
        }),{isCurrent:()=>live}),
        retryRead(()=>supabase.rpc('ff_search_events',{p_query:'veranstaltungen'}),{isCurrent:()=>live})
      ]);
      if(!live)return;
      const offerData=offerResponse.status==='fulfilled'&&!offerResponse.value?.error&&
        Array.isArray(offerResponse.value?.data)?offerResponse.value.data:null;
      const eventData=eventResponse.status==='fulfilled'&&!eventResponse.value?.error&&
        Array.isArray(eventResponse.value?.data)?eventResponse.value.data:null;
      setHomeFeed({
        offers:offerData===null?null:selectHomeOffers(offerData,{region,ownerId:userId},3),
        events:eventData===null?null:selectHomeEvents(eventData,{region},2)
      });
    })().catch(()=>{if(live)setHomeFeed({offers:null,events:null});})
      .finally(()=>{if(live)setFeedLoading(false);});
    return()=>{live=false;};
  },[userId,active,region,feedRetry]);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;requestSeq.current++;};},[]);
  function updateQuestion(value){
    requestSeq.current++;pending.current=false;
    setQuestion(value);setSearchResult(null);setSearchBusy(false);setBusy(false);setError('');
  }
  const needle=question.trim();
  const matches=findHomeRoutes(needle);
  const visibleReplies=conversation.filter(entry=>entry.question===needle).slice(0,1);
  const places=needle.length>=2?findFamilyMapLocations(needle,{curated:[...CURATED_FAMILY_PLACES,...BRANDENBURG_FAMILY_PLACES],national:NATIONAL_FAMILY_PLACES},4):[];
  const healthMatches=needle.length>=3?findHealthyResources(needle,3):[];
  const topicMatches=needle.length>=3?findFamilyTopics(needle).slice(0,3):[];
  const inclusionMatches=needle.length>=3?findInclusionArticles(needle).slice(0,3):[];
  const marketIntent=looksLikeMarketProductQuery(needle)||matches[0]?.id==='market';
  const visibleSearch=searchResult?.query===needle?searchResult:null;
  const searchCount=matches.length+places.length+healthMatches.length+topicMatches.length+inclusionMatches.length+
    (visibleSearch?.decisions?.length||0)+(visibleSearch?.officialEvents?.length||0)+
    (visibleSearch?.events?.length||0)+(visibleSearch?.offers?.length||0);
  useEffect(()=>{if(visibleSearch)scrollRef.current?.scrollTo({y:Math.max(0,searchResultOffset.current-8),animated:!reducedMotion});},[visibleSearch,reducedMotion]);
  useEffect(()=>{
    if(!conversation.length)return;
    const timer=setTimeout(()=>scrollRef.current?.scrollTo({y:Math.max(0,answerOffset.current-14),animated:!reducedMotion}),90);
    return()=>clearTimeout(timer);
  },[conversation,reducedMotion]);
  const featured=FEATURED.map(id=>HOME_ROUTES.find(route=>route.id===id)).filter(Boolean);
  const moreRoutes=HOME_ROUTES.filter(route=>!FEATURED.includes(route.id));
  function askAssistant(input=needle,contextRef=null){
    const prompt=String(input||'').trim().slice(0,600);
    if(prompt.length<3||pending.current)return;
    const request=++requestSeq.current;
    pending.current=true;Keyboard.dismiss();setError('');
    try{
      // Lokal berechnete Antwort: keine API-Abfrage und keine serverseitige Speicherung.
      const reply=answerFamilyQuestion(prompt,{
        topics:FAMILY_TOPIC_ARTICLES,inclusion:INCLUSION_ARTICLES,
        health:HEALTH_RESOURCES,routes:HOME_ROUTES,places,
        allPlaces:FULL_PLACE_CATALOG,region,
        aliases:KNOWLEDGE_ALIASES,facts:KNOWLEDGE_FACTS,
        brandenburgRegions:BRANDENBURG_REGIONS,brandenburgResources:BRANDENBURG_FAMILY_RESOURCES,
        germanyStates:GERMANY_FAMILY_STATES,germanyResources:GERMANY_FAMILY_RESOURCES,
        stateServices:GERMANY_STATE_SERVICES,stateMatch:matchGermanState(prompt,GERMANY_FAMILY_STATES),
        guideDetails:VERIFIED_GUIDE_DETAILS,
        previousContext:contextRef||conversation[0]?.contextRef||null
      });
      if(!alive.current||request!==requestSeq.current)return;
      setConversation(old=>[{question:prompt,...reply},...old].slice(0,6));
      scrollRef.current?.scrollTo({y:0,animated:false});
      AccessibilityInfo.announceForAccessibility('Antwort aus der Wissensdatenbank verfügbar.');
    }catch{
      if(alive.current&&request===requestSeq.current)setError('Die lokale Wissenssuche konnte nicht ausgeführt werden.');
    }finally{
      if(alive.current&&request===requestSeq.current)pending.current=false;
    }
  }
  function askSuggested(questionText,contextRef=null){
    updateQuestion(questionText);
    askAssistant(questionText,contextRef);
    scrollRef.current?.scrollTo({y:0,animated:false});
  }
  function submitSearch(){
    if(needle.length<2||busy||searchBusy)return;
    if(looksLikeKnowledgeQuestion(needle))askAssistant();
    else searchApp();
  }
  async function searchApp(){
    const query=needle;
    if(query.length<2||pending.current)return;
    Keyboard.dismiss();setError('');
    const request=++requestSeq.current;pending.current=true;setSearchBusy(true);
    try{
      // Searches run independently, so one unavailable service does not erase other results.
      const [eventResponse,marketResponse,officialResponse,decisionResponse]=await Promise.allSettled([
        supabase.rpc('ff_search_events',{p_query:query.slice(0,160)}),
        marketIntent?supabase.rpc('ff_market_search',{
          p_query:query.slice(0,160),p_category:'Alle',p_trade_type:'all',
          p_sort:'relevance',p_limit:5,p_offset:0
        }):Promise.resolve(null),
        supabase.from('ff_official_family_events')
          .select('id,title,city,start_date,source_name')
          .eq('published',true)
          .gte('end_date',new Date().toISOString().slice(0,10))
          .ilike('title','%'+query.slice(0,80).replace(/[%_\\,()]/g,'')+'%')
          .order('start_date',{ascending:true}).limit(5),
        supabase.from('ff_official_decisions')
          .select('id,title,level,decision_status,source_name,published_at')
          .eq('published',true)
          .ilike('title','%'+query.slice(0,80).replace(/[%_\\,()]/g,'')+'%')
          .order('published_at',{ascending:false}).limit(5)
      ]);
      if(!alive.current||request!==requestSeq.current)return;
      const eventData=eventResponse.status==='fulfilled'?eventResponse.value:null;
      const marketData=marketResponse.status==='fulfilled'?marketResponse.value:null;
      const officialData=officialResponse.status==='fulfilled'?officialResponse.value:null;
      const officialEvents=officialData&&!officialData.error&&Array.isArray(officialData.data)?officialData.data:[];
      const officialError=!officialData||!!officialData.error;
      const eventsError=!eventData||!!eventData.error||!Array.isArray(eventData.data);
      const events=eventsError?[]:eventData.data.filter(row=>['family','partner'].includes(row.kind)&&row.id&&new Date(row.starts_at)>new Date());
      const offersError=marketIntent&&(!marketData||!!marketData.error||!Array.isArray(marketData.data));
      const offers=marketIntent&&!offersError?marketData.data.filter(row=>row?.listing?.moderation_status==='approved').map(row=>({
        id:row.listing.id,title:String(row.listing.title||'').slice(0,100),
        price:row.listing.trade_type==='gift'?'Zu verschenken':row.listing.trade_type==='swap'?'Tausch':
          (Number(row.listing.price_cents||0)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'})
      })):null;
      const decisionData=decisionResponse.status==='fulfilled'?decisionResponse.value:null;
      const decisions=decisionData&&!decisionData.error&&Array.isArray(decisionData.data)?decisionData.data:[];
      setSearchResult({query,offers,events,eventsError,offersError,officialEvents,officialError,decisions});
      AccessibilityInfo.announceForAccessibility((events.length+officialEvents.length)+' Veranstaltungstreffer und '+(offers?.length||0)+' Basar-Treffer in der Vorschau.');
    }catch{if(alive.current&&request===requestSeq.current)setError('Die Online-Suche konnte nicht geladen werden. App-Bereiche und Katalogorte bleiben verfügbar.');}
    finally{if(alive.current&&request===requestSeq.current){pending.current=false;setSearchBusy(false);}}
  }
  return <Animated.ScrollView ref={scrollRef} style={s.page} contentContainerStyle={s.content}
    keyboardShouldPersistTaps="handled" scrollEventThrottle={16}
    onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:true})}>
    <GentleReveal distance={24} delay={80} style={[s.searchCenter,!needle&&!conversation.length&&s.searchCenterIdle]}>
      <Animated.View style={{alignItems:'center',
        opacity:reducedMotion?1:scrollY.interpolate({inputRange:[0,180],outputRange:[1,.85],extrapolate:'clamp'}),
        transform:[{translateY:reducedMotion?0:scrollY.interpolate({inputRange:[0,200],outputRange:[0,16],extrapolate:'clamp'})}]}}>
        <SunMark/>
        <Text accessibilityRole="header" style={s.wordmark}>Was möchtet ihr heute entdecken?</Text>
        <Text style={s.tagline}>Für gemeinsame Unternehmungen, Fragen und kleine Alltagsideen.</Text>
      </Animated.View>
      <View style={s.inputShell}>
        <FamilyIcon name="search" size={23} color={C.accentDark}/>
        <TextInput accessibilityLabel="Familienfunke durchsuchen oder Wissensfrage stellen"
          style={s.input} value={question} onChangeText={updateQuestion} editable={!busy&&!searchBusy}
          placeholder="Was sucht ihr? z. B. Spielplatz, Elterngeld …"
          placeholderTextColor={C.muted} maxLength={600}
          autoCapitalize="sentences" returnKeyType="search" onSubmitEditing={submitSearch}/>
        {needle?<Pressable accessibilityRole="button" accessibilityLabel="Eingabe löschen"
          onPress={()=>updateQuestion('')} style={s.clear}><Text style={s.clearText}>×</Text></Pressable>:null}
      </View>
      <View style={[s.searchActions,{justifyContent:'center'}]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Passende Ergebnisse oder Antwort anzeigen"
          accessibilityState={{disabled:busy||searchBusy||needle.length<2,busy:searchBusy}}
          disabled={busy||searchBusy||needle.length<2} onPress={submitSearch}
          style={[s.askButton,{flex:1,maxWidth:440},(busy||searchBusy||needle.length<2)&&s.disabled]}>
          {searchBusy?<ActivityIndicator color={C.white} style={{marginRight:8}}/>:null}
          <Text style={s.askButtonLabel}>{searchBusy?'Suche läuft …':'Ergebnisse anzeigen'}</Text>
        </Pressable>
      </View>
      <Text style={s.searchHint}>Ein Suchfeld für alles: Familien, Angebote, Ausflüge und Fragen.</Text>
      {needle.length>=2&&!visibleReplies.length?<View style={s.instantResults}>
        <Text style={s.instantTitle}>Direkt gefunden</Text>
        {places[0]?<Pressable accessibilityRole="button"
            accessibilityLabel={places[0].title+' auf der Karte öffnen'}
            onPress={()=>onNavigate('map','',places[0].place.id)} style={s.areaRow}>
              <View style={{flex:1}}><Text style={s.areaTitle}>{places[0].title}</Text>
              <Text style={s.areaSubtitle}>Ausflug auf der Karte ansehen</Text></View>
              <Text style={s.areaArrow}>›</Text>
            </Pressable>:
          topicMatches[0]?<Pressable accessibilityRole="button"
            accessibilityLabel={topicMatches[0].title+' im Familienwissen öffnen'}
            onPress={()=>onNavigate('guide',needle)} style={s.areaRow}>
              <View style={{flex:1}}><Text style={s.areaTitle}>{topicMatches[0].title}</Text>
              <Text style={s.areaSubtitle}>{topicMatches[0].short}</Text></View>
              <Text style={s.areaArrow}>›</Text>
            </Pressable>:
          matches[0]?<AreaCard route={matches[0]} onNavigate={onNavigate} query={needle} compact/>:
          <Text style={s.mutedSmall}>Noch kein direkter Treffer. Suche starten, um weitere Ergebnisse zu laden.</Text>}
      </View>:null}
      {error?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={s.error}>{error}</Text>:null}
    </GentleReveal>
    {visibleReplies.length?<View style={s.section} onLayout={e=>{answerOffset.current=e.nativeEvent.layout.y;}}>
      <View style={s.replyHeader}>
        <Text accessibilityRole="header" style={s.replySectionTitle}>Deine Antworten</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Wissensantworten dieser Ansicht löschen"
          onPress={()=>{requestSeq.current++;pending.current=false;setBusy(false);setSearchBusy(false);setConversation([]);}} style={s.clearHistory}>
          <Text style={s.clearHistoryLabel}>Verlauf leeren</Text>
        </Pressable>
      </View>
      {visibleReplies.map((entry,i)=><AssistantReply key={i+'-'+entry.question}
        entry={entry} prominent={i===0} onNavigate={onNavigate} onAsk={askSuggested}/>)}
    </View>:null}
    {needle?<View style={s.section} onLayout={event=>{searchResultOffset.current=event.nativeEvent.layout.y;}}>
      <SearchResultFeedback active context={visibleSearch?'Familienfunke-Suche':'Direkte Suchtreffer'} query={needle} count={searchCount} loading={searchBusy}
        hint={visibleSearch?'Passenden Eintrag antippen, um ihn zu öffnen.':'Für aktuelle Angebote, Veranstaltungen und Beschlüsse auf „Suchen“ tippen.'}/>
      <Text accessibilityRole="header" style={s.sectionTitle}>Suchergebnisse</Text>
      {matches.length?<><Text style={s.sectionSubtitle}>App-Bereiche</Text>
      {matches.map(route=><AreaCard key={route.id} route={route} onNavigate={onNavigate} query={needle}/>)}</>:null}
      {places.length?<><Text style={s.sectionSubtitle}>Orte aus der Familienkarte</Text>
      {places.map(hit=><Pressable key={hit.id} accessibilityRole="button" accessibilityLabel={hit.title+' auf der Familienkarte öffnen'} onPress={()=>onNavigate('map','',hit.place.id)} style={s.areaRow}>
        <View style={s.areaAccent}/><View style={{flex:1}}><Text style={s.areaTitle}>{hit.title}</Text><Text style={s.areaSubtitle}>{hit.subtitle}</Text></View><Text style={s.areaArrow}>›</Text>
      </Pressable>)}</>:null}
      {topicMatches.length?<><Text style={s.sectionSubtitle}>Familienratgeber</Text>
        {topicMatches.map(item=><Pressable key={item.id} accessibilityRole="button"
          onPress={()=>onNavigate('guide',needle)} style={s.areaRow}>
          <View style={s.areaAccent}/><View style={{flex:1}}><Text style={s.areaTitle}>{item.title}</Text>
          <Text style={s.areaSubtitle}>{item.short}</Text></View><Text style={s.areaArrow}>›</Text>
        </Pressable>)}</>:null}
      {inclusionMatches.length?<><Text style={s.sectionSubtitle}>Inklusion & Teilhabe</Text>
        {inclusionMatches.map(item=><Pressable key={item.id} accessibilityRole="button"
          onPress={()=>onNavigate('inclusion',needle)} style={s.areaRow}>
          <View style={s.areaAccent}/><View style={{flex:1}}><Text style={s.areaTitle}>{item.title}</Text>
          <Text style={s.areaSubtitle}>{item.short}</Text></View><Text style={s.areaArrow}>›</Text>
        </Pressable>)}</>:null}
      {healthMatches.length?<><Text style={s.sectionSubtitle}>Sport, Gesundheit & offizielle Quellen</Text>
        {healthMatches.map(resource=><Pressable key={resource.id} accessibilityRole="button"
          accessibilityLabel={resource.title+' im Sportbereich finden'}
          onPress={()=>onNavigate('healthy',needle)} style={s.areaRow}>
          <View style={s.areaAccent}/><View style={{flex:1}}>
            <Text style={s.areaTitle}>{resource.title}</Text>
            <Text style={s.areaSubtitle}>{resource.source} · {resource.region}</Text>
          </View><Text style={s.areaArrow}>›</Text></Pressable>)}</>:null}
      {visibleSearch?.decisions?.length?<View style={s.offerGroup}>
        <Text accessibilityRole="header" style={s.offerHeading}>Amtliche Beschlüsse</Text>
        {visibleSearch.decisions.map(item=><Pressable key={item.id} accessibilityRole="button"
          accessibilityLabel={item.title+' im Beschlussmonitor öffnen'}
          onPress={()=>onNavigate('decisions','',item.id)} style={s.offerItem}>
          <Text style={s.offerTitle}>{item.title}</Text>
          <Text style={s.mutedSmall}>{item.source_name} · {({kabinett:'Kabinettsbeschluss',parlament:'Parlamentsbeschluss',vermittlung:'Vermittlungsverfahren',vereinbarung:'Politische Vereinbarung',verkuendet:'Amtlich verkündet',inkraft:'In Kraft',unklar:'Verfahrensstand offen'}[item.decision_status]||'Verfahrensstand offen')}</Text>
        </Pressable>)}
      </View>:null}
      {visibleSearch?.officialError?<Text style={s.mutedSmall}>Offizielle Veranstaltungstermine konnten nicht geladen werden.</Text>:null}
      {visibleSearch?.officialEvents?.length?<View style={s.offerGroup}>
        <Text accessibilityRole="header" style={s.offerHeading}>Offizielle Familienveranstaltungen</Text>
        {visibleSearch.officialEvents.map(event=><Pressable key={event.id} accessibilityRole="button"
          accessibilityLabel={event.title+' im Veranstaltungskalender öffnen'}
          onPress={()=>onNavigate('events','',event.id)} style={s.offerItem}>
          <Text style={s.offerTitle}>{event.title}</Text>
          <Text style={s.mutedSmall}>{event.city||'Brandenburg'} · {event.source_name||'Offizieller Veranstalter'}</Text>
          <Text style={s.offerPrice}>{event.start_date}</Text>
        </Pressable>)}
      </View>:null}
      {visibleSearch?.eventsError?<Text style={s.mutedSmall}>Veranstaltungen konnten gerade nicht geladen werden.</Text>:null}
      {visibleSearch?.events&&!visibleSearch.eventsError?<View style={s.offerGroup}>
        <Text accessibilityRole="header" style={s.offerHeading}>Anstehende Veranstaltungen</Text>
        {visibleSearch.events.length?visibleSearch.events.map(event=><Pressable key={event.kind+event.id} accessibilityRole="button" accessibilityLabel={event.title+' öffnen'} onPress={()=>onNavigate(event.kind==='family'?'events':'partners','',event.id)} style={s.offerItem}>
          <Text style={s.offerTitle}>{event.title}</Text><Text style={s.mutedSmall}>{event.kind==='family'?'Familientreffen':'Partnerveranstaltung'} · {event.region_label||'Region nach Absprache'}</Text><Text style={s.offerPrice}>{new Date(event.starts_at).toLocaleString('de-DE',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</Text>
        </Pressable>):<Text style={s.mutedSmall}>Keine passenden bevorstehenden Veranstaltungen gefunden.</Text>}
      </View>:null}
      {visibleSearch?.offersError?<Text style={s.mutedSmall}>Basar-Treffer konnten gerade nicht geladen werden.</Text>:null}
      {visibleSearch?.offers?<View style={s.offerGroup}>
        <Text style={s.offerHeading}>Freigegebene Basar-Angebote (Vorschau)</Text>
        {visibleSearch.offers.length?visibleSearch.offers.map(offer=><Pressable key={offer.id} accessibilityRole="button" accessibilityLabel={offer.title+' im Basar suchen'} onPress={()=>onNavigate('market',needle)} style={s.offerItem}>
          <Text style={s.offerTitle}>{offer.title}</Text><Text style={s.offerPrice}>{offer.price}</Text>
        </Pressable>):<Text style={s.mutedSmall}>Keine passenden freigegebenen Angebote gefunden.</Text>}
        <Pressable accessibilityRole="button" onPress={()=>onNavigate('market',needle)} style={s.answerAction}><Text style={s.answerActionLabel}>Alle Basar-Ergebnisse ansehen ›</Text></Pressable>
      </View>:null}
      {!matches.length&&!places.length&&!healthMatches.length&&!topicMatches.length&&!inclusionMatches.length&&!visibleSearch&&!searchBusy?<Text style={s.empty}>Keine direkten Treffer. Tippe auf „Antwort finden“ oder ändere die Suchbegriffe.</Text>:null}
      {marketIntent&&!visibleSearch&&!searchBusy?<Text style={s.mutedSmall}>Tippe auf „Suchen“, um aktuelle Basar-Angebote und Termine abzurufen.</Text>:null}
    </View>:null}
    {!needle?<View style={s.welcomeSection}>
      <Text style={s.welcomeEyebrow}>EURE FAMILIENWELT</Text>
      <Text accessibilityRole="header" style={s.welcomeTitle}>{homeGreeting(profile)}</Text>
      <Text style={s.welcomeSubtitle}>Entdeckt, was euch als Familie heute Freude macht.</Text>
      {typeof inboxUnread==='number'&&inboxUnread>0?
        <Pressable accessibilityRole="button" accessibilityLabel={inboxUnread+' ungelesene Neuigkeiten öffnen'}
          onPress={()=>onNavigate('inbox')} style={s.inboxCallout}>
          <View style={s.calloutIcon}><FamilyIcon name="bell" size={21}/></View>
          <View style={{flex:1}}>
            <Text style={s.calloutTitle}>{inboxUnread} ungelesene {inboxUnread===1?'Neuigkeit':'Neuigkeiten'}</Text>
            <Text style={s.calloutSubtitle}>Schaut nach, was es Neues gibt.</Text>
          </View>
          <FamilyIcon name="chevron-right" size={19}/>
        </Pressable>:null}
      {profileStep?<Pressable accessibilityRole="button"
        accessibilityLabel={profileStep.title+' im Familienprofil'}
        onPress={()=>onNavigate('profile')} style={s.profilePrompt}>
        <FamilyIcon name="users" size={22}/>
        <View style={{flex:1}}>
          <Text style={s.promptTitle}>{profileStep.title}</Text>
          <Text style={s.promptSubtitle}>{profileStep.detail}</Text>
        </View>
        <FamilyIcon name="chevron-right" size={18}/>
      </Pressable>:null}
    </View>:null}
    {!needle?<GentleReveal delay={110} distance={12} style={s.quickActionSection}>
      <Text accessibilityRole="header" style={s.sectionTitle}>Was möchtest du heute machen?</Text>
      <Text style={s.sectionSubtitle}>Ein Tipp genügt. Familienfunke öffnet direkt den passenden Bereich.</Text>
      <View style={[s.quickActions,singleColumn&&{flexDirection:'column'}]}>
        {[
          {id:active?'sell':'profile',icon:'bag',title:active?'Anzeige erstellen':'Profil vervollständigen',hint:active?'Kinderartikel kostenlos und sofort anbieten.':'Für das Inserieren ist ein freigegebenes Profil nötig.'},
          {id:'chat',icon:'message',title:'Nachrichten',hint:'Private Unterhaltungen mit bestätigten Kontakten.'},
          {id:'events',icon:'calendar',title:'Treffen planen',hint:'Familientermin vorschlagen und organisieren.'}
        ].map(item=><Pressable key={item.title} accessibilityRole="button"
          accessibilityLabel={item.title+' öffnen'} accessibilityHint={item.hint}
          onPress={()=>onNavigate(item.id)} style={({pressed})=>[s.quickTile,pressed&&s.quickTilePress]}>
          <View style={s.quickIcon}><FamilyIcon name={item.icon} size={22} color={C.accentDark}/></View>
          <Text style={s.quickTitle}>{item.title}</Text>
          <Text style={s.quickHint}>{item.hint}</Text>
          <Text style={s.quickOpen}>Öffnen ›</Text>
        </Pressable>)}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Meine Anzeigen öffnen"
        accessibilityHint="Eigene Angebote, Entwürfe und den Veröffentlichungsstatus ansehen"
        onPress={()=>onNavigate('myListings')}
        style={({pressed})=>[s.myListingsLink,pressed&&{backgroundColor:C.sunPale}]}>
        <View style={s.myListingsIcon}><FamilyIcon name="bag" size={21} color={C.accentDark}/></View>
        <View style={{flex:1}}>
          <Text style={s.myListingsTitle}>Meine Anzeigen</Text>
          <Text style={s.myListingsSub}>Entwürfe, veröffentlichte Angebote und Verkäufe</Text>
        </View>
        <FamilyIcon name="chevron-right" size={20} color={C.accentDark}/>
      </Pressable>
      <ContextHelp title="Was passiert, wenn ich etwas einstelle?">
        Anzeigen im Familienbasar werden nach dem Hochladen grundsätzlich direkt sichtbar. Mitglieder können problematische Angebote melden. Persönliche Gespräche bleiben privat; Veranstaltungen und manche anderen Inhalte werden weiterhin separat geprüft.
      </ContextHelp>
    </GentleReveal>:null}
    {!needle?<View style={s.section}>
      <FamilySectionTitle title="Direkt zu" subtitle="Eure beliebtesten Wege durch Familienfunke"/>

      <Animated.View style={[s.featuredGrid,singleColumn&&{flexDirection:'column'},
        {transform:[{translateY:reducedMotion?0:scrollY.interpolate({
          inputRange:[0,250,650],outputRange:[9,0,-7],extrapolate:'clamp'})}]}]}>
        {featured.map(route=><AreaCard key={route.id} route={route} onNavigate={onNavigate} query="" compact={!singleColumn}/>)}
      </Animated.View>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:showAll}} onPress={()=>setShowAll(v=>!v)} style={s.allAction}>
        <Text style={s.allActionLabel}>{showAll?'Weniger Bereiche anzeigen':'Alle Bereiche entdecken'}</Text><Text style={s.allActionLabel}>{showAll?'⌃':'⌄'}</Text>
      </Pressable>
      {showAll?moreRoutes.map(route=><AreaCard key={route.id} route={route} onNavigate={onNavigate} query=""/>):null}
      <Pressable accessibilityRole="button" accessibilityLabel="Familienquiz und Spielideen öffnen" onPress={()=>onNavigate('play')} style={s.outingCard}>
        <View style={{flex:1}}><Text style={s.outingTitle}>Familienzeit</Text><Text style={s.outingSubtitle}>Eine kurze Quizrunde oder eine Idee zum gemeinsamen Spielen.</Text><Text style={s.outingLink}>Quiz & Spielideen öffnen ›</Text></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Persönlichen Familienausflug planen" onPress={()=>onNavigate('outing')} style={s.outingCard}>
        <View style={{flex:1}}><Text style={s.outingTitle}>Familienausflug planen</Text><Text style={s.outingSubtitle}>Passende Ziele nach Alter, Budget und Entfernung.</Text><Text style={s.outingLink}>Ausflugsplaner öffnen ›</Text></View>
      </Pressable>
    </View>:null}
    {!needle?<View style={s.section}>
      <View style={s.personalSection}>
        <FamilySectionTitle title={region?'Ideen für eure Region':'Ausflüge zum Entdecken'}
          subtitle={region?'Aus der Familienkarte, nach eurer Region und euren Interessen sortiert':'Redaktionell ausgewählte Orte aus der Familienkarte'}
          actionLabel="Karte öffnen" onAction={()=>onNavigate('map')}/>
        <View style={s.placesList}>
          {suggestedPlaces.map(({place,isLocal})=>
            <Pressable key={place.id} accessibilityRole="button"
              accessibilityLabel={place.title+' auf der Familienkarte öffnen'}
              onPress={()=>onNavigate('map','',place.id)} style={s.placeCard}>
              <View style={s.placeIcon}><FamilyIcon name="compass" size={24}/></View>
              <View style={{flex:1}}>
                <Text style={s.placeTitle} numberOfLines={2}>{place.title}</Text>
                <Text style={s.placeSubtitle} numberOfLines={2}>
                  {isLocal?'Eure Region · ':'Aus der Familienkarte · '}{place.region_label}
                </Text>
                <Text style={s.placeDescription} numberOfLines={2}>{place.description}</Text>
              </View>
              <FamilyIcon name="chevron-right" size={19}/>
            </Pressable>)}
        </View>
        {suggestedPlaces.length===0?
          <FamilyEmptyState title="Hier entstehen eure Ausflugsideen"
            description="Die Familienkarte enthält Orte und Ausflugsziele zum Stöbern."
            icon="compass" actionLabel="Familienkarte ansehen"
            onAction={()=>onNavigate('map')} compact/>:null}
      </View>
      {active?<Pressable accessibilityRole="button" accessibilityState={{expanded:showMoreFeed}}
        onPress={()=>setShowMoreFeed(v=>!v)} style={s.moreHighlights}>
        <Text style={s.moreHighlightsTitle}>{showMoreFeed?'Zusätzliche Empfehlungen schließen':'Weitere Empfehlungen für euch'}</Text>
        <Text style={s.moreHighlightsSub}>Neue Basarangebote und kommende Familientermine {showMoreFeed?'−':'+'}</Text>
      </Pressable>:null}
      {active&&showMoreFeed?<><View style={s.personalSection}>
        <FamilySectionTitle title="Frisch im Familienbasar"
          subtitle="Nur tatsächlich freigegebene Angebote"
          actionLabel="Zum Basar" onAction={()=>onNavigate('market')}/>
        {feedLoading?<FamilySkeleton rows={2} label="Basarangebote werden geladen"/>:
         homeFeed.offers===null?
           <FamilyEmptyState title="Angebote gerade nicht erreichbar"
             description="Die übrigen App-Bereiche bleiben nutzbar."
             icon="bag" actionLabel="Noch einmal versuchen"
             onAction={()=>setFeedRetry(n=>n+1)} compact/>:
         homeFeed.offers.length?homeFeed.offers.map(offer=>
           <Pressable key={offer.id} accessibilityRole="button"
             accessibilityLabel={offer.title+' im Basar öffnen'}
             onPress={()=>onNavigate('market','',offer.id)} style={s.feedCard}>
             <View style={s.feedIcon}><FamilyIcon name="bag" size={24}/></View>
             <View style={{flex:1}}>
               <Text style={s.feedTitle} numberOfLines={2}>{offer.title}</Text>
               <Text style={s.feedMeta} numberOfLines={1}>{offer.category} · {offer.region_label||'Region auf Anfrage'}</Text>
             </View>
             <Text style={s.feedPrice} numberOfLines={1}>
               {offer.trade_type==='gift'?'Gratis':offer.trade_type==='swap'?'Tausch':
                 (Number(offer.price_cents||0)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'})}
             </Text>
           </Pressable>):
           <FamilyEmptyState title="Noch keine freigegebenen Angebote"
             description="Sobald passende Inserate veröffentlicht sind, erscheinen sie hier."
             icon="bag" actionLabel="Familienbasar entdecken"
             onAction={()=>onNavigate('market')} compact/>}
      </View>
      <View style={s.personalSection}>
        <FamilySectionTitle title="Demnächst gemeinsam"
          subtitle="Bevorstehende Familientreffen und Veranstaltungen"
          actionLabel="Alle Termine" onAction={()=>onNavigate('events')}/>
        {feedLoading?<FamilySkeleton rows={1} label="Termine werden geladen"/>:
         homeFeed.events===null?
         <FamilyEmptyState title="Termine nicht abrufbar"
           description="Du kannst den Veranstaltungskalender weiterhin öffnen."
           icon="calendar" actionLabel="Erneut laden" onAction={()=>setFeedRetry(n=>n+1)} compact/>:
         homeFeed.events.length?homeFeed.events.map(event=>
           <Pressable key={event.kind+event.id} accessibilityRole="button"
             accessibilityLabel={event.title+' öffnen'}
             onPress={()=>onNavigate(event.kind==='family'?'events':'partners','',event.id)}
             style={s.feedCard}>
             <View style={s.feedIcon}><FamilyIcon name="calendar" size={24}/></View>
             <View style={{flex:1}}>
               <Text style={s.feedTitle} numberOfLines={2}>{event.title}</Text>
               <Text style={s.feedMeta} numberOfLines={1}>{event.region_label||'Region auf Anfrage'}</Text>
               <Text style={s.feedDate}>
                 {new Date(event.starts_at).toLocaleDateString('de-DE',{day:'2-digit',month:'short',year:'numeric'})}
               </Text>
             </View>
             <FamilyIcon name="chevron-right" size={18}/>
           </Pressable>):
         <FamilyEmptyState title="Noch keine anstehenden Termine"
           description="Bis neue Veranstaltungen freigegeben werden, findet ihr im Ausflugsplaner weitere Ideen."
           icon="calendar" actionLabel="Ausflugsplaner öffnen" onAction={()=>onNavigate('outing')} compact/>}
      </View></>:null}
    </View>:null}
    {!needle?<View style={s.section}>
      <View style={s.answerInfoRow}>
        <Text accessibilityRole="header" style={s.sectionTitle}>Fragen an Familienfunke</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Wissenssuche erklären"
          accessibilityState={{expanded:showAnswerInfo}} onPress={()=>setShowAnswerInfo(v=>!v)} style={s.infoBubble}>
          <Text style={s.infoBubbleText}>i</Text>
        </Pressable>
      </View>
      {showAnswerInfo?<Text style={s.infoText}>Die Antworten stammen aus unseren Ratgebern. Aktuelle Ansprüche und Termine werden nicht automatisch geprüft.</Text>:null}
      <Text style={s.sectionSubtitle}>Wähle ein Thema und tippe auf eine Frage. Die Antwort kommt direkt aus unserer Wissensdatenbank.</Text>
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.topicGroupList}>
        {KNOWLEDGE_PROMPTS.map(group=><Pressable key={group.title} accessibilityRole="button"
          accessibilityState={{selected:selectedTopicGroup===group.title}}
          onPress={()=>setSelectedTopicGroup(group.title)}
          style={[s.topicGroupChip,selectedTopicGroup===group.title&&s.topicGroupSelected]}>
          <Text style={[s.topicGroupText,selectedTopicGroup===group.title&&s.topicGroupSelectedText]}>{group.title}</Text>
        </Pressable>)}
      </ScrollView>
      <View style={s.suggestionList}>
        {(KNOWLEDGE_PROMPTS.find(g=>g.title===selectedTopicGroup)?.questions||[]).map(topic=>
          <Pressable key={topic} accessibilityRole="button"
            accessibilityLabel={'Frage beantworten: '+topic}
            onPress={()=>askSuggested(topic)} style={({pressed})=>[s.suggestion,pressed&&s.pressed]}>
            <Text style={s.suggestionText}>{topic}</Text>
            <Text style={s.suggestionArrow}>›</Text>
          </Pressable>)}
      </View>
    </View>:null}
    <Text style={s.disclaimer}>
      Dieser Wissensassistent nutzt redaktionelle Inhalte und offizielle Quellen – ohne KI-API.
      Er beantwortet nur erfasste Themen, prüft keine aktuelle Rechtslage oder Öffnungszeiten und
      speichert deine Fragen nicht auf einem Server. Bitte gib keine sensiblen Informationen ein.
    </Text>
  </Animated.ScrollView>;
}
const s=StyleSheet.create({
  page:{flex:1,backgroundColor:C.bg},
  content:{paddingHorizontal:18,paddingTop:14,paddingBottom:45},
  searchCenter:{alignItems:'center',paddingVertical:12,marginBottom:12},
  searchCenterIdle:{paddingTop:14,paddingBottom:13},
  wordmark:{fontSize:31,fontWeight:'800',letterSpacing:-1.1,color:C.ink,textAlign:'center',marginTop:6},
  tagline:{fontSize:15,color:C.muted,textAlign:'center',marginTop:5,marginBottom:18},
  sunWrap:{width:54,height:54,alignItems:'center',justifyContent:'center'},
  sunCore:{position:'absolute',width:28,height:28,borderRadius:14,backgroundColor:'#F5B644'},
  ray:{position:'absolute',height:9,width:2.5,borderRadius:2,backgroundColor:'#E8A942'},
  eyebrow:{fontWeight:'900',fontSize:12,letterSpacing:1.8,color:'#845721',marginBottom:15},
  heroTitle:{color:C.ink,fontSize:29,fontWeight:'900',lineHeight:35,maxWidth:'82%',letterSpacing:-.6},
  heroSubtitle:{color:'#66512F',fontSize:15,lineHeight:21,marginTop:11,maxWidth:'80%'},
  searchCard:{borderRadius:22,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,
    padding:16,marginBottom:24},
  searchTitle:{fontSize:19,fontWeight:'900',color:C.ink},
  searchHint:{fontSize:13.5,lineHeight:19,color:C.muted,marginTop:14,textAlign:'center'},
  instantResults:{width:'100%',maxWidth:680,marginTop:14,padding:12,borderRadius:18,
    borderWidth:1.5,borderColor:C.accentDark,backgroundColor:C.paper},
  instantTitle:{fontSize:15,fontWeight:'900',color:C.accentDark,marginBottom:8},
  inputShell:{width:'100%',maxWidth:680,flexDirection:'row',alignItems:'center',minHeight:58,borderWidth:1.5,
    borderColor:'#ADC6BE',borderRadius:30,backgroundColor:C.paper,paddingHorizontal:15},
  searchGlyph:{fontSize:29,color:C.tealDark,marginRight:7,marginTop:-5},
  input:{flex:1,minHeight:51,paddingVertical:10,fontSize:15,color:C.ink},
  clear:{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',paddingHorizontal:9,paddingVertical:5},
  clearText:{color:C.muted,fontSize:24},
  searchActions:{width:'100%',maxWidth:680,marginTop:14,flexDirection:'row',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:10},
  askButton:{backgroundColor:C.teal,alignItems:'center',justifyContent:'center',
    minHeight:48,paddingHorizontal:24,borderRadius:24,flexDirection:'row'},
  askButtonLabel:{color:'#FFFFFF',fontWeight:'900',fontSize:15},
  disabled:{opacity:.52},
  directButton:{borderColor:'#D7E7E0',borderWidth:1,backgroundColor:C.paper,
    borderRadius:23,minHeight:48,justifyContent:'center',paddingHorizontal:24},
  directLabel:{color:C.tealDark,fontSize:13.5,fontWeight:'800',textAlign:'center'},
  directHint:{color:C.muted,fontSize:12.5,flex:1,lineHeight:17},
  error:{color:C.danger,fontSize:13,lineHeight:19,marginTop:12},
  areaIcon:{width:37,height:37,borderRadius:13,backgroundColor:C.sunPale,alignItems:'center',
    justifyContent:'center',marginBottom:8},
  myListingsLink:{flexDirection:'row',alignItems:'center',gap:10,minHeight:61,
    paddingVertical:9,paddingHorizontal:12,marginTop:10,borderWidth:1,
    borderColor:'#BFD5CF',borderRadius:16,backgroundColor:C.paper},
  myListingsIcon:{width:38,height:38,alignItems:'center',justifyContent:'center',
    backgroundColor:C.mint,borderRadius:12},
  myListingsTitle:{fontSize:15,fontWeight:'900',color:C.ink},
  myListingsSub:{fontSize:12.5,lineHeight:17,color:C.muted,marginTop:3},
  quickActionSection:{marginBottom:23,marginTop:4},
  quickActions:{flexDirection:'row',gap:9,justifyContent:'space-between'},
  quickTile:{flex:1,minWidth:0,backgroundColor:C.paper,borderWidth:1,
    borderColor:'#BED8CF',borderRadius:18,padding:12,minHeight:154},
  quickTilePress:{transform:[{scale:.98}],backgroundColor:'#EDF8EF'},
  quickIcon:{width:42,height:42,backgroundColor:'#E3F2E9',borderRadius:14,
    alignItems:'center',justifyContent:'center',marginBottom:8},
  quickTitle:{fontSize:14.5,fontWeight:'900',color:C.ink,lineHeight:19},
  quickHint:{fontSize:12.5,color:C.muted,lineHeight:17,marginTop:6,flex:1},
  quickOpen:{fontSize:13.5,color:C.accentDark,fontWeight:'900',marginTop:10},
  welcomeSection:{backgroundColor:C.sunPale,borderRadius:21,padding:18,marginBottom:21},
  welcomeEyebrow:{fontSize:10.5,letterSpacing:1.3,fontWeight:'800',color:'#6C4A18'},
  welcomeTitle:{fontSize:24,fontWeight:'800',letterSpacing:-0.5,color:C.ink,marginTop:5},
  welcomeSubtitle:{fontSize:14,lineHeight:21,color:C.ink,marginTop:5,marginBottom:5},
  inboxCallout:{backgroundColor:C.paper,borderRadius:15,minHeight:62,
    marginTop:12,padding:12,flexDirection:'row',alignItems:'center',gap:10},
  calloutIcon:{width:37,height:37,borderRadius:12,backgroundColor:C.sunPale,
    alignItems:'center',justifyContent:'center'},
  calloutTitle:{fontSize:14,fontWeight:'800',color:C.ink},
  calloutSubtitle:{fontSize:14,color:C.muted,marginTop:3},
  profilePrompt:{backgroundColor:C.paper,borderRadius:15,padding:12,
    marginTop:11,flexDirection:'row',alignItems:'center',gap:10},
  promptTitle:{fontSize:14,fontWeight:'800',color:C.ink},
  promptSubtitle:{fontSize:14,lineHeight:17,color:C.muted,marginTop:3},
  personalSection:{marginTop:18,marginBottom:6},
  placesList:{gap:9},
  placeCard:{backgroundColor:C.paper,borderWidth:1,borderColor:C.line,
    borderRadius:17,padding:12,minHeight:94,flexDirection:'row',alignItems:'center',gap:10},
  placeIcon:{width:54,height:54,backgroundColor:C.mint,borderRadius:15,
    alignItems:'center',justifyContent:'center'},
  placeTitle:{fontSize:15,fontWeight:'800',color:C.ink},
  placeSubtitle:{fontSize:14,color:C.accentDark,marginTop:3,fontWeight:'700'},
  placeDescription:{fontSize:14,lineHeight:17,color:C.muted,marginTop:3},
  feedCard:{backgroundColor:C.paper,borderWidth:1,borderColor:C.line,
    borderRadius:16,padding:12,flexDirection:'row',alignItems:'center',
    gap:10,minHeight:80,marginBottom:9},
  feedIcon:{width:46,height:46,backgroundColor:C.sunPale,borderRadius:14,
    alignItems:'center',justifyContent:'center'},
  feedTitle:{fontSize:14,fontWeight:'800',color:C.ink},
  feedMeta:{fontSize:14,color:C.muted,marginTop:3},
  feedPrice:{fontSize:15,color:C.accentDark,fontWeight:'800',maxWidth:95,textAlign:'right'},
  feedDate:{fontSize:14,color:C.accentDark,marginTop:3,fontWeight:'700'},
  moreHighlights:{minHeight:64,backgroundColor:C.sunPale,borderRadius:17,padding:15,justifyContent:'center',marginTop:12,marginBottom:18},
  moreHighlightsTitle:{fontSize:16,fontWeight:'800',color:C.ink},
  moreHighlightsSub:{fontSize:14,color:C.accentDark,marginTop:4},
  section:{marginBottom:22},
  sectionTitle:{color:C.ink,fontWeight:'900',fontSize:19,marginBottom:4},
  sectionSubtitle:{color:C.muted,fontSize:14,lineHeight:19,marginBottom:12},
  featuredGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10},
  areaGrid:{width:'48.4%',minHeight:114,backgroundColor:C.paper,borderColor:C.line,
    borderWidth:1,borderRadius:19,padding:14,justifyContent:'space-between'},
  areaGridAccent:{width:29,height:5,borderRadius:5,backgroundColor:C.sun,marginBottom:10},
  areaRow:{backgroundColor:C.paper,borderRadius:16,borderWidth:1,borderColor:C.line,
    paddingHorizontal:15,paddingVertical:14,marginBottom:9,flexDirection:'row',alignItems:'center'},
  areaAccent:{width:5,height:39,borderRadius:4,backgroundColor:C.sun,marginRight:12},
  areaTitle:{color:C.ink,fontSize:15.5,fontWeight:'900',lineHeight:20},
  areaSubtitle:{fontSize:14,lineHeight:18,color:C.muted,marginTop:5},
  areaArrow:{fontSize:23,color:C.tealDark,alignSelf:'flex-end',marginLeft:6},
  allAction:{minHeight:47,flexDirection:'row',alignItems:'center',
    justifyContent:'space-between',paddingHorizontal:15,marginTop:12,
    backgroundColor:C.sunPale,borderRadius:14},
  allActionLabel:{color:'#6C4A18',fontSize:14,fontWeight:'800'},
  replyHeader:{flexDirection:'row',justifyContent:'space-between',
    alignItems:'center',marginBottom:10},
  clearHistory:{padding:8,minHeight:44,justifyContent:'center'},
  clearHistoryLabel:{fontSize:12.5,color:C.tealDark,fontWeight:'800'},
  answerCard:{padding:17,borderRadius:20,backgroundColor:'#F3FBF6',
    borderColor:'#B6DBCB',borderWidth:1,marginBottom:11},
  answerCardNewest:{borderColor:C.teal,borderWidth:2,backgroundColor:'#EDF8F0',
    shadowColor:C.teal,shadowOpacity:.1,shadowRadius:11,elevation:3},
  replySectionTitle:{fontSize:21,fontWeight:'900',color:C.accentDark,marginBottom:6},
  answerHeadingRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},
  answerIconBadge:{height:32,width:32,borderRadius:12,backgroundColor:'#D7EDE0',
    alignItems:'center',justifyContent:'center'},
  answerOrigin:{fontSize:12.5,color:C.muted,marginTop:10},
  answerInfoRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},
  infoBubble:{minWidth:44,minHeight:44,justifyContent:'center',alignItems:'center',
    backgroundColor:C.sunPale,borderRadius:22},
  infoBubbleText:{fontSize:19,fontWeight:'900',color:C.accentDark},
  infoText:{color:C.ink,fontSize:14,lineHeight:21,padding:12,marginBottom:10,
    backgroundColor:C.mint,borderRadius:13},
  youLabel:{fontSize:10,fontWeight:'900',letterSpacing:.9,color:C.muted},
  questionText:{color:C.ink,fontSize:14.5,fontWeight:'700',marginTop:5,lineHeight:21},
  answerDivider:{height:1,backgroundColor:C.line,marginVertical:13},
  assistantLabel:{color:C.tealDark,fontSize:14,fontWeight:'900',letterSpacing:.7},
  answerText:{color:C.ink,fontSize:17,fontWeight:'700',lineHeight:27,marginTop:10},
  offerGroup:{marginTop:15,backgroundColor:'#FCFAF5',borderRadius:13,padding:12},
  offerHeading:{fontSize:15,fontWeight:'900',color:C.ink,marginBottom:7},
  offerItem:{minHeight:44,paddingVertical:9,borderTopWidth:1,borderTopColor:C.line},
  offerTitle:{fontSize:15,fontWeight:'800',color:C.ink},
  offerPrice:{fontSize:13,color:C.tealDark,fontWeight:'800',marginTop:4},
  mutedSmall:{fontSize:14,lineHeight:18,color:C.muted,marginTop:3},
  answerAction:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',
    backgroundColor:C.mint,borderRadius:12,paddingHorizontal:14,minHeight:44,marginTop:14},
  answerActionLabel:{color:C.tealDark,fontSize:13.5,fontWeight:'900'},
  empty:{fontSize:13.5,lineHeight:21,color:C.muted,padding:12},
  suggestionList:{gap:8,marginTop:9},
  suggestion:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    paddingHorizontal:15,borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.paper},
  suggestionText:{color:C.ink,fontSize:13.5,fontWeight:'700'},
  suggestionArrow:{fontSize:23,color:C.tealDark},
  disclaimer:{fontSize:14,lineHeight:18,color:C.muted,marginTop:1},
  outingCard:{backgroundColor:C.mint,borderColor:C.line,borderWidth:1,borderRadius:22,padding:16,marginTop:12,minHeight:48,flexDirection:'row',alignItems:'center'},
  outingTitle:{fontSize:19,fontWeight:'900',color:C.ink},outingSubtitle:{fontSize:14,lineHeight:21,color:C.ink,marginTop:6},outingLink:{fontSize:14,fontWeight:'900',color:C.accentDark,marginTop:12},
  related:{marginTop:14,gap:7},
  relatedTitle:{fontWeight:'800',fontSize:14,color:C.ink},
  relatedButton:{minHeight:44,padding:10,borderWidth:1,borderColor:C.line,
    borderRadius:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  relatedLabel:{flex:1,fontSize:14,color:C.accentDark,fontWeight:'700'},
  topicGroupList:{gap:9,paddingVertical:8,paddingRight:10},
  topicGroupChip:{minHeight:44,justifyContent:'center',paddingHorizontal:14,
    borderRadius:20,backgroundColor:C.paper,borderColor:C.line,borderWidth:1},
  topicGroupSelected:{backgroundColor:C.teal,borderColor:C.teal},
  topicGroupText:{color:C.accentDark,fontWeight:'800',fontSize:13.5},
  topicGroupSelectedText:{color:C.white},
  pressed:{opacity:.72}
});
