import React, {useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {supabase} from './supabase';

// Only real, currently navigable areas are advertised. A match opens the actual screen.
export const HOME_ROUTES = [
  {id:'box',title:'Kiste mit KI erfassen',subtitle:'Mehrere Kleidungsstücke fotografieren und Pakete anbieten',words:'kiste kistenmodus paket kleidungspaket mehrere teile gruppenfoto foto erkennen scannen paketverkauf'},
  {id:'sell',title:'Artikel verkaufen',subtitle:'Einzelne Anzeige mit Foto und Beschreibung erstellen',words:'verkaufen inserieren anzeige artikel hochladen einstellen schnellverkauf'},
  {id:'market',title:'Familienbasar durchsuchen',subtitle:'Kaufen, tauschen, verschenken und Angebote finden',words:'flohmarkt basar kaufen secondhand suchen angebot preis verschenken tauschen merkliste'},
  {id:'discover',title:'Familien in der Nähe',subtitle:'Andere Familien nach Region und Interessen kennenlernen',words:'familie familien menschen eltern finden kennenlernen kontakte tinder entdecken in der naehe'},
  {id:'map',title:'Familienkarte',subtitle:'Spielplätze und Ausflugsziele auf der Karte entdecken',words:'karte spielplatz spielplaetze ausflug ausflugsziele ort in der naehe'},
  {id:'guide',title:'Familienwegweiser',subtitle:'Dauerhafte Tipps und Ziele für Familien',words:'wegweiser ratgeber ausflug freizeit elternwissen region unternehmungen'},
  {id:'events',title:'Treffen & Veranstaltungen',subtitle:'Gemeinsame Aktivitäten finden und planen',words:'veranstaltung termin treffen event kindergeburtstag ausmachen'},
  {id:'contacts',title:'Kontakte & Nachrichten',subtitle:'Anfragen und private Gespräche verwalten',words:'chat nachricht anschreiben kontakt freundschaft einladung'},
  {id:'profile',title:'Mein Familienprofil',subtitle:'Hobbys, Fotos, Region und Sichtbarkeit anpassen',words:'profil bearbeiten hobby hobbies interessen datenschutz privatsphaere einstellen'},
  {id:'partners',title:'Kitas & Partnerwelt',subtitle:'Kindergärten, Vereine und Kita-Flohmärkte',words:'kita kindergarten einrichtung partner foerderverein verein'},
  {id:'help',title:'Hilfe & FAQ',subtitle:'Anleitungen zur Bedienung von Familienfunke',words:'hilfe fragen faq problem anleitung app funktioniert'},
  {id:'inclusion',title:'Familien & Inklusion',subtitle:'Informationen zur Teilhabe und zu geplanten Angeboten',words:'inklusion teilhabe barrierefreiheit unterstuetzung'}
];
export const HOME_PAGE_IDS = HOME_ROUTES.map(x=>x.id);
const colors={ink:'#193C48',muted:'#647D82',teal:'#087F87',dark:'#075D67',line:'#DFE9E6',paper:'#FFFFFF',warm:'#FFF4DA',pale:'#E4F5F1'};
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9äöüß]+/g,' ').trim();
const STOP=new Set(['ich','du','die','der','das','und','oder','ein','eine','mit','zu','wo','wie','kann','können','mochte','moechte','möchte','finde','mir','bitte','auf','in','fur','für','ist','von','meine','meinen','was']);
export function findHomeRoutes(value){
 const terms=normalize(value).split(' ').filter(x=>x.length>=2&&!STOP.has(x));
 if(!terms.length)return HOME_ROUTES.slice(0,4);
 return HOME_ROUTES.map(route=>{
   const full=normalize(route.title+' '+route.subtitle+' '+route.words);
   const score=terms.reduce((acc,term)=>acc+(full.includes(term)?1:0),0);
   return {...route,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6);
}
const card={backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line,borderRadius:18,padding:15,marginBottom:10};
function RouteCard({route,onNavigate}){
 return <Pressable accessibilityRole="button" accessibilityLabel={route.title+' öffnen'} onPress={()=>onNavigate(route.id)} style={card}>
   <View style={{flexDirection:'row',alignItems:'center'}}>
     <View style={{flex:1}}>
       <Text style={{color:colors.ink,fontWeight:'800',fontSize:16}}>{route.title}</Text>
       <Text style={{color:colors.muted,fontSize:13,marginTop:3,lineHeight:19}}>{route.subtitle}</Text>
     </View>
     <Text style={{color:colors.teal,fontSize:24,marginLeft:12}}>›</Text>
   </View>
 </Pressable>;
}
export default function HomeAssistant({onNavigate}){
 const [question,setQuestion]=useState('');
 const [conversation,setConversation]=useState([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const matches=findHomeRoutes(question);
 async function askAssistant(){
   const prompt=question.trim().slice(0,600);
   if(prompt.length<3||busy)return;
   setBusy(true);setError('');
   try{
     const history=conversation.slice(-3).flatMap(x=>[
       {role:'user',content:x.question},
       {role:'assistant',content:x.answer}
     ]);
     const {data,error:requestError}=await supabase.functions.invoke('ff-app-assistant',{body:{question:prompt,history}});
     if(requestError||typeof data?.answer!=='string'||!data.answer.trim()){
       const code=requestError?.context?.status;
       throw new Error(code===429?'Dein heutiges KI-Kontingent ist aufgebraucht. Die Seitensuche funktioniert weiterhin.':
         'Die KI-Hilfe ist gerade nicht erreichbar. Die Suche nach App-Funktionen funktioniert weiterhin.');
     }
     const route=HOME_ROUTES.find(x=>x.id===data.page_id);
     setConversation(old=>[...old,{question:prompt,answer:data.answer.slice(0,1400),pageId:route?.id||''}].slice(-6));
     setQuestion('');
   }catch(e){setError(e?.message||'Die KI-Hilfe ist gerade nicht erreichbar.');}
   finally{setBusy(false);}
 }
 return <ScrollView style={{flex:1,backgroundColor:'#FFF9F3'}} contentContainerStyle={{padding:18,paddingBottom:40}} keyboardShouldPersistTaps="handled">
   <View style={{backgroundColor:colors.pale,borderRadius:22,padding:20,marginBottom:19}}>
     <Text style={{color:colors.dark,fontSize:12,fontWeight:'900',letterSpacing:1}}>DEIN FAMILIENFUNKE</Text>
     <Text style={{color:colors.ink,fontSize:26,fontWeight:'900',lineHeight:32,marginTop:8}}>Was möchtest du heute machen?</Text>
     <Text style={{color:colors.dark,fontSize:15,lineHeight:22,marginTop:9}}>Finde sofort die richtige Funktion oder frag unsere KI um Hilfe.</Text>
   </View>
   <Text style={{fontWeight:'800',color:colors.ink,fontSize:17,marginBottom:10}}>Suchen oder fragen</Text>
   <TextInput
     accessibilityLabel="Funktion suchen oder KI-Frage eingeben"
     style={{backgroundColor:'#FFF',borderWidth:1.5,borderColor:'#B3D8D3',borderRadius:15,minHeight:54,paddingHorizontal:15,fontSize:16,color:colors.ink}}
     placeholder="z. B. Paket verkaufen oder Profil ändern"
     placeholderTextColor={colors.muted}
     multiline
     maxLength={600}
     value={question} onChangeText={setQuestion}
   />
   <Pressable accessibilityRole="button" accessibilityLabel="KI um Hilfe fragen" accessibilityState={{disabled:busy||question.trim().length<3}}
     disabled={busy||question.trim().length<3} onPress={askAssistant}
     style={{marginTop:10,marginBottom:23,backgroundColor:colors.teal,opacity:busy||question.trim().length<3?.45:1,borderRadius:14,minHeight:48,alignItems:'center',justifyContent:'center',flexDirection:'row',padding:12}}>
     {busy?<ActivityIndicator color="#FFFFFF" style={{marginRight:8}}/>:null}
     <Text style={{color:'#FFFFFF',fontSize:16,fontWeight:'800'}}>{busy?'KI antwortet …':'KI fragen'}</Text>
   </Pressable>
   {error?<Text accessibilityRole="alert" style={{color:'#994A3C',marginBottom:15,lineHeight:20}}>{error}</Text>:null}
   {conversation.length? <View style={{marginBottom:21}}>
     <Text style={{fontSize:17,fontWeight:'800',color:colors.ink,marginBottom:10}}>Deine KI-Hilfe</Text>
     {conversation.map((entry,i)=><View key={i} style={{...card,marginBottom:12}}>
       <Text style={{fontSize:13,color:colors.muted,fontWeight:'700',marginBottom:6}}>Du: {entry.question}</Text>
       <Text style={{color:colors.ink,fontSize:15,lineHeight:23}}>{entry.answer}</Text>
       {entry.pageId?<Pressable accessibilityRole="button" onPress={()=>onNavigate(entry.pageId)} style={{marginTop:11,alignSelf:'flex-start',backgroundColor:colors.pale,borderRadius:10,paddingVertical:10,paddingHorizontal:13}}>
         <Text style={{fontWeight:'800',color:colors.dark}}>Passenden Bereich öffnen ›</Text>
       </Pressable>:null}
     </View>)}
   </View>:null}
   <Text style={{fontWeight:'800',color:colors.ink,fontSize:17,marginBottom:11}}>{question.trim()?'Passende App-Bereiche':'Direkt loslegen'}</Text>
   {matches.length?matches.map(route=><RouteCard key={route.id} route={route} onNavigate={onNavigate}/>):
     <Text style={{color:colors.muted,marginBottom:12}}>Kein direkter Treffer. Frage die KI oder versuche andere Begriffe.</Text>}
   <Text style={{fontSize:12,color:colors.muted,lineHeight:18,marginTop:9}}>Die KI kann Funktionen erklären und allgemeine Fragen beantworten. Sie hat keinen Zugriff auf deine privaten Nachrichten, Kontakte oder Kontodaten und führt keine Käufe oder Änderungen selbst aus. Bitte keine sensiblen Informationen eingeben.</Text>
 </ScrollView>;
}
