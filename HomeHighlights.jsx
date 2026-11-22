import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useFamilyLocale} from './FamilyLocale';
import {FAMILY_COLORS as C} from './FamilyTheme';

export default function HomeHighlights({data,onNavigate}){
 const {t,locale}=useFamilyLocale();
 if(!data)return null;
 const cards=[];
 if(data.requests?.length)cards.push({key:'requests',type:'contacts',label:t('Kontaktanfragen'),title:t('Anfragen beantworten'),note:t('Andere Familien möchten mit euch in Kontakt treten.')});
 if(data.meeting)cards.push({key:'meeting',type:'events',id:data.meeting.id,label:t('Treffen in eurer Region'),title:data.meeting.title,note:new Date(data.meeting.starts_at).toLocaleString(locale,{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})});
 if(data.families?.length)cards.push({key:'families',type:'discover',label:t('Familien aus eurer Region'),title:data.families[0].name,note:t('Freigegebenes Profil – Kontaktaufnahme erst nach Zustimmung.')});
 if(data.listings?.length)cards.push({key:'market',type:'market',query:data.listings[0].title,label:t('Neues aus dem Basar'),title:data.listings[0].title,note:t('Freigegebenes Angebot aus eurer Region. Aktuelle Details im Basar prüfen.')});
 return <View style={s.section}>
  <Text accessibilityRole="header" style={s.heading}>{t('Für eure Familie')}</Text>
  <Text style={s.subtitle}>{t('Persönlicher Überblick ohne zusätzlichen KI-Aufruf oder GPS-Freigabe.')}</Text>
  {data.status==='unavailable'?<Text style={s.empty}>{t('Persönliche Vorschläge erscheinen nach Freigabe des Familienkontos.')}</Text>:
   data.status==='missing-region'?<Pressable accessibilityRole="button" style={s.empty} onPress={()=>onNavigate('profile')}><Text style={s.title}>{t('Region im Profil ergänzen')}</Text><Text style={s.subtitle}>{t('Nur die ungefähre Region angeben, keine Wohnadresse.')}</Text></Pressable>:
   cards.length?<View style={s.grid}>{cards.map(card=><Pressable key={card.key} accessibilityRole="button" accessibilityLabel={card.label+': '+card.title} style={s.card} onPress={()=>onNavigate(card.type,card.query||'',card.id||null)}>
    <Text style={s.kicker}>{card.label}</Text><Text numberOfLines={2} style={s.title}>{card.title}</Text><Text style={s.detail} numberOfLines={3}>{card.note}</Text><Text style={s.link}>{t('Bereich öffnen')} ›</Text>
   </Pressable>)}</View>:
   <Text style={s.empty}>{t('Keine passenden Vorschläge in den gerade geladenen Daten. Entdecke Familien, Ausflüge und Basarangebote über die Suche.')}</Text>}
  <Text style={s.note}>{t('Dies ist nur eine Auswahl. Freigaben, Sichtbarkeit und Blockierungen bleiben maßgeblich.')}</Text>
 </View>;
}
const s=StyleSheet.create({
 section:{marginBottom:24},heading:{fontSize:21,fontWeight:'900',color:C.ink,marginBottom:6},subtitle:{fontSize:13,color:C.muted,lineHeight:19,marginBottom:12},
 grid:{flexDirection:'row',flexWrap:'wrap',gap:10},card:{minWidth:145,flexBasis:'47%',flexGrow:1,minHeight:142,backgroundColor:C.paper,borderWidth:1,borderColor:C.line,borderRadius:17,padding:15,justifyContent:'space-between'},
 kicker:{color:C.tealDark,fontSize:11,fontWeight:'800',marginBottom:6},title:{fontSize:16,fontWeight:'800',color:C.ink,lineHeight:22},detail:{fontSize:13,color:C.muted,lineHeight:19,marginTop:5},link:{fontSize:13,fontWeight:'800',color:C.tealDark,marginTop:10},
 empty:{backgroundColor:C.sunPale,borderRadius:16,padding:16,color:C.ink,fontSize:14,lineHeight:21},note:{fontSize:11.5,color:C.muted,lineHeight:17,marginTop:11}
});
