import React, {useRef, useState} from 'react';
import {AccessibilityInfo, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions} from 'react-native';
import {supabase} from './supabase';
import {FAMILY_COLORS} from './FamilyTheme';
import {HOME_ROUTES,findHomeRoutes,looksLikeMarketProductQuery} from './HomeNavigation';

const C=FAMILY_COLORS;
const FEATURED=['discover','map','market','box'];
const SUGGESTIONS=['Spielplätze finden','Familien kennenlernen','Profil bearbeiten'];
function SunMark(){
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.sunWrap}>
    {Array.from({length:8},(_,i)=><View key={i} style={[s.ray,{
      transform:[{rotate:(i*45)+'deg'},{translateY:-28}]
    }]}/>)}
    <View style={s.sunCore}/>
  </View>;
}
function AreaCard({route,onNavigate,query,compact=false}){
  const productSearch=route.id==='market'&&looksLikeMarketProductQuery(query);
  return <Pressable accessibilityRole="button"
    accessibilityLabel={route.title+' öffnen'}
    onPress={()=>onNavigate(route.id,productSearch?query.trim():'')}
    style={({pressed})=>[compact?s.areaGrid:s.areaRow,pressed&&s.pressed]}>
    <View style={compact?s.areaGridAccent:s.areaAccent}/>
    <View style={{flex:1}}>
      <Text style={[s.areaTitle,compact&&{fontSize:15}]}>{route.title}</Text>
      <Text style={s.areaSubtitle} numberOfLines={compact?3:2}>{route.subtitle}</Text>
    </View>
    <Text style={s.areaArrow}>›</Text>
  </Pressable>;
}
function AssistantReply({entry,onNavigate}){
  return <View accessibilityLiveRegion="polite" style={s.answerCard}>
    <Text style={s.youLabel}>DEINE FRAGE</Text>
    <Text style={s.questionText}>{entry.question}</Text>
    <View style={s.answerDivider}/>
    <Text style={s.assistantLabel}>FAMILIENFUNKE HILFT</Text>
    <Text style={s.answerText}>{entry.answer}</Text>
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
      onPress={()=>onNavigate(entry.pageId,entry.pageId==='market'?entry.searchQuery||entry.question:'')}
      style={({pressed})=>[s.answerAction,pressed&&s.pressed]}>
      <Text style={s.answerActionLabel}>Passenden Bereich öffnen</Text>
      <Text style={s.answerActionLabel}>›</Text>
    </Pressable>:null}
  </View>;
}
export default function HomeAssistant({onNavigate}){
  const {width:screenWidth,fontScale}=useWindowDimensions();
  const singleColumn=screenWidth<360||fontScale>=1.5;
  const [question,setQuestion]=useState('');
  const [conversation,setConversation]=useState([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [showAll,setShowAll]=useState(false);
  const scrollRef=useRef(null);
  const needle=question.trim();
  const matches=findHomeRoutes(needle);
  const featured=FEATURED.map(id=>HOME_ROUTES.find(route=>route.id===id)).filter(Boolean);
  const moreRoutes=HOME_ROUTES.filter(route=>!FEATURED.includes(route.id));
  function openRoute(route){
    if(route)onNavigate(route.id,route.id==='market'&&looksLikeMarketProductQuery(needle)?needle.slice(0,160):'');
  }
  async function askAssistant(){
    const prompt=needle.slice(0,600);
    if(prompt.length<3||busy)return;
    setBusy(true);setError('');
    try{
      const history=conversation.slice(0,3).reverse().flatMap(x=>[
        {role:'user',content:x.question},
        {role:'assistant',content:x.answer}
      ]);
      const {data,error:requestError}=await supabase.functions.invoke('ff-app-assistant',{
        body:{question:prompt,history}
      });
      if(requestError||typeof data?.answer!=='string'||!data.answer.trim()){
        const code=requestError?.context?.status;
        throw new Error(code===429
          ?'Das heutige KI-Kontingent ist aufgebraucht. Die direkte Seitensuche bleibt nutzbar.'
          :'Die KI ist vorübergehend nicht erreichbar. Du kannst die App-Bereiche weiterhin direkt öffnen.');
      }
      const route=HOME_ROUTES.find(x=>x.id===data.page_id);
      const searchQuery=route?.id==='market'&&typeof data?.search_query==='string'
        ?data.search_query.trim().slice(0,160):'';
      // Product previews are fetched separately from the secured database.
      // The assistant cannot claim that an offer exists.
      let offers=null,offersError=false;
      if(searchQuery){
        try{
          const {data:rows,error:queryError}=await supabase.rpc('ff_market_search',{
            p_query:searchQuery,p_category:'Alle',p_trade_type:'all',
            p_sort:'relevance',p_limit:3,p_offset:0
          });
          if(queryError||!Array.isArray(rows))offersError=true;
          else offers=rows.filter(row=>row?.listing?.moderation_status==='approved')
            .map(row=>({
              id:row.listing.id,
              title:String(row.listing.title||'').slice(0,100),
              matchItem:String(row.match_item||'').slice(0,150),
              price:row.listing.trade_type==='gift'?'Zu verschenken'
                :row.listing.trade_type==='swap'?'Tausch'
                :(Number(row.listing.price_cents||0)/100).toLocaleString('de-DE',{
                  style:'currency',currency:'EUR'
                })
            }));
        }catch{offersError=true;}
      }
      setConversation(old=>[{
        question:prompt,answer:data.answer.slice(0,1400),
        pageId:route?.id||'',searchQuery,offers,offersError
      },...old].slice(0,6));
      setQuestion('');
      AccessibilityInfo.announceForAccessibility('Die KI-Antwort ist jetzt verfügbar.');
    }catch(e){setError(e?.message||'Die KI ist gerade nicht erreichbar.');}
    finally{setBusy(false);}
  }
  return <ScrollView ref={scrollRef} style={s.page} contentContainerStyle={s.content}
    keyboardShouldPersistTaps="handled">
    <View style={s.hero}>
      <View style={s.heroCircleLarge} pointerEvents="none"/>
      <View style={s.heroCircleSmall} pointerEvents="none"/>
      <SunMark/>
      <Text style={s.eyebrow}>FAMILIENFUNKE</Text>
      <Text accessibilityRole="header" style={s.heroTitle}>Zusammen findet sich mehr.</Text>
      <Text style={s.heroSubtitle}>Menschen, Orte und Antworten für euren Familienalltag.</Text>
    </View>
    <View style={s.searchCard}>
      <Text accessibilityRole="header" style={s.searchTitle}>Was suchst du heute?</Text>
      <Text style={s.searchHint}>Finde eine Funktion direkt oder stell unserer KI eine Frage.</Text>
      <View style={s.inputShell}>
        <Text style={s.searchGlyph}>⌕</Text>
        <TextInput accessibilityLabel="App-Funktion suchen oder KI-Frage eingeben"
          style={s.input} value={question} onChangeText={setQuestion} editable={!busy}
          placeholder="z. B. Spielplatz, Profil, Kinderjeans ..."
          placeholderTextColor={C.muted} maxLength={600}
          autoCapitalize="sentences" returnKeyType="search"
          onSubmitEditing={askAssistant}/>
        {needle?<Pressable accessibilityRole="button" accessibilityLabel="Eingabe löschen"
          onPress={()=>{setQuestion('');setError('');}} style={s.clear}>
          <Text style={s.clearText}>×</Text>
        </Pressable>:null}
      </View>
      <View style={s.searchActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="KI um Hilfe fragen"
          accessibilityState={{disabled:busy||needle.length<3}}
          disabled={busy||needle.length<3} onPress={askAssistant}
          style={({pressed})=>[s.askButton,(busy||needle.length<3)&&s.disabled,pressed&&s.pressed]}>
          {busy?<ActivityIndicator color="#FFFFFF" style={{marginRight:8}}/>:null}
          <Text style={s.askButtonLabel}>{busy?'KI antwortet …':'KI fragen'}</Text>
        </Pressable>
        {needle&&matches.length?
          <Pressable accessibilityRole="button" accessibilityLabel="Ersten passenden Bereich direkt öffnen"
            onPress={()=>openRoute(matches[0])} style={({pressed})=>[s.directButton,pressed&&s.pressed]}>
            <Text style={s.directLabel}>Direkt öffnen ›</Text>
          </Pressable>:
          <Text style={s.directHint}>Bereiche findest du auch ohne KI.</Text>}
      </View>
      {error?<Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={s.error}>{error}</Text>:null}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Persönlichen Familienausflug planen" onPress={()=>onNavigate('outing')}
      style={({pressed})=>[s.outingCard,pressed&&s.pressed]}>
      <View style={{flex:1}}>
        <Text style={s.outingTitle}>Euer nächster Familienausflug</Text>
        <Text style={s.outingSubtitle}>Nach Alter, Budget und Entfernung passende Ziele finden – mit oder ohne KI.</Text>
        <Text style={s.outingLink}>Ausflug planen ›</Text>
      </View>
    </Pressable>
    {conversation.length?<View style={s.section}>
      <View style={s.replyHeader}>
        <Text style={s.sectionTitle}>Deine KI-Hilfe</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="KI-Verlauf in dieser Ansicht löschen"
          onPress={()=>setConversation([])} style={s.clearHistory}>
          <Text style={s.clearHistoryLabel}>Verlauf leeren</Text>
        </Pressable>
      </View>
      {conversation.map((entry,i)=><AssistantReply key={i+'-'+entry.question}
        entry={entry} onNavigate={onNavigate}/>)}
    </View>:null}
    {needle?
      <View style={s.section}>
        <Text style={s.sectionTitle}>Passende Bereiche</Text>
        <Text style={s.sectionSubtitle}>Sofort öffnen – ohne auf eine KI-Antwort zu warten.</Text>
        {matches.length?matches.map(route=><AreaCard key={route.id} route={route}
          onNavigate={onNavigate} query={needle}/>):
          <Text style={s.empty}>Kein direkter Treffer. Du kannst die KI fragen oder einen anderen Begriff versuchen.</Text>}
      </View>:
      <View style={s.section}>
        <Text style={s.sectionTitle}>Einfach loslegen</Text>
        <Text style={s.sectionSubtitle}>Wichtige Bereiche auf einen Blick.</Text>
        <View style={[s.featuredGrid,singleColumn&&{flexDirection:"column"}]}>
          {featured.map(route=><AreaCard key={route.id} route={route}
            onNavigate={onNavigate} query="" compact={!singleColumn}/>)}
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{expanded:showAll}}
          onPress={()=>setShowAll(v=>!v)} style={s.allAction}>
          <Text style={s.allActionLabel}>{showAll?'Weniger Bereiche anzeigen':'Alle Bereiche entdecken'}</Text>
          <Text style={s.allActionLabel}>{showAll?'⌃':'⌄'}</Text>
        </Pressable>
        {showAll?moreRoutes.map(route=><AreaCard key={route.id} route={route}
          onNavigate={onNavigate} query=""/>):null}
      </View>}
    {!needle?<View style={s.section}>
      <Text style={s.sectionTitle}>Du könntest fragen</Text>
      <View style={s.suggestionList}>
        {SUGGESTIONS.map(topic=><Pressable key={topic} accessibilityRole="button"
          accessibilityLabel={'Frage eingeben: '+topic}
          onPress={()=>{setQuestion(topic);scrollRef.current?.scrollTo({y:0,animated:false});}} style={({pressed})=>[s.suggestion,pressed&&s.pressed]}>
          <Text style={s.suggestionText}>{topic}</Text>
          <Text style={s.suggestionArrow}>›</Text>
        </Pressable>)}
      </View>
    </View>:null}
    <Text style={s.disclaimer}>
      Die KI erklärt Funktionen und beantwortet allgemeine Fragen. Sie liest keine privaten
      Nachrichten, Kontakte oder Kontodaten und führt keine Käufe oder Kontoänderungen aus.
      Bitte gib keine sensiblen Informationen ein.
    </Text>
  </ScrollView>;
}
const s=StyleSheet.create({
  page:{flex:1,backgroundColor:C.bg},
  content:{paddingHorizontal:18,paddingTop:14,paddingBottom:45},
  hero:{minHeight:198,backgroundColor:C.sun,borderRadius:25,paddingTop:23,
    paddingBottom:24,paddingHorizontal:22,overflow:'hidden',justifyContent:'center',marginBottom:15},
  heroCircleLarge:{position:'absolute',right:-54,top:-75,width:250,height:250,
    borderRadius:125,backgroundColor:'#FFE9A3'},
  heroCircleSmall:{position:'absolute',right:16,bottom:-45,width:120,height:120,
    borderRadius:60,backgroundColor:'#F3C764',opacity:.38},
  sunWrap:{position:'absolute',right:24,top:24,width:70,height:70,alignItems:'center',justifyContent:'center'},
  sunCore:{position:'absolute',width:35,height:35,borderRadius:18,backgroundColor:'#F5B644'},
  ray:{position:'absolute',height:11,width:3,borderRadius:2,backgroundColor:'#E8A942'},
  eyebrow:{fontWeight:'900',fontSize:12,letterSpacing:1.8,color:'#845721',marginBottom:15},
  heroTitle:{color:C.ink,fontSize:29,fontWeight:'900',lineHeight:35,maxWidth:'82%',letterSpacing:-.6},
  heroSubtitle:{color:'#66512F',fontSize:15,lineHeight:21,marginTop:11,maxWidth:'80%'},
  searchCard:{borderRadius:22,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,
    padding:16,marginBottom:24},
  searchTitle:{fontSize:19,fontWeight:'900',color:C.ink},
  searchHint:{fontSize:13.5,lineHeight:19,color:C.muted,marginTop:5,marginBottom:14},
  inputShell:{flexDirection:'row',alignItems:'center',minHeight:54,borderWidth:1.5,
    borderColor:'#ADC6BE',borderRadius:14,backgroundColor:'#FFFDF7',paddingHorizontal:11},
  searchGlyph:{fontSize:29,color:C.tealDark,marginRight:7,marginTop:-5},
  input:{flex:1,minHeight:51,paddingVertical:10,fontSize:15,color:C.ink},
  clear:{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',paddingHorizontal:9,paddingVertical:5},
  clearText:{color:C.muted,fontSize:24},
  searchActions:{marginTop:12,flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:10},
  askButton:{backgroundColor:C.teal,alignItems:'center',justifyContent:'center',
    minHeight:46,paddingHorizontal:17,borderRadius:14,flexDirection:'row'},
  askButtonLabel:{color:'#FFFFFF',fontWeight:'900',fontSize:15},
  disabled:{opacity:.52},
  directButton:{borderColor:'#D7E7E0',borderWidth:1,backgroundColor:C.mint,
    borderRadius:14,minHeight:46,justifyContent:'center',paddingHorizontal:12,flex:1},
  directLabel:{color:C.tealDark,fontSize:13.5,fontWeight:'800',textAlign:'center'},
  directHint:{color:C.muted,fontSize:12.5,flex:1,lineHeight:17},
  error:{color:C.danger,fontSize:13,lineHeight:19,marginTop:12},
  section:{marginBottom:22},
  sectionTitle:{color:C.ink,fontWeight:'900',fontSize:19,marginBottom:4},
  sectionSubtitle:{color:C.muted,fontSize:13,lineHeight:19,marginBottom:12},
  featuredGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10},
  areaGrid:{width:'48.4%',minHeight:157,backgroundColor:C.paper,borderColor:C.line,
    borderWidth:1,borderRadius:19,padding:14,justifyContent:'space-between'},
  areaGridAccent:{width:29,height:5,borderRadius:5,backgroundColor:C.sun,marginBottom:10},
  areaRow:{backgroundColor:C.paper,borderRadius:16,borderWidth:1,borderColor:C.line,
    paddingHorizontal:15,paddingVertical:14,marginBottom:9,flexDirection:'row',alignItems:'center'},
  areaAccent:{width:5,height:39,borderRadius:4,backgroundColor:C.sun,marginRight:12},
  areaTitle:{color:C.ink,fontSize:15.5,fontWeight:'900',lineHeight:20},
  areaSubtitle:{fontSize:12.5,lineHeight:18,color:C.muted,marginTop:5},
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
    backgroundColor:C.mint,borderRadius:12,paddingHorizontal:14,minHeight:43,marginTop:14},
  answerActionLabel:{color:C.tealDark,fontSize:13.5,fontWeight:'900'},
  empty:{fontSize:13.5,lineHeight:21,color:C.muted,padding:12},
  suggestionList:{gap:8,marginTop:9},
  suggestion:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    paddingHorizontal:15,borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:C.paper},
  suggestionText:{color:C.ink,fontSize:13.5,fontWeight:'700'},
  suggestionArrow:{fontSize:23,color:C.tealDark},
  disclaimer:{fontSize:11.5,lineHeight:18,color:C.muted,marginTop:1},
  outingCard:{backgroundColor:C.mint,borderColor:C.line,borderWidth:1,borderRadius:22,padding:18,marginBottom:22,minHeight:48,flexDirection:'row',alignItems:'center'},
  outingTitle:{fontSize:19,fontWeight:'900',color:C.ink},outingSubtitle:{fontSize:14,lineHeight:21,color:C.ink,marginTop:6},outingLink:{fontSize:14,fontWeight:'900',color:C.accentDark,marginTop:12},
  pressed:{opacity:.72}
});
