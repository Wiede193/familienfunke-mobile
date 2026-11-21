import React,{useState} from 'react';
import {Alert,Modal,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {HOME_ROUTES} from './HomeNavigation';
import {BOTTOM_ITEMS,MAX_BOTTOM,moveShortcut,normalizeLayout} from './FamilyLayoutModel';

const homeChoices=HOME_ROUTES.map(r=>[r.id,r.title]);
const bottomChoices=BOTTOM_ITEMS.map(([id,title])=>[id,title]);
function Action({title,onPress,disabled=false,primary=false,label}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label||title} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[s.action,primary&&s.primary,disabled&&s.disabled]}>
  <Text style={[s.actionText,primary&&s.primaryText]}>{title}</Text>
 </Pressable>;
}
function ListEditor({title,items,choices,change,locked=false,busy=false}){
 const available=choices.filter(([id])=>!items.includes(id));
 const full=locked&&items.length>=MAX_BOTTOM;
 return <View style={s.section}>
  <Text accessibilityRole="header" style={s.heading}>{title}</Text>
  <Text style={s.hint}>{locked?'Start bleibt immer sichtbar. Bis zu vier weitere Menüpunkte.':'Du kannst auch alle Kacheln ausblenden. Die Suche bleibt verfügbar.'}</Text>
  {items.length===0?<Text style={s.hint}>Keine Kacheln ausgewählt.</Text>:null}
  {items.map((id,i)=>{
   const name=choices.find(x=>x[0]===id)?.[1]||id;
   return <View key={id} style={s.item}>
    <Text style={s.name}>{i+1}. {name}</Text>
    {locked&&i===0?<Text style={s.hint}>Immer verfügbar</Text>:<View style={s.actions}>
     <Action title="Nach oben" label={name+' nach oben verschieben'} disabled={busy||i<=(locked?1:0)} onPress={()=>change(moveShortcut(items,i,-1,locked))}/>
     <Action title="Nach unten" label={name+' nach unten verschieben'} disabled={busy||i===items.length-1} onPress={()=>change(moveShortcut(items,i,1,locked))}/>
     <Action title="Entfernen" label={name+' aus '+title+' entfernen'} disabled={busy} onPress={()=>change(items.filter(x=>x!==id))}/>
    </View>}
   </View>;
  })}
  <Text accessibilityRole="header" style={s.subheading}>Hinzufügen</Text>
  {full?<Text style={s.hint}>Entferne zuerst einen Menüpunkt, um einen anderen hinzuzufügen.</Text>:null}
  {!available.length?<Text style={s.hint}>Alle Funktionen sind bereits ausgewählt.</Text>:null}
  {available.map(([id,name])=><Action key={id} title={'+ '+name} label={name+' zu '+title+' hinzufügen'} disabled={busy||full} onPress={()=>change([...items,id])}/>)}
 </View>;
}
export default function FamilyLayoutEditor({initial,ready,error,syncPending,syncAvailable,syncConflict,onRefresh,onSave,onClose,initialSection='home'}){
 const [draft,setDraft]=useState(()=>normalizeLayout(initial));
 const [section,setSection]=useState(initialSection);
 const [history,setHistory]=useState([]);
 function update(next){setHistory(old=>[...old.slice(-19),draft]);setDraft(next);}
 function undo(){if(!history.length)return;setDraft(history[history.length-1]);setHistory(old=>old.slice(0,-1));}
 const [busy,setBusy]=useState(false);
 const pending=React.useRef(false);
 const dirty=JSON.stringify(draft)!==JSON.stringify(normalizeLayout(initial));
 function close(){
  if(pending.current)return;
  if(!dirty){onClose();return;}
  Alert.alert('Änderungen verwerfen?','Deine bisherigen Einstellungen bleiben erhalten.',[{text:'Weiter bearbeiten',style:'cancel'},{text:'Verwerfen',style:'destructive',onPress:onClose}]);
 }
 async function save(confirmConflict=false){
  if(pending.current||!ready)return;
  if(syncConflict&&!confirmConflict){
   Alert.alert('Einstellungen auf einem anderen Gerät geändert','Welche Anordnung möchtest du verwenden? Deine lokale Anordnung überschreibt nur nach Bestätigung die Kontoeinstellung.',[
    {text:'Abbrechen',style:'cancel'},{text:'Meine Anordnung übernehmen',onPress:()=>save(true)}
   ]);return;
  }
  pending.current=true;setBusy(true);
  try{
   const result=await onSave(draft,{confirmConflict});
   if(result?.saved){
    if(!result.synced)Alert.alert('Auf diesem Gerät gespeichert',result.conflict?'Ein anderes Gerät hat die Anordnung geändert. Öffne „App gestalten“, um die Synchronisierung bewusst fortzusetzen.':'Die Synchronisierung war nicht möglich. Deine lokale Anordnung bleibt erhalten. Versuche es später erneut.');
    onClose();return;
   }
   Alert.alert('Nicht gespeichert','Deine bisherigen Einstellungen bleiben erhalten. Bitte versuche es erneut.');
  }
  finally{pending.current=false;setBusy(false);}
 }
 return <Modal visible animationType="none" onRequestClose={close}>
  <SafeAreaView style={s.page} accessibilityViewIsModal>
   <View style={s.header}><Text accessibilityRole="header" style={s.title}>App gestalten</Text><Action title="Schließen" onPress={close} disabled={busy}/></View>
   <View style={s.switcher}>
    {['home','bottom'].map(id=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:section===id}} onPress={()=>setSection(id)} style={[s.action,section===id&&s.primary]}><Text style={[s.actionText,section===id&&s.primaryText]}>{id==='home'?'Startseite':'Menü unten'}</Text></Pressable>)}
   </View>
   <ScrollView contentContainerStyle={s.content}>
    <Text style={s.hint}>Die Anordnung wird lokal gespeichert und – wenn verfügbar – mit deinem Konto synchronisiert. Alle Funktionen bleiben über Start und Suche erreichbar.</Text>
    {ready?<Text accessibilityLiveRegion="polite" style={s.hint}>{syncConflict?'Konflikt: Auf einem anderen Gerät wurden Einstellungen geändert.':syncPending?'Die lokale Anordnung ist noch nicht synchronisiert.':syncAvailable?'Kontosynchronisierung verfügbar.':'Kontosynchronisierung zurzeit nicht verfügbar.'}</Text>:null}
    <Action title="Synchronisierung prüfen" disabled={busy||dirty} onPress={onRefresh}/>
    {!ready?<Text accessibilityLiveRegion="polite" style={s.error}>{error||'Einstellungen werden geladen. Schließe diese Ansicht und öffne sie danach erneut.'}</Text>:null}
    {section==='home'?<ListEditor title="Startseiten-Kacheln" items={draft.home} choices={homeChoices} busy={busy||!ready} change={home=>update({...draft,home})}/>:<ListEditor title="Untere Menüleiste" items={draft.bottom} choices={bottomChoices} busy={busy||!ready} locked change={bottom=>update({...draft,bottom})}/>}
    <Action title="Letzte Änderung rückgängig" disabled={busy||!history.length} onPress={undo}/>
    <Action title="Standardeinstellungen wiederherstellen" disabled={busy||!ready} onPress={()=>Alert.alert('Anordnung zurücksetzen?','Startseite und Menü werden auf die Standardanordnung zurückgesetzt. Erst Speichern übernimmt die Änderung.',[{text:'Abbrechen',style:'cancel'},{text:'Zurücksetzen',onPress:()=>update(normalizeLayout(null))}])}/>
   </ScrollView>
   <View style={s.footer}><Action title={busy?'Wird gespeichert …':'Änderungen speichern'} primary disabled={busy||!ready||(!dirty&&!syncPending)} onPress={()=>save()}/></View>
  </SafeAreaView>
 </Modal>;
}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:C.bg},header:{padding:16,flexDirection:'row',alignItems:'center',flexWrap:'wrap',justifyContent:'space-between',gap:8},
 title:{fontSize:24,fontWeight:'800',color:C.ink,flexShrink:1},switcher:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingHorizontal:16},
 content:{padding:16,gap:12},section:{gap:10},heading:{fontSize:20,color:C.ink,fontWeight:'800'},subheading:{fontSize:17,color:C.ink,fontWeight:'700',marginTop:10},
 hint:{fontSize:15,lineHeight:22,color:C.muted},error:{fontSize:15,color:C.danger,lineHeight:22},
 item:{backgroundColor:C.paper,borderColor:C.line,borderWidth:1,borderRadius:14,padding:12,gap:8},name:{fontSize:17,color:C.ink,fontWeight:'700'},
 actions:{flexDirection:'row',flexWrap:'wrap',gap:6},action:{minHeight:48,borderWidth:1,borderColor:C.line,backgroundColor:C.paper,borderRadius:12,paddingHorizontal:12,paddingVertical:10,justifyContent:'center',maxWidth:'100%'},
 actionText:{fontSize:15,lineHeight:21,color:C.accentDark,fontWeight:'700',textAlign:'center'},primary:{backgroundColor:C.accentDark,borderColor:C.accentDark},primaryText:{color:C.white},disabled:{opacity:.45},
 footer:{padding:16,borderTopWidth:1,borderTopColor:C.line,backgroundColor:C.paper}
});
