import React, {useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {supabase} from './supabase';

import {HOME_ROUTES,findHomeRoutes,looksLikeMarketProductQuery} from './HomeNavigation';
const colors={ink:'#193C48',muted:'#647D82',teal:'#087F87',dark:'#075D67',line:'#DFE9E6',paper:'#FFFFFF',warm:'#FFF4DA',pale:'#E4F5F1'};
const card={backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line,borderRadius:18,padding:15,marginBottom:10};
function RouteCard({route,onNavigate,query}){
 return <Pressable accessibilityRole="button" accessibilityLabel={route.title+' öffnen'} onPress={()=>onNavigate(route.id,route.id==='market'&&looksLikeMarketProductQuery(query)?query.trim():'')} style={card}>
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
     const searchQuery=route?.id==='market'&&typeof data?.search_query==='string'?data.search_query.trim().slice(0,160):'';
     // The AI never invents listings: load up to three real, approved offers from the
     // authenticated database search after its route suggestion, independently of AI.
     let offers=null,offersError=false;
     if(searchQuery){
       const {data:results,error:searchError}=await supabase.rpc('ff_market_search',{
         p_query:searchQuery,p_category:'Alle',p_trade_type:'all',
         p_sort:'relevance',p_limit:3,p_offset:0
       });
       if(searchError||!Array.isArray(results))offersError=true;
       else offers=results.filter(row=>row?.listing?.moderation_status==='approved').map(row=>({
         id:row.listing.id,
         title:String(row.listing.title||'').slice(0,100),
         matchItem:String(row.match_item||'').slice(0,150),
         price:row.listing.trade_type==='gift'?'Zu verschenken':row.listing.trade_type==='swap'?'Tausch':
           (Number(row.listing.price_cents||0)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'})
       }));
     }
     setConversation(old=>[...old,{
       question:prompt,answer:data.answer.slice(0,1400),pageId:route?.id||'',searchQuery,
       offers,offersError
     }].slice(-6));
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
     style={{marginTop:10,marginBottom:23,backgroundColor:colors.teal,opacity:(busy||question.trim().length<3)?0.45:1,borderRadius:14,minHeight:48,alignItems:'center',justifyContent:'center',flexDirection:'row',padding:12}}>
     {busy?<ActivityIndicator color="#FFFFFF" style={{marginRight:8}}/>:null}
     <Text style={{color:'#FFFFFF',fontSize:16,fontWeight:'800'}}>{busy?'KI antwortet …':'KI fragen'}</Text>
   </Pressable>
   {error?<Text accessibilityRole="alert" style={{color:'#994A3C',marginBottom:15,lineHeight:20}}>{error}</Text>:null}
   {conversation.length? <View style={{marginBottom:21}}>
     <Text style={{fontSize:17,fontWeight:'800',color:colors.ink,marginBottom:10}}>Deine KI-Hilfe</Text>
     {conversation.map((entry,i)=><View key={i} style={{...card,marginBottom:12}}>
       <Text style={{fontSize:13,color:colors.muted,fontWeight:'700',marginBottom:6}}>Du: {entry.question}</Text>
       <Text style={{color:colors.ink,fontSize:15,lineHeight:23}}>{entry.answer}</Text>
       {entry.searchQuery&&!entry.offersError&&Array.isArray(entry.offers)?
         <View style={{marginTop:13}}>
           <Text style={{color:colors.dark,fontSize:14,fontWeight:'800',marginBottom:7}}>Freigegebene Basar-Angebote</Text>
           {entry.offers.length?entry.offers.map(item=>
             <Pressable key={item.id} accessibilityRole="button"
               accessibilityLabel={item.title+' im Basar suchen'}
               onPress={()=>onNavigate('market',entry.searchQuery)}
               style={{paddingVertical:10,borderTopWidth:1,borderTopColor:colors.line}}>
               <Text style={{color:colors.ink,fontWeight:'800',fontSize:14}}>{item.title}</Text>
               {item.matchItem?<Text style={{color:colors.muted,fontSize:13,marginTop:3}}>Darin passend: {item.matchItem}</Text>:null}
               <Text style={{color:colors.dark,fontSize:13,marginTop:4}}>{item.price}</Text>
             </Pressable>)
           :<Text style={{color:colors.muted,fontSize:13,lineHeight:19}}>Aktuell keine freigegebenen Treffer. Du kannst die Suche im Basar ändern.</Text>}
         </View>:null}
       {entry.searchQuery&&entry.offersError?<Text style={{color:colors.muted,fontSize:13,marginTop:12}}>
         Die Anzeige der Suchtreffer ist derzeit nicht erreichbar. Du kannst die Suche im Basar öffnen.
       </Text>:null}
       {entry.pageId?<Pressable accessibilityRole="button" onPress={()=>onNavigate(entry.pageId,entry.pageId==='market'?entry.searchQuery||entry.question:'')} style={{marginTop:11,alignSelf:'flex-start',backgroundColor:colors.pale,borderRadius:10,paddingVertical:10,paddingHorizontal:13}}>
         <Text style={{fontWeight:'800',color:colors.dark}}>Passenden Bereich öffnen ›</Text>
       </Pressable>:null}
     </View>)}
   </View>:null}
   <Text style={{fontWeight:'800',color:colors.ink,fontSize:17,marginBottom:11}}>{question.trim()?'Passende App-Bereiche':'Direkt loslegen'}</Text>
   {matches.length?matches.map(route=><RouteCard key={route.id} route={route} query={question} onNavigate={onNavigate}/>):
     <Text style={{color:colors.muted,marginBottom:12}}>Kein direkter Treffer. Frage die KI oder versuche andere Begriffe.</Text>}
   <Text style={{fontSize:12,color:colors.muted,lineHeight:18,marginTop:9}}>Die KI kann Funktionen erklären und allgemeine Fragen beantworten. Sie hat keinen Zugriff auf deine privaten Nachrichten, Kontakte oder Kontodaten und führt keine Käufe oder Änderungen selbst aus. Bitte keine sensiblen Informationen eingeben.</Text>
 </ScrollView>;
}
