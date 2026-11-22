import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {supabase} from './supabase';
import {useFamilyLocale} from './FamilyLocale';
import {localizedRoutes,englishRouteMatches,formatServiceMoney} from './FamilyLocaleModel';
import {marketSearchQuery} from './MarketLocaleSearch';
import {confirmRemoval} from './FamilyActions';
import FamilyVoiceSearch from './FamilyVoiceSearch';
import {FAMILY_COLORS} from './FamilyTheme';
import {HOME_ROUTES,findHomeRoutes,looksLikeMarketProductQuery} from './HomeNavigation';

import {findFamilyMapLocations} from './FamilyMapSearch';
import {CURATED_FAMILY_PLACES} from './FamilyMapCurated';
import {NATIONAL_FAMILY_PLACES} from './FamilyMapNational';

const C=FAMILY_COLORS;
import {DEFAULT_HOME} from './FamilyLayoutModel';
import HomeHighlights from './HomeHighlights';
const SUGGESTIONS=['Spielplätze finden','Kinderjeans Größe 110','Profil bearbeiten','Wie beschäftige ich Kinder bei Regen?'];
function SunMark(){
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.sunWrap}>
    {Array.from({length:8},(_,i)=><View key={i} style={[s.ray,{
      transform:[{rotate:(i*45)+'deg'},{translateY:-28}]
    }]}/>)}
    <View style={s.sunCore}/>
  </View>;
}
function AreaCard({route,onNavigate,query,compact=false}){
  const {language}=useFamilyLocale();
  const productSearch=route.id==='market'&&(looksLikeMarketProductQuery(query)||(language==='en'&&(englishRouteMatches(query,HOME_ROUTES)[0]?.id==='market'||looksLikeMarketProductQuery(marketSearchQuery(query,language)))));
  return <Pressable accessibilityRole="button"
    accessibilityLabel={language==='en'?'Open '+route.title:route.title+' öffnen'}
    onPress={()=>onNavigate(route.id,productSearch?query.trim():'')}
    style={({pressed})=>[compact?s.areaGrid:s.areaRow,pressed&&s.pressed]}>
    <View style={compact?s.areaGridAccent:s.areaAccent}/>
    <View style={{flex:1}}>
      <Text style={[s.areaTitle,compact&&{fontSize:15}]}>{route.title}</Text>
      <Text style={s.areaSubtitle}>{route.subtitle}</Text>
    </View>
    <Text style={s.areaArrow}>›</Text>
  </Pressable>;
}
function AssistantReply({entry,onNavigate}){
  const {t,language}=useFamilyLocale();
  return <View accessibilityLiveRegion="polite" style={s.answerCard}>
    <Text style={s.youLabel}>{t("DEINE FRAGE")}</Text>
    <Text style={s.questionText}>{entry.question}</Text>
    <View style={s.answerDivider}/>
    <Text style={s.assistantLabel}>{t("FAMILIENFUNKE HILFT")}</Text>
    <Text style={s.answerText}>{entry.answer}</Text>
    {entry.searchQuery&&!entry.offersError&&Array.isArray(entry.offers)?
      <View style={s.offerGroup}>
        <Text style={s.offerHeading}>{t("Tatsächlich freigegebene Angebote")}</Text>
        {entry.offers.length?entry.offers.map(offer=>
          <Pressable key={offer.id} accessibilityRole="button"
            accessibilityLabel={language==='en'?'Search marketplace for '+offer.title:offer.title+' im Basar suchen'}
            onPress={()=>onNavigate('market',entry.searchQuery)}
            style={s.offerItem}>
            <Text style={s.offerTitle}>{offer.title}</Text>
            {offer.matchItem?<Text style={s.mutedSmall}>{t('Passender Artikel: ')}{offer.matchItem}</Text>:null}
            <Text style={s.offerPrice}>{offer.price}</Text>
          </Pressable>
        ):<Text style={s.mutedSmall}>{t("Für diese Suche gibt es momentan keine freigegebenen Treffer.")}</Text>}
      </View>:null}
    {entry.searchQuery&&entry.offersError?
      <Text style={[s.mutedSmall,{marginTop:12}]}>{t("Treffer lassen sich gerade nicht laden. Die Suche im Basar ist weiterhin möglich.")}</Text>:null}
    {entry.pageId?<Pressable accessibilityRole="button"
      accessibilityLabel={t("Vorgeschlagenen App-Bereich öffnen")}
      onPress={()=>onNavigate(entry.pageId,entry.pageId==='market'?entry.searchQuery||entry.question:'')}
      style={({pressed})=>[s.answerAction,pressed&&s.pressed]}>
      <Text style={s.answerActionLabel}>{t(HOME_ROUTES.find(x=>x.id===entry.pageId)?.title||'Passenden Bereich öffnen')} ›</Text>
      
    </Pressable>:null}
  </View>;
}
export default function HomeAssistant({onNavigate,tileIds=DEFAULT_HOME,onCustomize,highlights=null}){
  const {t,language,locale}=useFamilyLocale();
  const {width:screenWidth,fontScale}=useWindowDimensions();
  const singleColumn=screenWidth<360||fontScale>=1.5;
  const [question,setQuestion]=useState('');
  const [conversation,setConversation]=useState([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [showAll,setShowAll]=useState(false);
  const scrollRef=useRef(null);
  const requestSeq=useRef(0),alive=useRef(true),pending=useRef(false);
  const [searchResult,setSearchResult]=useState(null);
  const [searchBusy,setSearchBusy]=useState(false);
  const [voiceBusy,setVoiceBusy]=useState(false);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;requestSeq.current++;};},[]);
  useEffect(()=>{requestSeq.current++;pending.current=false;setSearchResult(null);setSearchBusy(false);setBusy(false);setError('');},[language]);
  function updateQuestion(value){
    requestSeq.current++;pending.current=false;
    setQuestion(value);setSearchResult(null);setSearchBusy(false);setBusy(false);setError('');
  }
  const needle=question.trim();
  const englishMatches=language==='en'&&needle?englishRouteMatches(needle,HOME_ROUTES):[];
  const aliasMarket=language==='en'&&englishMatches[0]?.id!=='sell'&&looksLikeMarketProductQuery(marketSearchQuery(needle,language));
  const matches=localizedRoutes(language==='en'&&needle?[...(aliasMarket?HOME_ROUTES.filter(r=>r.id==='market'):[]),...englishMatches,...findHomeRoutes(needle)].filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i).slice(0,6):findHomeRoutes(needle),language);
  const places=needle.length>=2?findFamilyMapLocations(needle,{curated:CURATED_FAMILY_PLACES,national:NATIONAL_FAMILY_PLACES},4):[];
  const marketIntent=(language!=='en'||englishMatches[0]?.id!=='sell')&&(looksLikeMarketProductQuery(needle)||matches[0]?.id==='market');
  const visibleSearch=searchResult?.query===needle?searchResult:null;
  const featured=localizedRoutes(tileIds.map(id=>HOME_ROUTES.find(route=>route.id===id)).filter(Boolean),language);
  const moreRoutes=localizedRoutes(HOME_ROUTES,language);
  async function askAssistant(){
    const prompt=needle.slice(0,600);
    if(prompt.length<3||pending.current||voiceBusy)return;
    const request=++requestSeq.current;pending.current=true;Keyboard.dismiss();
    setBusy(true);setError('');
    try{
      const history=conversation.slice(0,3).reverse().flatMap(x=>[
        {role:'user',content:x.question},
        {role:'assistant',content:x.answer}
      ]);
      const {data,error:requestError}=await supabase.functions.invoke('ff-app-assistant',{
        body:{question:prompt,history,language}
      });
      if(requestError||typeof data?.answer!=='string'||!data.answer.trim()){
        const code=requestError?.context?.status;
        throw new Error(code===429
          ?t("Das heutige KI-Kontingent ist aufgebraucht. Die direkte Seitensuche bleibt nutzbar.")
          :t("Die KI ist vorübergehend nicht erreichbar. Du kannst die App-Bereiche weiterhin direkt öffnen."));
      }
      const route=HOME_ROUTES.find(x=>x.id===data.page_id);
      const searchQuery=route?.id==='market'&&typeof data?.search_query==='string'
        ?data.search_query.trim().slice(0,160):'';
      // Product previews are fetched separately from the secured database.
      // The assistant cannot claim that an offer exists.
      let offers=null,offersError=false;
      if(!alive.current||request!==requestSeq.current)return;
      if(searchQuery){
        try{
          const {data:rows,error:queryError}=await supabase.rpc('ff_market_search',{
            p_query:marketSearchQuery(searchQuery,language),p_category:'Alle',p_trade_type:'all',
            p_sort:'relevance',p_limit:3,p_offset:0
          });
          if(queryError||!Array.isArray(rows))offersError=true;
          else offers=rows.filter(row=>row?.listing?.moderation_status==='approved')
            .map(row=>({
              id:row.listing.id,
              title:String(row.listing.title||'').slice(0,100),
              matchItem:String(row.match_item||'').slice(0,150),
              price:row.listing.trade_type==='gift'?t("Zu verschenken")
                :row.listing.trade_type==='swap'?t("Tausch")
                :formatServiceMoney(row.listing.price_cents,language)
            }));
        }catch{offersError=true;}
      }
      if(!alive.current||request!==requestSeq.current)return;
      setConversation(old=>[{
        question:prompt,answer:data.answer.slice(0,1400),
        pageId:route?.id||'',searchQuery,offers,offersError
      },...old].slice(0,6));
      scrollRef.current?.scrollTo({y:0,animated:false});
      AccessibilityInfo.announceForAccessibility(t("Die KI-Antwort ist jetzt verfügbar."));
    }catch(e){if(alive.current&&request===requestSeq.current)setError(e?.message||t("Die KI ist gerade nicht erreichbar."));}
    finally{if(alive.current&&request===requestSeq.current){pending.current=false;setBusy(false);}}
  }
  async function searchApp(){
    const query=needle;
    if(query.length<2||pending.current||voiceBusy)return;
    Keyboard.dismiss();setError('');
    const request=++requestSeq.current;pending.current=true;setSearchBusy(true);
    try{
      // Searches run independently, so one unavailable service does not erase other results.
      const [eventResponse,marketResponse]=await Promise.allSettled([
        supabase.rpc('ff_search_events',{p_query:query.slice(0,160)}),
        marketIntent?supabase.rpc('ff_market_search',{
          p_query:marketSearchQuery(query,language),p_category:'Alle',p_trade_type:'all',
          p_sort:'relevance',p_limit:5,p_offset:0
        }):Promise.resolve(null)
      ]);
      if(!alive.current||request!==requestSeq.current)return;
      const eventData=eventResponse.status==='fulfilled'?eventResponse.value:null;
      const marketData=marketResponse.status==='fulfilled'?marketResponse.value:null;
      const eventsError=!eventData||!!eventData.error||!Array.isArray(eventData.data);
      const events=eventsError?[]:eventData.data.filter(row=>['family','partner'].includes(row.kind)&&row.id&&new Date(row.starts_at)>new Date());
      const offersError=marketIntent&&(!marketData||!!marketData.error||!Array.isArray(marketData.data));
      const offers=marketIntent&&!offersError?marketData.data.filter(row=>row?.listing?.moderation_status==='approved').map(row=>({
        id:row.listing.id,title:String(row.listing.title||'').slice(0,100),
        price:row.listing.trade_type==='gift'?t("Zu verschenken"):row.listing.trade_type==='swap'?t("Tausch"):
          formatServiceMoney(row.listing.price_cents,language)
      })):null;
      setSearchResult({query,offers,events,eventsError,offersError});
      AccessibilityInfo.announceForAccessibility(language==='en'?events.length+' events and '+(offers?.length||0)+' marketplace results in preview.':events.length+' Veranstaltungstreffer und '+(offers?.length||0)+' Basar-Treffer in der Vorschau.');
    }catch{if(alive.current&&request===requestSeq.current)setError(t("Die Online-Suche konnte nicht geladen werden. App-Bereiche und Katalogorte bleiben verfügbar."));}
    finally{if(alive.current&&request===requestSeq.current){pending.current=false;setSearchBusy(false);}}
  }
  return <ScrollView ref={scrollRef} style={s.page} contentContainerStyle={s.content}
    keyboardShouldPersistTaps="handled">
    <View style={[s.searchCenter,!needle&&!conversation.length&&s.searchCenterIdle]}>
      <SunMark/>
      <Text accessibilityRole="header" style={s.wordmark}>Familienfunke<Text style={{color:C.coralDeep}}>.</Text></Text>
      <Text style={s.tagline}>{t("Finden. Fragen. Entdecken.")}</Text>
      <View style={s.inputShell}>
        <Text accessibilityElementsHidden importantForAccessibility="no" style={s.searchGlyph}>⌕</Text>
        <TextInput accessibilityLabel={t("Familienfunke durchsuchen oder eine KI-Frage eingeben")}
          style={s.input} value={question} onChangeText={updateQuestion} editable={!busy&&!searchBusy&&!voiceBusy}
          placeholder={t("Was möchtest du finden?")}
          placeholderTextColor={C.muted} maxLength={600}
          autoCapitalize="sentences" returnKeyType="search" onSubmitEditing={searchApp}/>
        {needle?<Pressable accessibilityRole="button" accessibilityLabel={t("Eingabe löschen")}
          disabled={voiceBusy} accessibilityState={{disabled:voiceBusy}} onPress={()=>updateQuestion('')} style={s.clear}><Text style={s.clearText}>×</Text></Pressable>:null}
      </View>
      <View style={[s.searchActions,singleColumn&&{flexDirection:'column',alignItems:'stretch'}]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("In Familienfunke suchen")}
          accessibilityState={{disabled:busy||searchBusy||voiceBusy||needle.length<2,busy:searchBusy}}
          disabled={busy||searchBusy||voiceBusy||needle.length<2} onPress={searchApp}
          style={[s.directButton,(busy||searchBusy||voiceBusy||needle.length<2)&&s.disabled]}>
          <Text style={s.directLabel}>{searchBusy?t("Suche läuft …"):t("Suchen")}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t("KI um Hilfe fragen")}
          accessibilityState={{disabled:busy||searchBusy||voiceBusy||needle.length<3,busy}}
          disabled={busy||searchBusy||voiceBusy||needle.length<3} onPress={askAssistant}
          style={[s.askButton,(busy||searchBusy||voiceBusy||needle.length<3)&&s.disabled]}>
          {busy?<ActivityIndicator color={C.white} style={{marginRight:8}}/>:null}
          <Text style={s.askButtonLabel}>{busy?t("KI antwortet …"):t("KI fragen")}</Text>
        </Pressable>
      </View>
      <FamilyVoiceSearch disabled={busy||searchBusy} onText={updateQuestion} onBusyChange={setVoiceBusy}/>
      <Text style={s.searchHint}>{t("App-Funktionen, Angebote, Orte und Veranstaltungen finden oder Fragen stellen. Du kannst auch über das Mikrofon deiner Tastatur diktieren, sofern dein Gerät dies unterstützt.")}</Text>
      {error?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={s.error}>{error}</Text>:null}
    </View>
    {needle?<View style={s.section}>
      <Text accessibilityRole="header" style={s.sectionTitle}>{t("Suchergebnisse")}</Text>
      {matches.length?<><Text style={s.sectionSubtitle}>{t("App-Bereiche")}</Text>
      {matches.map(route=><AreaCard key={route.id} route={route} onNavigate={onNavigate} query={needle}/>)}</>:null}
      {places.length?<><Text style={s.sectionSubtitle}>{t("Orte aus der Familienkarte")}</Text>
      {places.map(hit=><Pressable key={hit.id} accessibilityRole="button" accessibilityLabel={language==='en'?'Open '+hit.title+' on family map':hit.title+' auf der Familienkarte öffnen'} onPress={()=>onNavigate('map','',hit.place.id)} style={s.areaRow}>
        <View style={s.areaAccent}/><View style={{flex:1}}><Text style={s.areaTitle}>{hit.title}</Text><Text style={s.areaSubtitle}>{hit.subtitle}</Text></View><Text style={s.areaArrow}>›</Text>
      </Pressable>)}</>:null}
      {visibleSearch?.eventsError?<Text style={s.mutedSmall}>{t("Veranstaltungen konnten gerade nicht geladen werden.")}</Text>:null}
      {visibleSearch?.events&&!visibleSearch.eventsError?<View style={s.offerGroup}>
        <Text accessibilityRole="header" style={s.offerHeading}>{t("Anstehende Veranstaltungen")}</Text>
        {visibleSearch.events.length?visibleSearch.events.map(event=><Pressable key={event.kind+event.id} accessibilityRole="button" accessibilityLabel={language==='en'?'Open '+event.title:event.title+' öffnen'} onPress={()=>onNavigate(event.kind==='family'?'events':'partners','',event.id)} style={s.offerItem}>
          <Text style={s.offerTitle}>{event.title}</Text><Text style={s.mutedSmall}>{event.kind==='family'?t("Familientreffen"):t("Partnerveranstaltung")} · {event.region_label||t("Region nach Absprache")}</Text><Text style={s.offerPrice}>{new Date(event.starts_at).toLocaleString(locale,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</Text>
        </Pressable>):<Text style={s.mutedSmall}>{t("Keine passenden bevorstehenden Veranstaltungen gefunden.")}</Text>}
      </View>:null}
      {visibleSearch?.offersError?<Text style={s.mutedSmall}>{t("Basar-Treffer konnten gerade nicht geladen werden.")}</Text>:null}
      {visibleSearch?.offers?<View style={s.offerGroup}>
        <Text style={s.offerHeading}>{t("Freigegebene Basar-Angebote (Vorschau)")}</Text>
        {visibleSearch.offers.length?visibleSearch.offers.map(offer=><Pressable key={offer.id} accessibilityRole="button" accessibilityLabel={language==='en'?'Search marketplace for '+offer.title:offer.title+' im Basar suchen'} onPress={()=>onNavigate('market',needle)} style={s.offerItem}>
          <Text style={s.offerTitle}>{offer.title}</Text><Text style={s.offerPrice}>{offer.price}</Text>
        </Pressable>):<Text style={s.mutedSmall}>{t("Keine passenden freigegebenen Angebote gefunden.")}</Text>}
        <Pressable accessibilityRole="button" onPress={()=>onNavigate('market',needle)} style={s.answerAction}><Text style={s.answerActionLabel}>{t("Alle Basar-Ergebnisse ansehen ›")}</Text></Pressable>
      </View>:null}
      {!matches.length&&!places.length&&!visibleSearch&&!searchBusy?<Text style={s.empty}>{t("Keine direkten Treffer. Stelle deine Frage der KI oder ändere die Suche.")}</Text>:null}
      {marketIntent&&!visibleSearch&&!searchBusy?<Text style={s.mutedSmall}>{t("Tippe auf „Suchen“, um aktuelle Basar-Angebote und Termine abzurufen.")}</Text>:null}
    </View>:null}
    {conversation.length?<View style={s.section}>
      <View style={s.replyHeader}>
        <Text style={s.sectionTitle}>{t("Deine KI-Hilfe")}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t("KI-Verlauf in dieser Ansicht löschen")}
          onPress={()=>confirmRemoval({translate:t,title:t("KI-Verlauf leeren?"),description:t("Die Fragen und Antworten in dieser Ansicht werden entfernt."),confirmLabel:t("Verlauf leeren"),onConfirm:()=>{requestSeq.current++;pending.current=false;setBusy(false);setSearchBusy(false);setConversation([]);}})} style={s.clearHistory}>
          <Text style={s.clearHistoryLabel}>{t("Verlauf leeren")}</Text>
        </Pressable>
      </View>
      {conversation.map((entry,i)=><AssistantReply key={i+'-'+entry.question}
        entry={entry} onNavigate={onNavigate}/>)}
    </View>:null}
    {!needle?<HomeHighlights data={highlights} onNavigate={onNavigate}/>:null}
    {!needle?<View style={s.section}>
      <Text accessibilityRole="header" style={s.sectionTitle}>{t("Meine Startseite")}</Text>
      <Pressable accessibilityRole="button" onPress={onCustomize} style={s.allAction}><Text style={s.allActionLabel}>{t("Startseite & Menü gestalten")}</Text><Text style={s.allActionLabel}>›</Text></Pressable>
      {!featured.length?<Text style={s.sectionSubtitle}>{t("Du hast keine Kacheln ausgewählt. Füge jederzeit neue hinzu oder nutze die Suche.")}</Text>:null}
      <View style={[s.featuredGrid,singleColumn&&{flexDirection:'column'}]}>
        {featured.map(route=><AreaCard key={route.id} route={route} onNavigate={onNavigate} query="" compact={!singleColumn}/>)}
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:showAll}} onPress={()=>setShowAll(v=>!v)} style={s.allAction}>
        <Text style={s.allActionLabel}>{showAll?t("Weniger Bereiche anzeigen"):t("Alle Bereiche entdecken")}</Text><Text style={s.allActionLabel}>{showAll?'⌃':'⌄'}</Text>
      </Pressable>
      {showAll?moreRoutes.map(route=><AreaCard key={route.id} route={route} onNavigate={onNavigate} query=""/>):null}
    </View>:null}
    {!needle?<View style={s.section}>
      <Text style={s.sectionTitle}>{t("Du könntest fragen")}</Text>
      <View style={s.suggestionList}>
        {SUGGESTIONS.map(t).map(topic=><Pressable key={topic} accessibilityRole="button"
          accessibilityLabel={t("Frage eingeben: ")+topic}
          onPress={()=>{updateQuestion(topic);scrollRef.current?.scrollTo({y:0,animated:false});}} style={({pressed})=>[s.suggestion,pressed&&s.pressed]}>
          <Text style={s.suggestionText}>{topic}</Text>
          <Text style={s.suggestionArrow}>›</Text>
        </Pressable>)}
      </View>
    </View>:null}
    <Text style={s.disclaimer}>
      {language==='en'?'AI explains features and answers general questions. It cannot read private messages, contacts or account data, or make purchases or account changes. Do not enter sensitive information.':'Die KI erklärt Funktionen und beantwortet allgemeine Fragen. Sie liest keine privaten Nachrichten, Kontakte oder Kontodaten und führt keine Käufe oder Kontoänderungen aus. Bitte gib keine sensiblen Informationen ein.'}
    </Text>
  </ScrollView>;
}
const s=StyleSheet.create({
  page:{flex:1,backgroundColor:C.bg},
  content:{paddingHorizontal:18,paddingTop:14,paddingBottom:45},
  searchCenter:{alignItems:'center',paddingVertical:18,marginBottom:18},
  searchCenterIdle:{paddingTop:56,paddingBottom:24},
  wordmark:{fontSize:34,fontWeight:'900',letterSpacing:-1.3,color:C.ink,textAlign:'center',marginTop:7},
  tagline:{fontSize:15,color:C.muted,textAlign:'center',marginTop:6,marginBottom:24},
  sunWrap:{width:70,height:70,alignItems:'center',justifyContent:'center'},
  sunCore:{position:'absolute',width:35,height:35,borderRadius:18,backgroundColor:'#F5B644'},
  ray:{position:'absolute',height:11,width:3,borderRadius:2,backgroundColor:'#E8A942'},
  eyebrow:{fontWeight:'900',fontSize:12,letterSpacing:1.8,color:'#845721',marginBottom:15},
  heroTitle:{color:C.ink,fontSize:29,fontWeight:'900',lineHeight:35,maxWidth:'82%',letterSpacing:-.6},
  heroSubtitle:{color:'#66512F',fontSize:15,lineHeight:21,marginTop:11,maxWidth:'80%'},
  searchCard:{borderRadius:22,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,
    padding:16,marginBottom:24},
  searchTitle:{fontSize:19,fontWeight:'900',color:C.ink},
  searchHint:{fontSize:13.5,lineHeight:19,color:C.muted,marginTop:14,textAlign:'center'},
  inputShell:{width:'100%',maxWidth:680,flexDirection:'row',alignItems:'center',minHeight:58,borderWidth:1.5,
    borderColor:'#ADC6BE',borderRadius:30,backgroundColor:C.paper,paddingHorizontal:15},
  searchGlyph:{fontSize:29,color:C.tealDark,marginRight:7,marginTop:-5},
  input:{flex:1,minWidth:0,minHeight:51,paddingVertical:10,fontSize:16,color:C.ink},
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
  section:{marginBottom:22},
  sectionTitle:{color:C.ink,fontWeight:'900',fontSize:19,marginBottom:4},
  sectionSubtitle:{color:C.muted,fontSize:13,lineHeight:19,marginBottom:12},
  featuredGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10},
  areaGrid:{width:'48.4%',minHeight:96,backgroundColor:C.paper,borderColor:C.line,
    borderWidth:1,borderRadius:19,padding:14,justifyContent:'space-between'},
  areaGridAccent:{width:29,height:5,borderRadius:5,backgroundColor:C.sun,marginBottom:10},
  areaRow:{backgroundColor:C.paper,borderRadius:16,borderWidth:1,borderColor:C.line,
    paddingHorizontal:15,paddingVertical:14,marginBottom:9,flexDirection:'row',alignItems:'center'},
  areaAccent:{width:5,height:39,borderRadius:4,backgroundColor:C.sun,marginRight:12},
  areaTitle:{color:C.ink,fontSize:15.5,fontWeight:'900',lineHeight:20},
  areaSubtitle:{fontSize:14,lineHeight:21,color:C.muted,marginTop:5},
  areaArrow:{fontSize:23,color:C.tealDark,alignSelf:'flex-end',marginLeft:6},
  allAction:{minHeight:47,flexDirection:'row',alignItems:'center',
    justifyContent:'space-between',paddingHorizontal:15,marginTop:12,
    backgroundColor:C.sunPale,borderRadius:14},
  allActionLabel:{color:'#6C4A18',fontSize:14,fontWeight:'800'},
  replyHeader:{flexDirection:'row',justifyContent:'space-between',
    alignItems:'center',marginBottom:10},
  clearHistory:{padding:8,minHeight:44,justifyContent:'center'},
  clearHistoryLabel:{fontSize:12.5,color:C.tealDark,fontWeight:'800'},
  answerCard:{padding:16,borderRadius:20,backgroundColor:C.paper,
    borderColor:C.line,borderWidth:1,marginBottom:11},
  youLabel:{fontSize:10,fontWeight:'900',letterSpacing:.9,color:C.muted},
  questionText:{color:C.ink,fontSize:14.5,fontWeight:'700',marginTop:5,lineHeight:21},
  answerDivider:{height:1,backgroundColor:C.line,marginVertical:13},
  assistantLabel:{color:C.tealDark,fontSize:10,fontWeight:'900',letterSpacing:.9},
  answerText:{color:C.ink,fontSize:15,lineHeight:23,marginTop:8},
  offerGroup:{marginTop:15,backgroundColor:'#FCFAF5',borderRadius:13,padding:12},
  offerHeading:{fontSize:13,fontWeight:'900',color:C.ink,marginBottom:7},
  offerItem:{minHeight:44,paddingVertical:9,borderTopWidth:1,borderTopColor:C.line},
  offerTitle:{fontSize:13.5,fontWeight:'800',color:C.ink},
  offerPrice:{fontSize:13,color:C.tealDark,fontWeight:'800',marginTop:4},
  mutedSmall:{fontSize:12.5,lineHeight:18,color:C.muted,marginTop:3},
  answerAction:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',
    backgroundColor:C.mint,borderRadius:12,paddingHorizontal:14,minHeight:44,marginTop:14},
  answerActionLabel:{color:C.tealDark,fontSize:13.5,fontWeight:'900'},
  empty:{fontSize:13.5,lineHeight:21,color:C.muted,padding:12},
  suggestionList:{gap:8,marginTop:9},
  suggestion:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    paddingHorizontal:15,borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.paper},
  suggestionText:{color:C.ink,fontSize:15,fontWeight:'700',flex:1,flexShrink:1},
  suggestionArrow:{fontSize:23,color:C.tealDark},
  disclaimer:{fontSize:11.5,lineHeight:18,color:C.muted,marginTop:1},
  outingCard:{backgroundColor:C.mint,borderColor:C.line,borderWidth:1,borderRadius:22,padding:16,marginTop:12,minHeight:48,flexDirection:'row',alignItems:'center'},
  outingTitle:{fontSize:19,fontWeight:'900',color:C.ink},outingSubtitle:{fontSize:14,lineHeight:21,color:C.ink,marginTop:6},outingLink:{fontSize:14,fontWeight:'900',color:C.accentDark,marginTop:12},
  pressed:{opacity:.72}
});
