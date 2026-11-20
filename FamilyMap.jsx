import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,Linking,Pressable,ScrollView,StyleSheet,Switch,Text,TextInput,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {supabase} from './supabase';
import {CURATED_REGION,CURATED_FAMILY_PLACES} from './FamilyMapCurated';

const C={bg:'#FFF9F3',paper:'#FFFFFF',ink:'#193C48',muted:'#647D82',teal:'#087F87',dark:'#075D67',pale:'#E4F5F1',sun:'#FFE4AA',coral:'#EE7867',line:'#F0E5DC'};
const TYPES=[['all','Alle','◎'],['playground','Spielplätze','♧'],['changing','Wickeltische','♡'],['outing','Ausflüge','✿'],['other','Sonstiges','◇']];
const CENTERS=[
  {name:'Fürstenwalde',lat:52.36,lon:14.06},
  {name:'Berlin',lat:52.52,lon:13.405},
  {name:'München',lat:48.137,lon:11.576},
  {name:'Hamburg',lat:53.55,lon:10},
  {name:'Köln',lat:50.94,lon:6.96},
  {name:'Leipzig',lat:51.34,lon:12.37},
];
const valid=(x)=>Number.isFinite(Number(x));
const typeLabel=(kind)=>TYPES.find(t=>t[0]===kind)?.[1]||'Familienort';
const typeGlyph=(kind)=>TYPES.find(t=>t[0]===kind)?.[2]||'◇';

const MAP_HTML=[
  '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">',
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@6.16.0/dist/maplibre-gl.css">',
  '<style>html,body,#map{height:100%;width:100%;margin:0;background:#E7F0ED;}',
  '.pin{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;',
  'border-radius:16px;font-size:17px;box-shadow:0 2px 7px rgba(15,45,48,.3);cursor:pointer;box-sizing:border-box;}',
  '.maplibregl-ctrl-attrib{font-size:9px!important;}',
  '.draft-pin{width:18px;height:18px;background:#ED7867;border:3px solid white;border-radius:9px;',
  'box-shadow:0 0 0 4px rgba(238,120,103,.25);}</style></head><body><div id="map"></div>',
  '<script type="module">',
  'import * as ml from "https://cdn.jsdelivr.net/npm/maplibre-gl@6.16.0/dist/maplibre-gl.mjs";',
  'const send=(payload)=>window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(payload));',
  'try{',
  'const map=new ml.Map({container:"map",style:"https://tiles.openfreemap.org/styles/liberty",',
  'center:[10.45,51.2],zoom:5.3,minZoom:4,attributionControl:{compact:false}});',
  'map.addControl(new ml.NavigationControl({showCompass:false}),"top-right");',
  'let markers=[];let draft=null;',
  'const glyph={playground:"♧",changing:"♥",outing:"✿",other:"◇"};',
  'const color={playground:"#0B8488",changing:"#EE7867",outing:"#9272B8",other:"#E0AB42"};',
  'window.ffMap={',
  'flyTo:function(lat,lon,zoom){map.flyTo({center:[lon,lat],zoom:zoom||12,essential:true});},',
  'setDraft:function(point){if(draft){draft.remove();draft=null;}if(!point)return;',
  'const el=document.createElement("div");el.className="draft-pin";draft=new ml.Marker({element:el}).setLngLat([point.longitude,point.latitude]).addTo(map);},',
  'setPins:function(items){markers.forEach(m=>m.remove());markers=[];',
  'items.forEach(p=>{if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))return;',
  'const el=document.createElement("div");el.className="pin";el.style.background=color[p.category]||"#E0AB42";',
  'el.style.color="white";el.textContent=glyph[p.category]||"◇";el.setAttribute("aria-label",p.title||"Familienort");',
  'el.addEventListener("click",ev=>{ev.stopPropagation();send({type:"pin",id:p.id});});',
  'markers.push(new ml.Marker({element:el,anchor:"center"}).setLngLat([p.longitude,p.latitude]).addTo(map));});}',
  '};',
  'map.on("load",()=>send({type:"ready"}));',
  'map.on("moveend",()=>{const p=map.getCenter();send({type:"move",latitude:p.lat,longitude:p.lng,zoom:map.getZoom()});});',
  'map.on("click",(e)=>send({type:"tap",latitude:e.lngLat.lat,longitude:e.lngLat.lng}));',
  '}catch(e){send({type:"error",message:"Die Vektorkarte konnte nicht gestartet werden."});}',
  '</script></body></html>'
].join('\n');

function Chip({label,selected,onPress}){
  return <Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress}
   style={[styles.chip,selected&&styles.chipActive]}><Text style={[styles.chipText,selected&&{color:C.paper}]}>{label}</Text></Pressable>;
}
function Field({label,value,onChange,maxLength=100,multi=false,placeholder}){
  return <View style={{marginTop:13}}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label}
   placeholder={placeholder} placeholderTextColor="#81999C" value={value} onChangeText={onChange}
   maxLength={maxLength} multiline={multi} style={[styles.field,multi&&{height:85,textAlignVertical:'top'}]}/></View>;
}
const mapScript=(method,arg)=>{
  const obj=JSON.stringify(arg).replace(/</g,'\\u003c');
  return 'window.ffMap&&window.ffMap.'+method+'('+obj+');true;';
};
function pinSetScript(items){
  return mapScript('setPins',items.map(({id,title,category,latitude,longitude})=>({id,title,category,latitude,longitude})));
}
function inGermany(lat,lon){
  return valid(lat)&&valid(lon)&&lat>=47&&lat<=55.2&&lon>=5.5&&lon<=15.6;
}
export default function FamilyMapScreen({userId,active,addPlace}){
  const map=useRef(null);
  const [ready,setReady]=useState(false);
  const [mapError,setMapError]=useState('');
  const [center,setCenter]=useState({latitude:51.2,longitude:10.45,zoom:5.3});
  const [types,setTypes]=useState('all');
  const [openForm,setOpenForm]=useState(false);
  const [draftPoint,setDraftPoint]=useState(null);
  const [name,setName]=useState('');
  const [description,setDescription]=useState('');
  const [category,setCategory]=useState('playground');
  const [region,setRegion]=useState('');
  const [changing,setChanging]=useState(false);
  const [community,setCommunity]=useState([]);
  const [osm,setOsm]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searchError,setSearchError]=useState('');
  const [selectedId,setSelectedId]=useState(null);
  const [notice,setNotice]=useState('');

  const fetchCommunity=useCallback(async()=>{
    if(!supabase||!userId)return;
    try{
      const {data,error}=await supabase.from('ff_family_places').select(
        'id,title,category,description,region_label,latitude,longitude,has_changing_table,source,moderation_status,submitted_by'
      ).order('created_at',{ascending:false}).limit(250);
      if(error)throw error;
      setCommunity((data||[]).map(p=>({...p,source:'community'})));
    }catch{setSearchError('Die eingereichten Familienorte konnten gerade nicht geladen werden.');}
  },[userId]);
  useEffect(()=>{fetchCommunity();},[fetchCommunity]);
  const all=useMemo(()=>{
    const curatedOSM=new Set(CURATED_FAMILY_PLACES.map(p=>p.osm_key).filter(Boolean));
    const places=[...CURATED_FAMILY_PLACES,...community,...osm.filter(p=>!curatedOSM.has(p.id))];
    return places.filter(p=>inGermany(p.latitude,p.longitude) && (types==='all'||p.category===types));
  },[community,osm,types]);
  const selected=all.find(p=>p.id===selectedId)||null;
  useEffect(()=>{if(ready)map.current?.injectJavaScript(pinSetScript(all));},[all,ready]);
  useEffect(()=>{
    if(ready)map.current?.injectJavaScript(mapScript('setDraft',draftPoint));
  },[draftPoint,ready]);
  async function loadAround(latitude=center.latitude,longitude=center.longitude,zoom=center.zoom){
    if(loading)return;
    setSearchError('');setNotice('');
    if(zoom<9){setSearchError('Bitte zoome erst näher heran oder wähle eine Stadt.');return;}
    if(!inGermany(latitude,longitude)){setSearchError('Bitte eine Region in Deutschland auswählen.');return;}
    setLoading(true);
    try{
      const {data,error}=await supabase.functions.invoke('ff-family-map-search',{
        body:{latitude,longitude}
      });
      if(error||!Array.isArray(data?.places))throw new Error('Kartendaten nicht erreichbar');
      setOsm(data.places);
      setSelectedId(null);
      setNotice(data.places.length?data.places.length+' offene Karteneinträge geladen. Angaben können unvollständig sein.':
       'In dieser Gegend sind noch keine passenden OpenStreetMap-Orte erfasst.');
      await fetchCommunity();
    }catch{setSearchError('Die OpenStreetMap-Ortssuche ist vorübergehend nicht erreichbar. Bereits eingereichte Familienorte bleiben sichtbar.');}
    finally{setLoading(false);}
  }
  function visit({latitude,longitude,name}){
    setCenter({latitude,longitude,zoom:12.3});
    setSelectedId(null);
    if(ready)map.current?.injectJavaScript(
      'window.ffMap&&window.ffMap.flyTo('+Number(latitude)+','+Number(longitude)+',12.3);true;'
    );
    setOsm([]);
    setNotice('');
    setSearchError('');
    // Nutzer tippt danach bewusst auf "Hier suchen", kein automatisches Massenabfragen.
  }
  function showCuratedRegion(){
    const {latitude,longitude,zoom}=CURATED_REGION;
    setSelectedId(null);
    setTypes('all');
    setOsm([]);
    setCenter({latitude,longitude,zoom});
    setSearchError('');
    if(ready)map.current?.injectJavaScript(
      'window.ffMap&&window.ffMap.flyTo('+latitude+','+longitude+','+zoom+');true;'
    );
  }
  function onMapMessage(event){
    let value;
    try{value=JSON.parse(event.nativeEvent.data);}catch{return;}
    if(value.type==='ready'){setReady(true);setMapError('');}
    else if(value.type==='error')setMapError(String(value.message||'Karte nicht verfügbar'));
    else if(value.type==='move'&&valid(value.latitude)&&valid(value.longitude)&&valid(value.zoom)){
      setCenter({latitude:value.latitude,longitude:value.longitude,zoom:value.zoom});
    }else if(value.type==='tap'&&inGermany(value.latitude,value.longitude)){
      if(openForm){setDraftPoint({latitude:Math.round(value.latitude*100000)/100000,longitude:Math.round(value.longitude*100000)/100000});setSelectedId(null);}
    }else if(value.type==='pin')setSelectedId(value.id);
  }
  async function submitPlace(){
    if(!active)return;
    if(!draftPoint)return setSearchError('Markiere zuerst den öffentlichen Ort durch Tippen auf die Karte.');
    if(name.trim().length<4)return setSearchError('Bitte einen aussagekräftigen Ortsnamen mit mindestens vier Zeichen angeben.');
    setSearchError('');
    const ok=await addPlace({
      title:name.trim().slice(0,100),category,description:description.trim().slice(0,600),
      region_label:region.trim().slice(0,80),
      latitude:draftPoint.latitude,longitude:draftPoint.longitude,has_changing_table:!!changing,
      submitted_by:userId
    });
    if(ok){
      setName('');setDescription('');setRegion('');setChanging(false);setOpenForm(false);
      setDraftPoint(null);setNotice('Danke! Dein Ort ist eingereicht und für andere erst nach Prüfung sichtbar.');
      await fetchCommunity();
    }
  }
  const countApproved=community.filter(p=>p.moderation_status==='approved').length;
  const pendingOwn=community.filter(p=>p.submitted_by===userId&&p.moderation_status==='pending');
  const list=all.filter(p=>Math.abs(p.latitude-center.latitude)<0.22&&Math.abs(p.longitude-center.longitude)<0.32).slice(0,30);
  function showPlace(place){
    setTypes('all');
    setSelectedId(place.id);
    setCenter({latitude:place.latitude,longitude:place.longitude,zoom:13.2});
    if(ready)map.current?.injectJavaScript(
      'window.ffMap&&window.ffMap.flyTo('+Number(place.latitude)+','+Number(place.longitude)+',13.2);true;'
    );
  }
  function openInOSM(place){
    const url='https://www.openstreetmap.org/?mlat='+encodeURIComponent(place.latitude)+'&mlon='+encodeURIComponent(place.longitude)
      +'#map=16/'+encodeURIComponent(place.latitude)+'/'+encodeURIComponent(place.longitude);
    Linking.openURL(url).catch(()=>{});
  }
  return <ScrollView style={styles.page} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
    <View style={styles.hero}><Text style={styles.eyebrow}>FAMILIENFUNKE ENTDECKT DEUTSCHLAND</Text>
      <Text style={styles.title}>Familienkarte ♡</Text>
      <Text style={styles.sub}>Spielplätze, Wickelmöglichkeiten in Restaurants und Cafés sowie Ausflugsziele – direkt auf der Karte entdecken.</Text>
    </View>
    <View style={styles.mapFrame}>
      <WebView ref={map} originWhitelist={['*']} source={{html:MAP_HTML}}
       javaScriptEnabled domStorageEnabled scrollEnabled={false}
       style={styles.map} onMessage={onMapMessage} onError={()=>setMapError('Die Vektorkarte konnte nicht geladen werden.')}
       setSupportMultipleWindows={false} allowsInlineMediaPlayback/>
      {!ready?<View pointerEvents="none" style={styles.mapLoading}><ActivityIndicator color={C.teal}/><Text style={styles.micro}>Vektorkarte laden …</Text></View>:null}
      <View pointerEvents="none" style={styles.mapTag}><Text style={styles.mapTagText}>Vektorkarte · Deutschland</Text></View>
    </View>
    {mapError?<View style={styles.warn}><Text style={styles.micro}>{mapError} Die Ortsliste kann weiterhin genutzt werden.</Text></View>:null}
    <Text style={[styles.micro,{marginTop:7}]}>Kartengrundlage: OpenFreeMap / OpenStreetMap. Zum Navigieren die Karte verschieben und zoomen. Standortzugriff ist nicht nötig.</Text>
    <View style={styles.curatedBox}>
      <View style={[styles.row,{justifyContent:'space-between',alignItems:'center',gap:10}]}>
        <View style={{flex:1}}>
          <Text style={styles.curatedEyebrow}>AUSFLUGSTIPPS AUS DER REGION</Text>
          <Text style={styles.curatedTitle}>{CURATED_REGION.name}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={showCuratedRegion} style={styles.curatedMapBtn}>
          <Text style={styles.curatedMapBtnText}>⌖  Auf Karte</Text>
        </Pressable>
      </View>
      <Text style={[styles.micro,{marginTop:7,marginBottom:14}]}>
        {CURATED_FAMILY_PLACES.length} recherchierte Orte mit Adressen und Informationslinks – ohne Behauptungen über unbekannte Wickelmöglichkeiten.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10,paddingRight:9}}>
        {CURATED_FAMILY_PLACES.map((place,index)=><Pressable key={place.id}
            accessibilityRole="button" accessibilityLabel={place.title+' auf der Karte anzeigen'}
            onPress={()=>showPlace(place)} style={styles.curatedPlace}>
          <View style={styles.row}>
            <View style={styles.curatedPlaceIcon}><Text style={{fontSize:18,color:C.teal}}>
              {place.category==='playground'?'♧':'✿'}</Text></View>
            <Text style={styles.curatedPlaceNumber}>{index+1} / {CURATED_FAMILY_PLACES.length}</Text>
          </View>
          <Text style={styles.curatedPlaceTitle} numberOfLines={2}>{place.title}</Text>
          <Text style={styles.micro} numberOfLines={1}>⌖ {place.region_label}</Text>
          <Text style={[styles.micro,{marginTop:7,flex:1}]} numberOfLines={3}>{place.description}</Text>
          <Text style={styles.curatedPlaceLink}>Auf der Karte ansehen  ›</Text>
        </Pressable>)}
      </ScrollView>
      <Text style={[styles.micro,{marginTop:10}]}>Recherche: November 2026. Öffnungszeiten, Preise und Ausstattung bitte vor einem Besuch direkt prüfen.</Text>
    </View>
    <Text style={styles.section}>Stadt auswählen</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingRight:15}}>
      {CENTERS.map(c=><Chip key={c.name} label={c.name} selected={false} onPress={()=>visit(c)}/>)}
    </ScrollView>
    <View style={[styles.row,{marginTop:12,gap:9,alignItems:'stretch'}]}>
      <Pressable accessibilityRole="button" disabled={loading} onPress={()=>loadAround()}
       style={[styles.mainBtn,{flex:1,opacity:loading?.6:1}]}>
        <Text style={styles.mainBtnText}>{loading?'Orte werden gesucht …':'⌕  Hier nach Orten suchen'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={()=>{setCenter({latitude:51.2,longitude:10.45,zoom:5.3});setOsm([]);
       if(ready)map.current?.injectJavaScript('window.ffMap&&window.ffMap.flyTo(51.2,10.45,5.3);true;');}}
       style={styles.outlineBtn}><Text style={styles.outlineText}>DE</Text></Pressable>
    </View>
    {loading?<ActivityIndicator color={C.teal} style={{marginTop:9}}/>:null}
    {searchError?<View style={styles.warn}><Text style={styles.warnText}>{searchError}</Text></View>:null}
    {notice?<View style={styles.tip}><Text style={styles.tipText}>{notice}</Text></View>:null}
    <Text style={styles.section}>Was sucht ihr?</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingRight:15}}>
      {TYPES.map(([id,label,icon])=><Chip key={id} label={icon+' '+label} selected={types===id} onPress={()=>{setTypes(id);setSelectedId(null);}}/>)}
    </ScrollView>
    <Text style={[styles.micro,{marginTop:12}]}>Orte aus OpenStreetMap sind nicht von Familienfunke überprüft. Ein Wickeltisch ist nur dann als vorhanden markiert, wenn die Quelle oder der Eintrag das ausdrücklich angibt.</Text>
    {selected?<View style={styles.selectedCard}>
      <Text style={styles.cardEyebrow}>{typeLabel(selected.category)} · {selected.source==='osm'?'OpenStreetMap':selected.source==='curated'?'Redaktioneller Ausflugstipp':selected.moderation_status==='pending'?'Dein Vorschlag in Prüfung':'Familien-Tipp'}</Text>
      <Text style={styles.selectedTitle}>{selected.title}</Text>
      <Text style={styles.micro}>{selected.description||'Keine Beschreibung hinterlegt.'}</Text>
      {selected.address?<Text style={[styles.micro,{marginTop:8}]}>⌖ {selected.address}</Text>:null}
      {selected.source==='curated'?<Text style={[styles.micro,{marginTop:8}]}>Quelle geprüft im November 2026. Aktuelle Besuchsbedingungen beim Anbieter erfragen.</Text>:null}
      {selected.info_url?<Pressable accessibilityRole="link" onPress={()=>Linking.openURL(selected.info_url).catch(()=>{})}
        style={styles.minorBtn}><Text style={styles.minorBtnText}>Offizielle Informationen öffnen ↗</Text></Pressable>:null}
      {selected.has_changing_table?<Text style={styles.tagGood}>Wickelmöglichkeit angegeben</Text>:null}
      <Pressable accessibilityRole="link" onPress={()=>openInOSM(selected)} style={styles.minorBtn}><Text style={styles.minorBtnText}>In OpenStreetMap ansehen ↗</Text></Pressable>
    </View>:null}
    <View style={[styles.row,{justifyContent:'space-between',marginTop:24}]}>
      <Text style={styles.sectionNoMargin}>Orte im Kartenausschnitt</Text>
      <Text style={styles.micro}>{list.length} angezeigt</Text>
    </View>
    {!list.length?<View style={styles.empty}><Text style={styles.emptyTitle}>Noch keine Orte in dieser Ansicht</Text>
      <Text style={styles.micro}>Wähle eine Stadt, tippe auf „Hier nach Orten suchen“ oder trage einen neuen Ort ein.</Text>
    </View>:list.map(p=><Pressable key={p.id} accessibilityRole="button" onPress={()=>showPlace(p)} style={styles.placeRow}>
      <View style={styles.placeGlyph}><Text style={{fontSize:23,color:C.coral}}>{typeGlyph(p.category)}</Text></View>
      <View style={{flex:1}}><Text style={styles.placeTitle}>{p.title}</Text><Text style={styles.micro}>{typeLabel(p.category)} · {p.source==='osm'?'OpenStreetMap':p.source==='curated'?'Recherchierter Ausflugstipp':p.moderation_status==='pending'?'Nur für dich · in Prüfung':'Familien-Tipp'}</Text></View><Text style={styles.chevron}>›</Text>
    </Pressable>)}
    <View style={styles.suggestCard}>
      <Text style={styles.sectionNoMargin}>Kennt ihr noch einen tollen Ort?</Text>
      <Text style={[styles.micro,{marginTop:7}]}>Ihr könnt öffentlich zugängliche Spielplätze, Wickelmöglichkeiten und Ausflugsorte vorschlagen. Jeder neue Eintrag wird vor Veröffentlichung geprüft.</Text>
      <Pressable accessibilityRole="button" disabled={!active} onPress={()=>{setOpenForm(v=>!v);setSearchError('');}}
       style={[styles.mainBtn,{marginTop:13,opacity:active?1:0.45}]}><Text style={styles.mainBtnText}>{openForm?'Vorschlag schließen':'+ Familienort vorschlagen'}</Text></Pressable>
      {!active?<Text style={[styles.micro,{marginTop:6}]}>Vorschläge sind nur mit freigegebenem Familienkonto möglich.</Text>:null}
      {openForm?<View style={styles.form}>
        <Text style={styles.formTitle}>Öffentlichen Ort markieren</Text>
        <Text style={styles.micro}>Tippe oben auf der Karte an die richtige Stelle. Bitte keine privaten Wohnadressen oder Kinderstandorte eintragen.</Text>
        <Text style={[styles.coordinate,{marginTop:10}]}>{draftPoint?'✓ Ort auf Karte markiert':'Noch kein Punkt ausgewählt'}</Text>
        <Field label="Name des Ortes" value={name} onChange={setName} maxLength={100} placeholder="z. B. Spielplatz am Stadtpark"/>
        <Text style={[styles.label,{marginTop:13}]}>Art des Ortes</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>
          {TYPES.filter(t=>t[0]!=='all').map(([id,label])=><Chip key={id} label={label} selected={category===id} onPress={()=>setCategory(id)}/>)}
        </View>
        <Field label="Stadt oder Region (freiwillig)" value={region} onChange={setRegion} maxLength={80} placeholder="z. B. Fürstenwalde"/>
        <Field label="Was sollten Familien wissen?" value={description} onChange={setDescription} maxLength={600} multi placeholder="z. B. Schattenplätze, Zugang, Öffnungszeiten – nur wenn bekannt"/>
        <View style={[styles.row,{justifyContent:'space-between',marginTop:16}]}>
          <View style={{flex:1}}><Text style={styles.label}>Wickeltisch vorhanden?</Text><Text style={styles.micro}>Nur einschalten, wenn ihr euch sicher seid.</Text></View>
          <Switch value={changing} onValueChange={setChanging} trackColor={{true:C.teal}}/>
        </View>
        <Pressable accessibilityRole="button" onPress={submitPlace} style={[styles.mainBtn,{marginTop:17}]}>
          <Text style={styles.mainBtnText}>Ort zur Prüfung einreichen</Text>
        </Pressable>
      </View>:null}
      {pendingOwn.length?<Text style={[styles.micro,{marginTop:12}]}>{pendingOwn.length} {pendingOwn.length===1?'deiner Vorschläge wartet':'deiner Vorschläge warten'} auf Freigabe.</Text>:null}
      <Text style={[styles.micro,{marginTop:6}]}>{countApproved} freigegebene Familientipps bisher erfasst. Kein automatischer Wahrheits- oder Sicherheitsnachweis.</Text>
    </View>
    <Text style={[styles.micro,{marginTop:17}]}>Hinweis: Angaben zu Ausstattung, Öffnungszeiten, Barrierefreiheit und Wickeltischen können veraltet oder unvollständig sein. Bitte vor dem Besuch direkt beim Anbieter nachfragen. OpenStreetMap-Daten: © OpenStreetMap-Mitwirkende (ODbL).</Text>
  </ScrollView>;
}
const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:C.bg},body:{padding:16,paddingBottom:40},
 hero:{backgroundColor:'#FFF0CF',borderRadius:23,padding:19,marginBottom:12},
 eyebrow:{fontSize:10,fontWeight:'900',color:C.dark,letterSpacing:1.3,marginBottom:6},
 title:{fontSize:25,fontWeight:'900',color:C.ink},
 sub:{fontSize:13.5,color:C.ink,lineHeight:20,marginTop:7},
 mapFrame:{height:350,backgroundColor:'#E7F0ED',borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:C.line,position:'relative'},
 map:{flex:1,backgroundColor:'#E7F0ED'},mapLoading:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center',gap:10,backgroundColor:'#E7F0ED'},
 mapTag:{position:'absolute',top:12,left:11,backgroundColor:'#FFFFFFEE',paddingHorizontal:11,paddingVertical:7,borderRadius:12},
 mapTagText:{fontSize:11,fontWeight:'900',color:C.dark},
 micro:{fontSize:11.8,color:C.muted,lineHeight:18},section:{fontSize:18,fontWeight:'900',color:C.ink,marginTop:23,marginBottom:11},sectionNoMargin:{fontSize:17,fontWeight:'900',color:C.ink},
 row:{flexDirection:'row',alignItems:'center'},
 chip:{backgroundColor:C.pale,borderRadius:25,paddingHorizontal:14,paddingVertical:10,borderWidth:1,borderColor:'#CDE8E0'},
 chipActive:{backgroundColor:C.teal,borderColor:C.teal},chipText:{fontSize:12,fontWeight:'800',color:C.dark},
 mainBtn:{minHeight:46,borderRadius:15,backgroundColor:C.teal,alignItems:'center',justifyContent:'center',paddingHorizontal:13,paddingVertical:12},
 mainBtnText:{color:C.paper,fontWeight:'900',fontSize:13},
 outlineBtn:{borderRadius:15,minWidth:50,borderWidth:1.5,borderColor:C.teal,padding:11,alignItems:'center'},
 outlineText:{color:C.dark,fontWeight:'900'},
 warn:{backgroundColor:'#FFF0DA',padding:13,borderRadius:13,marginTop:11},warnText:{fontSize:12.2,color:'#80521A',lineHeight:19},
 tip:{backgroundColor:C.pale,padding:13,borderRadius:13,marginTop:11},tipText:{fontSize:12.5,color:C.dark,lineHeight:19},
 selectedCard:{backgroundColor:C.paper,borderRadius:18,padding:17,marginTop:15,borderWidth:1,borderColor:C.line},
 cardEyebrow:{fontSize:11,fontWeight:'900',color:C.teal,marginBottom:5},selectedTitle:{fontSize:19,fontWeight:'900',color:C.ink,marginBottom:7},
 tagGood:{color:C.dark,fontWeight:'800',fontSize:12,marginTop:9},
 minorBtn:{backgroundColor:C.pale,borderRadius:12,padding:10,alignSelf:'flex-start',marginTop:13},minorBtnText:{fontSize:12,fontWeight:'900',color:C.dark},
 empty:{borderRadius:18,backgroundColor:C.paper,padding:19,marginTop:11},emptyTitle:{fontSize:15,fontWeight:'900',color:C.ink,marginBottom:7},
 placeRow:{flexDirection:'row',alignItems:'center',gap:11,backgroundColor:C.paper,padding:12,borderRadius:15,marginTop:9,borderWidth:1,borderColor:C.line},
 placeGlyph:{width:39,height:39,borderRadius:13,backgroundColor:'#FFF1DA',alignItems:'center',justifyContent:'center'},
 placeTitle:{fontWeight:'900',fontSize:14,color:C.ink,marginBottom:4},chevron:{fontSize:24,color:C.teal},
 curatedBox:{backgroundColor:'#FFF1DE',borderWidth:1,borderColor:'#F5DEBA',borderRadius:22,padding:16,marginTop:15},
 curatedEyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:C.teal,marginBottom:4},
 curatedTitle:{fontSize:17.5,fontWeight:'900',color:C.ink},
 curatedMapBtn:{backgroundColor:C.teal,borderRadius:13,paddingHorizontal:11,paddingVertical:11},
 curatedMapBtnText:{fontSize:12,fontWeight:'900',color:C.paper},
 curatedPlace:{width:216,minHeight:196,borderRadius:17,backgroundColor:C.paper,borderWidth:1,borderColor:'#F0E0CD',padding:14},
 curatedPlaceIcon:{backgroundColor:C.pale,width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center'},
 curatedPlaceNumber:{fontSize:10,fontWeight:'900',color:C.muted,marginLeft:'auto'},
 curatedPlaceTitle:{fontSize:14.3,fontWeight:'900',color:C.ink,marginTop:11,marginBottom:4,minHeight:35},
 curatedPlaceLink:{fontSize:12,fontWeight:'900',color:C.teal,marginTop:10},
 suggestCard:{backgroundColor:C.paper,borderRadius:20,borderWidth:1,borderColor:C.line,padding:17,marginTop:24},
 form:{marginTop:15,borderTopWidth:1,borderTopColor:C.line,paddingTop:15},formTitle:{fontSize:15,fontWeight:'900',color:C.ink,marginBottom:6},
 label:{fontSize:12.5,fontWeight:'900',color:C.ink,marginBottom:7},
 field:{borderWidth:1,borderColor:'#DDDDD6',borderRadius:14,minHeight:47,backgroundColor:'#FFFEFC',color:C.ink,paddingHorizontal:13,paddingVertical:12,fontSize:14},
 coordinate:{fontSize:12,fontWeight:'900',color:C.teal},
});
