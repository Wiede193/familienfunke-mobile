import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,ActivityIndicator,Alert,Keyboard,Linking,Pressable,ScrollView,StyleSheet,Switch,Text,TextInput,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {supabase} from './supabase';
import SearchResultFeedback from './SearchResultFeedback';
import {FAMILY_COLORS} from './FamilyTheme';
import {FAMILY_UI as UI,FAMILY_RADII as R} from './FamilyTheme';
import {CURATED_REGION,CURATED_FAMILY_PLACES} from './FamilyMapCurated';
import {BRANDENBURG_FAMILY_PLACES,BRANDENBURG_FAMILY_FOCUS,describePlaceAccessibility} from './FamilyMapBrandenburg';
import {NATIONAL_FAMILY_PLACES,NATIONAL_TYPES,NATIONAL_AREAS} from './FamilyMapNational';
import {findFamilyMapLocations,mergeMapSearchResults} from './FamilyMapSearch';

const C=FAMILY_COLORS;
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
  '.search-pin{display:flex;flex-direction:column;align-items:center;min-width:40px;cursor:pointer;}',
  '.search-dot{width:40px;height:40px;box-sizing:border-box;border-radius:22px;border:3px solid #075A60;',
  'display:flex;align-items:center;justify-content:center;font:900 16px system-ui,sans-serif;',
  'background:#FFDD79;color:#253D43;box-shadow:0 3px 8px #163D4380;}',
  '.search-pin.selected .search-dot{background:#075A60;color:#fff;border-color:#FFDD79;',
  'box-shadow:0 0 0 4px #fff,0 5px 12px #163D4399;}',
  '.search-caption{display:none;max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
  'background:#fff;padding:6px 9px;border-radius:9px;margin-top:4px;color:#253D43;',
  'font:800 12px system-ui,sans-serif;box-shadow:0 2px 6px #163D4344;}',
  '.search-pin.selected .search-caption{display:block;}',
  '.draft-pin{width:18px;height:18px;background:#ED7867;border:3px solid white;border-radius:9px;',
  'box-shadow:0 0 0 4px rgba(238,120,103,.25);}</style></head><body><div id="map"></div>',
  '<script type="module">',
  'const sendDiagnostic=(stage,message)=>window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:"diagnostic",stage,message:String(message).slice(0,300)}));',
  'window.addEventListener("unhandledrejection",e=>sendDiagnostic("promise",e.reason));',
  'window.addEventListener("error",e=>sendDiagnostic("script",e.message));',
  'let ml;try{ml=await import("https://cdn.jsdelivr.net/npm/maplibre-gl@6.16.0/dist/maplibre-gl.mjs");sendDiagnostic("module","loaded");}catch(e){sendDiagnostic("module",e);window.ReactNativeWebView.postMessage(JSON.stringify({type:"error"}));throw e;}',
  'const send=(payload)=>window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(payload));',
  'try{',
  'const map=new ml.Map({container:"map",style:"https://tiles.openfreemap.org/styles/liberty",',
  'center:[10.45,51.2],zoom:5.3,minZoom:4,attributionControl:{compact:false}});',
  'map.addControl(new ml.NavigationControl({showCompass:false}),"top-right");',
  'let markers=[];let draft=null;let searchMarkers=[];let searchActive=false;',
  'const reducedMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;',
  'const searchSelection=(id)=>{searchMarkers.forEach(m=>{const el=m.getElement();',
  'el.classList.toggle("selected",!!id&&el.dataset.searchId===id);});};',
  'const zoomToSearch=()=>{if(!searchMarkers.length)return;',
  'const coords=searchMarkers.map(m=>m.getLngLat());',
  'if(coords.length===1){map.easeTo({center:[coords[0].lng,coords[0].lat],zoom:12.4,duration:reducedMotion?0:450});return;}',
  'const b=new ml.LngLatBounds();coords.forEach(p=>b.extend([p.lng,p.lat]));',
  'map.fitBounds(b,{padding:55,maxZoom:12.4,duration:reducedMotion?0:450});};',
  'const glyph={playground:"♧",changing:"♥",outing:"✿",other:"◇"};',
  'const color={playground:"#0B8488",changing:"#EE7867",outing:"#9272B8",other:"#E0AB42"};',
  'window.ffMap={',
  'flyTo:function(lat,lon,zoom){map.flyTo({center:[lon,lat],zoom:zoom||12,duration:reducedMotion?0:450});},',
  'setDraft:function(point){if(draft){draft.remove();draft=null;}if(!point)return;',
  'const el=document.createElement("div");el.className="draft-pin";draft=new ml.Marker({element:el}).setLngLat([point.longitude,point.latitude]).addTo(map);},',
  'setPins:function(items){markers.forEach(m=>m.remove());markers=[];',
  'items.forEach(p=>{if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))return;',
  'const el=document.createElement("div");el.className="pin";el.style.background=color[p.category]||"#E0AB42";',
  'el.style.display=searchActive?"none":"flex";',
  'el.style.color="white";el.textContent=glyph[p.category]||"◇";el.setAttribute("aria-label",p.title||"Familienort");',
  'el.addEventListener("click",ev=>{ev.stopPropagation();send({type:"pin",id:p.id});});',
  'markers.push(new ml.Marker({element:el,anchor:"center"}).setLngLat([p.longitude,p.latitude]).addTo(map));});},',
  'setSearchResults:function(payload){searchMarkers.forEach(m=>m.remove());searchMarkers=[];',
  'const items=Array.isArray(payload&&payload.items)?payload.items:[];',
  'searchActive=!!(payload&&payload.active);',
  'markers.forEach(m=>{m.getElement().style.display=searchActive?"none":"flex";});',
  'if(!searchActive)return;',
  'items.slice(0,10).forEach((p,i)=>{if(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))return;',
  'const el=document.createElement("div");el.className="search-pin";el.dataset.searchId=String(p.id);',
  'el.setAttribute("aria-label",String(p.title||"Ort"));',
  'const dot=document.createElement("span");dot.className="search-dot";dot.textContent=String(i+1);',
  'const caption=document.createElement("span");caption.className="search-caption";',
  'caption.textContent=String(p.title||"Familienort");el.appendChild(dot);el.appendChild(caption);',
  'el.addEventListener("click",e=>{e.stopPropagation();send({type:"searchPin",id:p.id});});',
  'searchMarkers.push(new ml.Marker({element:el,anchor:"bottom"}).setLngLat([p.longitude,p.latitude]).addTo(map));',
  '});searchSelection(payload&&payload.selectedId);},',
  'setSearchSelection:function(id){searchSelection(id);},',
  'setPathLayer:function(kind){["bike","walk"].forEach(v=>{const id="ff-"+v+"-paths";',
  'if(map.getLayer(id))map.setLayoutProperty(id,"visibility",kind===v?"visible":"none");});},',
  'zoomBy:function(delta){map.easeTo({zoom:map.getZoom()+delta,duration:reducedMotion?0:300});},',
  'fitSearchResults:function(){zoomToSearch();}',
  '};',
  'function addPathLayer(id,color,subclasses){map.addLayer({id,type:"line",source:"openmaptiles",',
  '"source-layer":"transportation",minzoom:9,',
  'filter:["all",["==",["geometry-type"],"LineString"],["in",["get","subclass"],["literal",subclasses]]],',
  'layout:{"visibility":"none","line-cap":"round","line-join":"round"},',
  'paint:{"line-color":color,"line-width":["interpolate",["linear"],["zoom"],9,2,13,3.5,16,5],',
  '"line-opacity":0.9}});}',
  'map.on("load",()=>{try{',
  'if(!map.getSource("openmaptiles"))throw Error("No vector transport source");',
  'addPathLayer("ff-bike-paths","#0B777A",["cycleway"]);',
  'addPathLayer("ff-walk-paths","#B9474C",["footway","path","track","pedestrian"]);',
  '}catch(e){send({type:"pathsError"});}send({type:"ready"});});',
  'map.on("moveend",()=>{const p=map.getCenter();send({type:"move",latitude:p.lat,longitude:p.lng,zoom:map.getZoom()});});',
  'map.on("idle",()=>{try{const p=map.getCenter();const count=map.queryRenderedFeatures().filter(f=>f.source==="openmaptiles").length;send({type:"rendered",count,latitude:p.lat,longitude:p.lng,zoom:map.getZoom()});}catch(e){}});',
  'map.on("error",e=>{sendDiagnostic("map-resource",e.error&&e.error.message||"unknown");send({type:"resourceError"});});',
  'map.getCanvas().addEventListener("webglcontextlost",()=>sendDiagnostic("webgl","context lost"));',
  'map.on("click",(e)=>send({type:"tap",latitude:e.lngLat.lat,longitude:e.lngLat.lng}));',
  '}catch(e){sendDiagnostic("map-init",e);send({type:"error",message:"Die Vektorkarte konnte nicht gestartet werden."});}',
  '</script></body></html>'
].join('\n');

function Chip({label,selected,onPress}){
  return <Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress}
   style={[styles.chip,selected&&styles.chipActive]}><Text style={[styles.chipText,selected&&{color:C.paper}]}>{label}</Text></Pressable>;
}
function Field({label,value,onChange,maxLength=100,multi=false,placeholder}){
  return <View style={{marginTop:13}}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label}
   placeholder={placeholder} placeholderTextColor="#81999C" value={value} onChangeText={onChange}
   maxLength={maxLength} multiline={multi} style={[styles.field,multi&&{minHeight:85,textAlignVertical:'top'}]}/></View>;
}
const mapScript=(method,arg)=>{
  const obj=JSON.stringify(arg??null).replace(/</g,'\\u003c');
  return 'window.ffMap&&window.ffMap.'+method+'('+obj+');true;';
};
function pinSetScript(items){
  return mapScript('setPins',items.map(({id,title,category,latitude,longitude})=>({id,title,category,latitude,longitude})));
}
function inGermany(lat,lon){
  return valid(lat)&&valid(lon)&&lat>=47&&lat<=55.2&&lon>=5.5&&lon<=15.6;
}
export default function FamilyMapScreen({userId,active,addPlace,entryPlaceId,entryLayer='none',onCalendar}){
  const map=useRef(null);
  const scroll=useRef(null);
  const mapOffset=useRef(0);
  const [ready,setReady]=useState(false);
  const [mapError,setMapError]=useState('');
  const [mapAttempt,setMapAttempt]=useState(0),[rendered,setRendered]=useState(false),[qaMap,setQaMap]=useState('');
  const [resourceError,setResourceError]=useState(false);
  const readyTimeout=useRef(null);
  const qaOnline=process.env.EXPO_PUBLIC_QA_ONLINE==='1';
  useEffect(()=>{readyTimeout.current=setTimeout(()=>setMapError('Die Karte reagiert nicht. Bitte erneut laden.'),20000);return()=>clearTimeout(readyTimeout.current);},[mapAttempt]);
  function retryMap(){setReady(false);setRendered(false);setResourceError(false);setPathsError(false);setMapError('');setQaMap('');setMapAttempt(n=>n+1);}
  function failMap(){clearTimeout(readyTimeout.current);setReady(false);setRendered(false);setMapError('Die Vektorkarte konnte nicht geladen werden.');}
  const [pathsError,setPathsError]=useState(false);
  const [pathLayer,setPathLayer]=useState(['bike','walk'].includes(entryLayer)?entryLayer:'none');
  const [center,setCenter]=useState({latitude:51.2,longitude:10.45,zoom:5.3});
  const [types,setTypes]=useState('all');
  const [nationalType,setNationalType]=useState('all');
  const [nationalArea,setNationalArea]=useState('all');
  const [brandenburgFocus,setBrandenburgFocus]=useState('all');
  const [showCatalog,setShowCatalog]=useState(false);
  const [showMapOptions,setShowMapOptions]=useState(entryLayer!=='none');
  const [openForm,setOpenForm]=useState(false);
  const [draftPoint,setDraftPoint]=useState(null);
  const [latitudeInput,setLatitudeInput]=useState('');
  const [longitudeInput,setLongitudeInput]=useState('');
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
  const [placeQuery,setPlaceQuery]=useState('');
  const [selectedSearchId,setSelectedSearchId]=useState(null);
  const [geoResults,setGeoResults]=useState([]);
  const [geoStatus,setGeoStatus]=useState('idle');
  const geoRequest=useRef(0);
  const fitTimer=useRef(null);
  useEffect(()=>()=>{geoRequest.current++;},[]);

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
  const nationalShown=useMemo(()=>NATIONAL_FAMILY_PLACES.filter(p=>
    (nationalType==='all'||p.kind===nationalType)
    && (nationalArea==='all'||p.area===nationalArea)
  ),[nationalType,nationalArea]);
  const all=useMemo(()=>{
    const curated=[...CURATED_FAMILY_PLACES,...BRANDENBURG_FAMILY_PLACES,...nationalShown];
    const curatedOSM=new Set(curated.map(p=>p.osm_key).filter(Boolean));
    const places=[...curated,...community,...osm.filter(p=>!curatedOSM.has(p.id))];
    return places.filter(p=>inGermany(p.latitude,p.longitude) && (types==='all'||p.category===types));
  },[community,osm,types,nationalShown]);
  const localMatches=useMemo(()=>findFamilyMapLocations(placeQuery,{
    centers:CENTERS,curated:[...CURATED_FAMILY_PLACES,...BRANDENBURG_FAMILY_PLACES],national:NATIONAL_FAMILY_PLACES,
    community,osm
  }),[placeQuery,community,osm]);
  const locationMatches=useMemo(()=>mergeMapSearchResults(localMatches,geoResults),[localMatches,geoResults]);
  const selectedSearchMatch=locationMatches.find(match=>match.id===selectedSearchId)||null;
  const selected=all.find(p=>p.id===selectedId)||null;
  const selectedAccess=describePlaceAccessibility(selected);
  useEffect(()=>{if(ready)map.current?.injectJavaScript(pinSetScript(all));},[all,ready]);
  useEffect(()=>{if(ready)map.current?.injectJavaScript(mapScript('setPathLayer',pathLayer));},[pathLayer,ready]);
  useEffect(()=>{if(['bike','walk'].includes(entryLayer))setPathLayer(entryLayer);},[entryLayer]);
  // Arriving from Sport & Gesundheit starts in the project pilot region at street-level zoom.
  // This does not track the user's location.
  useEffect(()=>{
    if(!ready||!['bike','walk'].includes(entryLayer))return;
    const {latitude,longitude}=CURATED_REGION;
    const zoom=10.8;
    setCenter({latitude,longitude,zoom});
    map.current?.injectJavaScript('window.ffMap&&window.ffMap.flyTo('+latitude+','+longitude+','+zoom+');true;');
  },[ready,entryLayer]);
  useEffect(()=>{
    if(!ready)return;
    const active=placeQuery.trim().length>=2;
    map.current?.injectJavaScript(mapScript('setSearchResults',{
      active,selectedId:selectedSearchId,
      items:locationMatches.map(({id,title,latitude,longitude})=>({id,title,latitude,longitude}))
    }));
    if(!active||!locationMatches.length||locationMatches.some(m=>m.id===selectedSearchId))return;
    // Debounce fitting: the pins update immediately, but typing does not cause a jump every keystroke.
    fitTimer.current=setTimeout(()=>map.current?.injectJavaScript(mapScript('fitSearchResults')),320);
    return ()=>clearTimeout(fitTimer.current);
  },[ready,placeQuery,locationMatches]);
  useEffect(()=>{
    if(ready)map.current?.injectJavaScript(mapScript('setSearchSelection',selectedSearchId));
  },[ready,selectedSearchId]);
  useEffect(()=>{
    if(ready)map.current?.injectJavaScript(mapScript('setDraft',draftPoint));
  },[draftPoint,ready]);
  function changePlaceQuery(value){
    geoRequest.current++;
    setPlaceQuery(value);setGeoResults([]);setGeoStatus('idle');
    setSelectedSearchId(null);setSelectedId(null);
  }
  async function searchGermany(){
    const query=placeQuery.trim();
    if(query.length<3||geoStatus==='loading')return;
    Keyboard.dismiss();
    const request=++geoRequest.current;
    setGeoStatus('loading');setGeoResults([]);setSelectedSearchId(null);setSelectedId(null);
    try{
      const {data,error}=await supabase.functions.invoke('ff-geocode',{body:{query}});
      if(request!==geoRequest.current)return;
      if(error||!Array.isArray(data?.places)){
        setGeoStatus(error?.context?.status===429?'quota':'error');return;
      }
      setGeoResults(data.places);setGeoStatus(data.places.length?'done':'empty');
      AccessibilityInfo.announceForAccessibility(data.places.length+' deutschlandweite Suchtreffer.');
      scroll.current?.scrollTo({y:Math.max(0,mapOffset.current-12),animated:false});
    }catch{if(request===geoRequest.current)setGeoStatus('error');}
  }
  function searchNearMatch(match){
    changePlaceQuery('');
    setTypes('all');setNationalArea('all');setNationalType('all');
    setCenter({latitude:match.latitude,longitude:match.longitude,zoom:13.2});
    if(ready)map.current?.injectJavaScript('window.ffMap&&window.ffMap.flyTo('+match.latitude+','+match.longitude+',13.2);true;');
    loadAround(match.latitude,match.longitude,13.2);
  }
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
  function visit({latitude,longitude,lat,lon}){
    latitude=Number(latitude??lat);longitude=Number(longitude??lon);
    if(!inGermany(latitude,longitude))return;
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
  function showAllGermany(){
    changePlaceQuery('');
    setNationalType('all');setNationalArea('all');setTypes('all');setSelectedId(null);
    setCenter({latitude:51.2,longitude:10.45,zoom:5.3});setSearchError('');
    if(ready)map.current?.injectJavaScript('window.ffMap&&window.ffMap.flyTo(51.2,10.45,5.3);true;');
  }
  function showCuratedRegion(){
    changePlaceQuery('');
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
    if(value.type==='diagnostic'){if(qaOnline)console.log('QA map diagnostic',String(value.stage),String(value.message));return;}
    if(value.type==='ready'){
      setReady(true);setMapError('');
      if(inGermany(center.latitude,center.longitude)&&Number.isFinite(center.zoom))map.current?.injectJavaScript('window.ffMap&&window.ffMap.flyTo('+Number(center.latitude)+','+Number(center.longitude)+','+Number(center.zoom)+');true;');
    }
    else if(value.type==='rendered'&&Number.isFinite(value.count)&&value.count>0&&Number.isFinite(value.latitude)&&Number.isFinite(value.longitude)&&Number.isFinite(value.zoom)){
      clearTimeout(readyTimeout.current);setRendered(true);setMapError('');setResourceError(false);
      if(qaOnline){const city=Math.abs(value.latitude-52.52)<.08&&Math.abs(value.longitude-13.405)<.08&&value.zoom>=12;
       const label=city?(value.zoom>=13?'QA: Berlin gezoomt':'QA: Berlin gerendert'):'QA: Karte gerendert';
       setQaMap(label);console.log('QA map rendered',JSON.stringify(value));}
    }
    else if(value.type==='resourceError'){setResourceError(true);}
    else if(value.type==='error')failMap();
    else if(value.type==='pathsError')setPathsError(true);
    else if(value.type==='move'&&valid(value.latitude)&&valid(value.longitude)&&valid(value.zoom)){
      setCenter({latitude:value.latitude,longitude:value.longitude,zoom:value.zoom});
    }else if(value.type==='tap'&&inGermany(value.latitude,value.longitude)){
      if(openForm){
        const latitude=Math.round(value.latitude*100000)/100000;
        const longitude=Math.round(value.longitude*100000)/100000;
        setDraftPoint({latitude,longitude});
        setLatitudeInput(String(latitude));
        setLongitudeInput(String(longitude));
        setSelectedId(null);
      }
    }else if(value.type==='searchPin'&&typeof value.id==='string'){
      const match=locationMatches.find(x=>x.id===value.id);
      if(match)selectSearchedLocation(match);
    }else if(value.type==='pin'&&all.some(p=>p.id===value.id)){
      setSelectedId(value.id);
      scroll.current?.scrollTo({y:Math.max(0,mapOffset.current-12),animated:false});
    }
  }
  function markCoordinates(){
    const latitude=Number(latitudeInput.trim().replace(',', '.'));
    const longitude=Number(longitudeInput.trim().replace(',', '.'));
    if(!latitudeInput.trim()||!longitudeInput.trim()||
       !inGermany(latitude,longitude)){
      setSearchError('Bitte gültige Koordinaten in Deutschland eingeben, zum Beispiel 52,36 und 14,06.');
      return;
    }
    const point={
      latitude:Math.round(latitude*100000)/100000,
      longitude:Math.round(longitude*100000)/100000
    };
    setDraftPoint(point);
    setSelectedId(null);
    setSearchError('');
    setNotice('Öffentlicher Ort mit Koordinaten markiert. Prüfe den Punkt vor dem Einreichen.');
    if(ready)map.current?.injectJavaScript('window.ffMap&&window.ffMap.flyTo('+point.latitude+','+point.longitude+',15);true;');
  }
  async function submitPlace(){
    if(!active)return;
    if(!draftPoint)return setSearchError('Markiere den öffentlichen Ort auf der Karte oder gib seine Koordinaten ein.');
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
      setDraftPoint(null);setLatitudeInput('');setLongitudeInput('');setNotice('Danke! Dein Ort ist eingereicht und für andere erst nach Prüfung sichtbar.');
      await fetchCommunity();
    }
  }
  const countApproved=community.filter(p=>p.moderation_status==='approved').length;
  const pendingOwn=community.filter(p=>p.submitted_by===userId&&p.moderation_status==='pending');
  const list=all.filter(p=>Math.abs(p.latitude-center.latitude)<0.22&&Math.abs(p.longitude-center.longitude)<0.32).slice(0,30);
  // Only resolve known catalogue IDs from the planner; never trust arbitrary coordinates.
  useEffect(()=>{
    if(!entryPlaceId)return;
    const place=[...CURATED_FAMILY_PLACES,...BRANDENBURG_FAMILY_PLACES,...NATIONAL_FAMILY_PLACES].find(p=>p.id===entryPlaceId);
    if(!place||!inGermany(place.latitude,place.longitude))return;
    showPlace(place);
    if(ready)scroll.current?.scrollTo({y:Math.max(0,mapOffset.current-12),animated:false});
  },[entryPlaceId,ready]);
  function showPlace(place){
    scroll.current?.scrollTo({y:Math.max(0,mapOffset.current-12),animated:false});
    setNationalType('all');setNationalArea('all');setTypes('all');
    setSelectedId(place.id);
    setCenter({latitude:place.latitude,longitude:place.longitude,zoom:13.2});
    if(ready)map.current?.injectJavaScript(
      'window.ffMap&&window.ffMap.flyTo('+Number(place.latitude)+','+Number(place.longitude)+',13.2);true;'
    );
  }
  function selectSearchedLocation(match){
    clearTimeout(fitTimer.current);
    setSelectedSearchId(match.id);
    Keyboard.dismiss();
    scroll.current?.scrollTo({y:Math.max(0,mapOffset.current-12),animated:false});
    AccessibilityInfo.announceForAccessibility(match.source==='city'
      ?'Stadt '+match.title+' ausgewählt. Hier nach Orten suchen ist unter der Karte verfügbar.'
      :match.title+' ausgewählt. Die Ortsdetails stehen weiter unten.');
    if(match.source==='city')visit({
      name:match.title,latitude:match.latitude,longitude:match.longitude
    });
    else if(match.source==='geocode'){
      setSelectedId(null);
      const zoom=match.kind==='Adresse'||match.kind==='Straße'?16:12.8;
      setCenter({latitude:match.latitude,longitude:match.longitude,zoom});
      if(ready)map.current?.injectJavaScript('window.ffMap&&window.ffMap.flyTo('+match.latitude+','+match.longitude+','+zoom+');true;');
    }else showPlace(match.place);
  }
  function openInOSM(place){
    const url='https://www.openstreetmap.org/?mlat='+encodeURIComponent(place.latitude)+'&mlon='+encodeURIComponent(place.longitude)
      +'#map=16/'+encodeURIComponent(place.latitude)+'/'+encodeURIComponent(place.longitude);
    Linking.openURL(url).catch(()=>{});
  }
  async function openDirections(place,service){
    // Nur die Zielkoordinaten werden übergeben – kein GPS-Zugriff in Familienfunke.
    const lat=Number(place.latitude),lon=Number(place.longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||!inGermany(lat,lon)){
      Alert.alert('Navigation nicht möglich','Die Koordinaten dieses Ortes sind ungültig.');
      return;
    }
    const destination=encodeURIComponent(lat+','+lon);
    const url=service==='apple'
      ?'https://maps.apple.com/?daddr='+destination
      :'https://www.google.com/maps/dir/?api=1&destination='+destination;
    try{await Linking.openURL(url);}
    catch{Alert.alert('Karten-App nicht erreichbar','Der Kartendienst konnte nicht geöffnet werden. Bitte versuche es erneut.');}
  }
  return <ScrollView ref={scroll} style={styles.page} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
    <View style={styles.locationSearch}>
      <Text accessibilityRole="header" style={styles.sectionNoMargin}>Ort oder Ausflugsziel suchen</Text>
      <TextInput accessibilityLabel="Stadt oder Ausflugsziel suchen" accessibilityHint="Auch Postleitzahl, Straße und öffentliche Adresse möglich. Deutschlandweite Suche mit der Suchtaste starten."
        value={placeQuery} onChangeText={changePlaceQuery}
        style={styles.field} placeholder="z. B. 15230, Rathausplatz oder Berlin"
        placeholderTextColor={C.muted} maxLength={160}
        autoCorrect={false} returnKeyType="search" onSubmitEditing={searchGermany}/>
      <Text style={[styles.micro,{marginTop:7}]}>Online-Suche: Suchtext über unseren Server an Photon, kein GPS. Bitte keine privaten Wohnadressen oder Namen eingeben.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{disabled:geoStatus==='loading'||placeQuery.trim().length<3,busy:geoStatus==='loading'}}
        disabled={geoStatus==='loading'||placeQuery.trim().length<3} onPress={searchGermany}
        style={[styles.mainBtn,{minHeight:48,marginTop:10,opacity:geoStatus==='loading'||placeQuery.trim().length<3?0.5:1}]}>
        <Text style={styles.mainBtnText}>{geoStatus==='loading'?'Deutschlandweite Suche läuft …':'Deutschlandweit suchen'}</Text>
      </Pressable>
      {placeQuery?<Pressable accessibilityRole="button" onPress={()=>changePlaceQuery('')} style={[styles.outlineBtn,{minHeight:44,marginTop:8}]}>
        <Text style={styles.outlineText}>Suche zurücksetzen</Text>
      </Pressable>:null}
      <SearchResultFeedback active={placeQuery.trim().length>=2} context="Kartensuche" query={placeQuery}
        count={locationMatches.length} loading={geoStatus==='loading'} hasMore={locationMatches.length>12}
        hint="Passenden Ort direkt auswählen. Externe Ergebnisse sind keine geprüften Familienempfehlungen."/>
      {placeQuery.trim().length>=2?
        <View style={styles.searchResultPanel}>
          <Text accessibilityLiveRegion="polite" style={[styles.micro,{marginBottom:6}]}>
            {locationMatches.length} {locationMatches.length===1?'passender Ort':'passende Orte'} · Familienfunke und Kartensuche
          </Text>
          {locationMatches.slice(0,12).map(match=><Pressable key={match.id}
            accessibilityRole="button" accessibilityState={{selected:selectedSearchId===match.id}}
            accessibilityLabel={match.title+', '+match.subtitle+', auf der Karte anzeigen'}
            onPress={()=>selectSearchedLocation(match)}
            style={[styles.searchResult,selectedSearchId===match.id&&styles.searchResultSelected]}>
            <View style={{flex:1}}>
              <Text style={styles.placeTitle}>{locationMatches.indexOf(match)+1}. {match.title}</Text>
              <Text style={styles.micro}>{match.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>)}
          {locationMatches.length===0?<Text style={styles.micro}>
            Noch keine Treffer. Nutze „Deutschlandweit suchen“ oder passe deinen Suchbegriff an.
          </Text>:null}
        </View>:null}
      {geoStatus==='quota'||geoStatus==='error'||geoStatus==='empty'?<Text accessibilityLiveRegion="polite" style={[styles.micro,{marginTop:9}]}>
        {geoStatus==='quota'?'Suchlimit erreicht oder Dienst ausgelastet. Bitte später erneut versuchen.':geoStatus==='error'?'Die deutschlandweite Suche ist gerade nicht erreichbar. Familienfunke-Tipps bleiben verfügbar.':'Keine weiteren Kartentreffer gefunden. Prüfe die Schreibweise oder ergänze die Stadt.'}
      </Text>:null}
    </View>
    <Pressable accessibilityRole="button" accessibilityState={{expanded:showMapOptions}} onPress={()=>setShowMapOptions(v=>!v)} style={[styles.outlineBtn,{marginTop:10,marginBottom:8,minHeight:44}]}><Text style={styles.outlineText}>Kartenoptionen {showMapOptions?'−':'+'}{pathLayer!=='none'?' · Wege aktiv':''}</Text></Pressable>
    {showMapOptions?<View style={{marginTop:4,marginBottom:12}}>
      <Text accessibilityRole="header" style={styles.sectionNoMargin}>Kartenebene: Bewegung & Natur</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingTop:10,paddingRight:15}}>
        <Chip label="Normale Karte" selected={pathLayer==='none'} onPress={()=>setPathLayer('none')}/>
        <Chip label="Radwege" selected={pathLayer==='bike'} onPress={()=>setPathLayer('bike')}/>
        <Chip label="Wander- & Fußwege" selected={pathLayer==='walk'} onPress={()=>setPathLayer('walk')}/>
      </ScrollView>
      {pathLayer!=='none'?<Text style={[styles.micro,{marginTop:9}]}>
        OpenStreetMap-Wegenetz ab höherem Kartenzoom. Familienorte bleiben als Hotspots sichtbar.
        Keine geprüften Touren, keine garantierte Rad-/Wander-Eignung oder Barrierefreiheit.
      </Text>:null}
      {pathsError?<Text accessibilityRole="alert" style={[styles.micro,{color:C.danger,marginTop:6}]}>
        Die zusätzliche Wegeebene ist beim Kartendienst derzeit nicht verfügbar. Die Familienorte bleiben nutzbar.
      </Text>:null}
    </View>:null}
    <View style={styles.mapFrame} onLayout={event=>{mapOffset.current=event.nativeEvent.layout.y;}}>
      <WebView key={mapAttempt} ref={map} originWhitelist={['*']} source={{html:MAP_HTML}} androidLayerType="hardware"
       accessible={false} importantForAccessibility="no-hide-descendants"
       javaScriptEnabled domStorageEnabled scrollEnabled={false}
       style={styles.map} onMessage={onMapMessage} onError={failMap} onRenderProcessGone={failMap} onContentProcessDidTerminate={failMap}
       setSupportMultipleWindows={false} allowsInlineMediaPlayback/>
      {!rendered&&!mapError?<View pointerEvents="none" style={styles.mapLoading}><ActivityIndicator color={C.teal}/><Text style={styles.micro}>Vektorkarte laden …</Text></View>:null}
      <View pointerEvents="none" style={styles.mapTag}><Text style={styles.mapTagText}>
        {placeQuery.trim().length>=2?'Suchtreffer auf der Karte: '+locationMatches.length:pathLayer==='bike'?'Radwege · Familien-Hotspots':pathLayer==='walk'?'Fußwege · Familien-Hotspots':'Vektorkarte · Deutschland'}
      </Text></View>
    </View>
    {selectedSearchMatch?<View accessibilityLiveRegion="polite" style={styles.mapSelectedInfo}>
      <Pressable accessibilityRole="button" accessibilityLabel="Suchtrefferdetails schließen" onPress={()=>{setSelectedSearchId(null);setSelectedId(null);}} style={[styles.outlineBtn,{alignSelf:'flex-end',minHeight:44,marginBottom:8}]}><Text style={styles.outlineText}>Schließen ×</Text></Pressable>
      <Text accessibilityRole="header" style={styles.selectedTitle}>{selectedSearchMatch.title}</Text>
      <Text style={styles.micro}>{selectedSearchMatch.subtitle}{ready?' · Auf der Karte hervorgehoben':''}</Text>
      {selectedSearchMatch.source==='geocode'?<View><Text style={[styles.micro,{marginTop:8}]}>Externer Kartentreffer, keine geprüfte Familienfunke-Empfehlung. Adressdaten können unvollständig sein.</Text><Pressable accessibilityRole="link" onPress={()=>openDirections(selectedSearchMatch,'google')} style={[styles.minorBtn,{minHeight:44}]}><Text style={styles.minorBtnText}>Route in Google Maps öffnen ↗</Text></Pressable><Pressable accessibilityRole="link" onPress={()=>openDirections(selectedSearchMatch,'apple')} style={[styles.minorBtn,{minHeight:44}]}><Text style={styles.minorBtnText}>Route in Apple Karten öffnen ↗</Text></Pressable></View>:null}
      {(selectedSearchMatch.source==='city'||selectedSearchMatch.source==='geocode')?<Pressable accessibilityRole="button"
         accessibilityLabel={'Familienorte in der Umgebung von '+selectedSearchMatch.title+' laden'}
         accessibilityState={{disabled:loading}} disabled={loading}
         onPress={()=>searchNearMatch(selectedSearchMatch)}
         style={[styles.mainBtn,{marginTop:11}]}>
         <Text style={styles.mainBtnText}>Familienorte in dieser Umgebung suchen</Text>
       </Pressable>:null}
    </View>:null}
    {selected?<View style={styles.selectedCard}>
      <Pressable accessibilityRole="button" accessibilityLabel="Ortsdetails schließen" onPress={()=>{setSelectedId(null);setSelectedSearchId(null);}} style={[styles.outlineBtn,{alignSelf:'flex-end',marginBottom:10,minHeight:44}]}><Text style={styles.outlineText}>Schließen ×</Text></Pressable>
      <Text style={styles.cardEyebrow}>{typeLabel(selected.category)} · {selected.source==='osm'?'OpenStreetMap':selected.source==='curated'?'Redaktioneller Ausflugstipp':selected.source==='national'?'Deutschlandweiter Ausflugstipp':selected.moderation_status==='pending'?'Dein Vorschlag in Prüfung':'Familien-Tipp'}</Text>
      <Text style={styles.selectedTitle}>{selected.title}</Text>
      <Text style={styles.micro}>{selected.description||'Keine Beschreibung hinterlegt.'}</Text>
      {selected.address?<Text style={[styles.micro,{marginTop:8}]}>⌖ {selected.address}</Text>:null}
      {['curated','national'].includes(selected.source)&&onCalendar?<Pressable accessibilityRole="button" accessibilityLabel="Ausflugsziel im Kalender einplanen" onPress={()=>onCalendar(selected)} style={{minHeight:44,padding:12,borderRadius:12,backgroundColor:'#E8F3E9',marginTop:10}}><Text style={{fontWeight:'800',color:'#075A60'}}>Im Kalender einplanen</Text></Pressable>:null}
      {selected.family_focus?<Text style={[styles.micro,{marginTop:7}]}>Ausflugsart: {BRANDENBURG_FAMILY_FOCUS.find(x=>x.id===selected.family_focus)?.label||'Familienausflug'}</Text>:null}
      {selected.play_area?<View style={{marginTop:10,padding:11,borderRadius:12,backgroundColor:C.sunPale}}>
       <Text style={{fontWeight:'800',fontSize:13,color:C.accentDark}}>Spielbereich konkret nachgewiesen</Text>
       <Text style={[styles.micro,{marginTop:5}]}>{selected.play_area.label} · {selected.play_area.kind==='outdoor'?'Außenbereich, wetterabhängig':'Innenbereich'}</Text>
       <Text style={[styles.micro,{marginTop:5}]}>Die Spielangebote sind kein Nachweis für Kinderbetreuung oder Aufsicht durch das Restaurant. Eigene Aufsicht erforderlich.</Text>
       <Pressable accessibilityRole="link" onPress={()=>Linking.openURL(selected.play_area.source_url).catch(()=>{})} style={[styles.minorBtn,{marginTop:7}]}>
         <Text style={styles.minorBtnText}>Quelle zum Spielbereich öffnen ↗</Text>
       </Pressable>
      </View>:null}
      {selected.coordinate_note?<Text style={[styles.micro,{marginTop:7,color:C.accentDark}]}>{selected.coordinate_note}</Text>:null}
      {selected.visit_warning?<Text style={[styles.micro,{marginTop:8,fontWeight:'700',color:C.accentDark}]}>{selected.visit_warning}</Text>:null}

      {selected.source==='national'?<Text style={[styles.micro,{marginTop:7}]}>Kategorie: {selected.kind_label} · {selected.state}</Text>:null}
      {['curated','national'].includes(selected.source)?<Text style={[styles.micro,{marginTop:8}]}>Recherchestand November 2026. Aktuelle Besuchsbedingungen beim Anbieter erfragen.</Text>:null}
      <View style={styles.accessibilitySection}>
         <Text accessibilityRole="header" style={styles.accessibilityTitle}>Barrierefreiheit & Teilhabe</Text>
         <Text style={styles.accessibilityStatus}>{selectedAccess.label}</Text>
         <Text style={styles.accessibilityText}>{selectedAccess.summary}</Text>
         <Text style={styles.accessibilityLabel}>Zugänge & Mobilität</Text>
         <Text style={styles.accessibilityText}>{selectedAccess.mobility}</Text>
         <Text style={styles.accessibilityLabel}>Sinnes- und Kommunikationsangebote</Text>
         <Text style={styles.accessibilityText}>{selectedAccess.sensory}</Text>
         <Text style={styles.accessibilityLabel}>Einschränkungen / vorab prüfen</Text>
         <Text style={styles.accessibilityText}>{selectedAccess.limitations}</Text>
         {selectedAccess.source_url?<Pressable accessibilityRole="link"
           accessibilityLabel={'Quelle zur Barrierefreiheit für '+selected.title}
           style={styles.accessibilitySource}
           onPress={()=>Linking.openURL(selectedAccess.source_url).catch(()=>{})}>
           <Text style={styles.accessibilitySourceText}>Quelle zu Zugangsmerkmalen öffnen ↗</Text>
         </Pressable>:null}
         <Text style={styles.accessibilityDisclaimer}>Einzelne dokumentierte Merkmale bedeuten nicht, dass jeder Weg, Raum oder jede Attraktion barrierefrei ist. Aktuelle Gegebenheiten vor dem Besuch bestätigen lassen.</Text>
       </View>
      {selected.info_url?<Pressable accessibilityRole="link" onPress={()=>Linking.openURL(selected.info_url).catch(()=>{})}
        style={styles.minorBtn}><Text style={styles.minorBtnText}>Offizielle Informationen öffnen ↗</Text></Pressable>:null}
      {selected.has_changing_table?<Text style={styles.tagGood}>Wickelmöglichkeit angegeben</Text>:null}
      <Text style={[styles.micro,{fontWeight:'800',color:C.ink,marginTop:17,marginBottom:10}]}>Route zu diesem Ort planen</Text>
      <View style={styles.navigationRow}>
        <Pressable accessibilityRole="link" accessibilityLabel={'Route mit Google Maps zu '+selected.title}
          onPress={()=>openDirections(selected,'google')} style={styles.navigationGoogle}>
          <Text style={styles.navigationGoogleText}>⌖  Google Maps</Text>
        </Pressable>
        <Pressable accessibilityRole="link" accessibilityLabel={'Route mit Apple Karten zu '+selected.title}
          onPress={()=>openDirections(selected,'apple')} style={styles.navigationApple}>
          <Text style={styles.navigationAppleText}>⌖  Apple Karten</Text>
        </Pressable>
      </View>
      <Text style={[styles.micro,{marginTop:8}]}>Der Kartendienst öffnet sich außerhalb von Familienfunke. Startpunkt und Verkehrsmittel wählst du dort.</Text>
      <Pressable accessibilityRole="link" onPress={()=>openInOSM(selected)} style={styles.minorBtn}><Text style={styles.minorBtnText}>In OpenStreetMap ansehen ↗</Text></Pressable>
    </View>:null}


    {placeQuery.trim().length>=2&&locationMatches.length>0?<Pressable accessibilityRole="button"
      accessibilityLabel="Alle Suchtreffer auf der Karte anzeigen"
      onPress={()=>map.current?.injectJavaScript(mapScript('fitSearchResults'))}
      style={[styles.outlineBtn,{marginTop:10,minHeight:46}]}>
      <Text style={styles.outlineText}>Alle Suchtreffer auf der Karte anzeigen</Text>
    </Pressable>:null}
    {qaOnline&&qaMap?<Text accessibilityLiveRegion="polite" style={styles.micro}>{qaMap}</Text>:null}
    {ready&&rendered?<View style={[styles.row,{gap:8,marginTop:8}]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Karte verkleinern" onPress={()=>map.current?.injectJavaScript(mapScript('zoomBy',-1))} style={[styles.outlineBtn,{flex:1,minHeight:48}]}><Text style={styles.outlineText}>− Verkleinern</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Karte vergrößern" onPress={()=>map.current?.injectJavaScript(mapScript('zoomBy',1))} style={[styles.outlineBtn,{flex:1,minHeight:48}]}><Text style={styles.outlineText}>+ Vergrößern</Text></Pressable>
    </View>:null}
    {mapError||resourceError?<View accessibilityLiveRegion="polite" style={styles.warn}><Text style={styles.micro}>{mapError||'Ein Teil der Karte konnte nicht geladen werden.'} Die Ortsliste kann weiterhin genutzt werden.</Text><Pressable accessibilityRole="button" onPress={retryMap} style={[styles.outlineBtn,{minHeight:48,marginTop:8}]}><Text style={styles.outlineText}>Karte erneut laden</Text></Pressable></View>:null}
    <Text style={[styles.micro,{marginTop:7}]}>Karte: OpenFreeMap / © OpenStreetMap-Mitwirkende. Adresssuche: Photon / © OpenStreetMap-Mitwirkende. Alle Orte auch als Liste. Kein Standortzugriff nötig.</Text>
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
       accessibilityLabel="Kartenausschnitt auf Deutschland zurücksetzen" style={styles.outlineBtn}><Text style={styles.outlineText}>DE</Text></Pressable>
    </View>
    {loading?<ActivityIndicator color={C.teal} style={{marginTop:9}}/>:null}
    {searchError?<View accessibilityLiveRegion="assertive" style={styles.warn}><Text style={styles.warnText}>{searchError}</Text></View>:null}
    {notice?<View accessibilityLiveRegion="polite" style={styles.tip}><Text style={styles.tipText}>{notice}</Text></View>:null}
    <Text style={styles.section}>Was sucht ihr?</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingRight:15}}>
      {TYPES.map(([id,label,icon])=><Chip key={id} label={icon+' '+label} selected={types===id} onPress={()=>{setTypes(id);setSelectedId(null);}}/>)}
    </ScrollView>
    <Text style={[styles.micro,{marginTop:12}]}>OpenStreetMap-Orte sind nicht von uns geprüft. Wickeltische nur bei ausdrücklicher Quellenangabe.</Text>
    <View style={[styles.row,{justifyContent:'space-between',marginTop:24}]}>
      <Text style={styles.sectionNoMargin}>Orte im Kartenausschnitt</Text>
      <Text style={styles.micro}>{list.length} angezeigt</Text>
    </View>
    {!list.length?<View style={styles.empty}><Text style={styles.emptyTitle}>Noch keine Orte in dieser Ansicht</Text>
      <Text style={styles.micro}>Wähle eine Stadt, tippe auf „Hier nach Orten suchen“ oder trage einen neuen Ort ein.</Text>
    </View>:list.map(p=><Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.title+', '+typeLabel(p.category)+', Details öffnen'} onPress={()=>showPlace(p)} style={styles.placeRow}>
      <View style={styles.placeGlyph}><Text style={{fontSize:23,color:C.coral}}>{typeGlyph(p.category)}</Text></View>
      <View style={{flex:1}}><Text style={styles.placeTitle}>{p.title}</Text><Text style={styles.micro}>{typeLabel(p.category)} · {p.source==='osm'?'OpenStreetMap':p.source==='curated'?'Recherchierter Ausflugstipp':p.source==='national'?(p.kind_label||'Deutschlandweiter Ausflugstipp'):p.moderation_status==='pending'?'Nur für dich · in Prüfung':'Familien-Tipp'}</Text></View><Text style={styles.chevron}>›</Text>
    </Pressable>)}
    <Pressable accessibilityRole="button" accessibilityState={{expanded:showCatalog}} onPress={()=>setShowCatalog(v=>!v)}
      style={styles.catalogToggle}>
      <Text style={styles.catalogToggleTitle}>{showCatalog?'Weniger Vorschläge anzeigen':'Weitere Ausflugsziele entdecken'}</Text>
      <Text style={styles.catalogToggleText}>Region Oder-Spree, Brandenburg und ganz Deutschland {showCatalog?'−':'+'}</Text>
    </Pressable>
    {showCatalog?<>
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
    <View style={styles.nationalBox}>
      <View style={[styles.row,{justifyContent:'space-between',gap:9,alignItems:'center'}]}>
        <View style={{flex:1}}>
          <Text style={styles.curatedEyebrow}>MEHR IN BRANDENBURG</Text>
          <Text accessibilityRole="header" style={styles.curatedTitle}>Familienziele mit Zugangsinfos</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Brandenburg-Ausflugsziele auf Karte anzeigen"
          style={styles.curatedMapBtn}
          onPress={()=>{setTypes('all');setNationalType('all');setNationalArea('all');
            setCenter({latitude:52.4,longitude:13.65,zoom:7.6});
            map.current?.injectJavaScript('window.ffMap&&window.ffMap.flyTo(52.4,13.65,7.6);true;');}}>
          <Text style={styles.curatedMapBtnText}>⌖ Brandenburg</Text>
        </Pressable>
      </View>
      <Text style={[styles.micro,{marginTop:7,marginBottom:13}]}>
        {BRANDENBURG_FAMILY_PLACES.length} zusätzlich recherchierte Ziele. Zu jedem Ziel zeigen wir dokumentierte Einzelmerkmale und Grenzen oder ausdrücklich fehlende Angaben zur Barrierefreiheit.
      </Text>
      <Text style={[styles.micro,{marginBottom:6}]}>Dauerhafte Familienziele auswählen – aktuelle Preise, Öffnungszeiten und Altersregeln beim Betreiber prüfen.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingBottom:12}}>
        {BRANDENBURG_FAMILY_FOCUS.map(f=><Chip key={f.id} label={f.label} selected={brandenburgFocus===f.id} onPress={()=>setBrandenburgFocus(f.id)}/>)}
      </ScrollView>
      <Text accessibilityLiveRegion="polite" style={[styles.micro,{marginBottom:8}]}>{BRANDENBURG_FAMILY_PLACES.filter(p=>brandenburgFocus==='all'||p.family_focus===brandenburgFocus).length} passende Brandenburg-Ziele</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10,paddingRight:9}}>
        {BRANDENBURG_FAMILY_PLACES.filter(p=>brandenburgFocus==='all'||p.family_focus===brandenburgFocus).map(place=><Pressable key={place.id} accessibilityRole="button"
          accessibilityLabel={place.title+' und Angaben zur Barrierefreiheit öffnen'}
          onPress={()=>showPlace(place)} style={styles.curatedPlace}>
          <View style={styles.row}>
            <View style={styles.curatedPlaceIcon}><Text style={{fontSize:18,color:C.teal}}>✿</Text></View>
            <Text style={styles.curatedPlaceNumber}>Brandenburg</Text>
          </View>
          <Text style={styles.curatedPlaceTitle} numberOfLines={2}>{place.title}</Text>
          <Text style={styles.micro} numberOfLines={1}>{place.region_label}</Text>
          <Text style={[styles.micro,{marginTop:6,flex:1}]} numberOfLines={3}>{place.description}</Text>
          <Text style={[styles.micro,{color:C.accentDark,fontWeight:'800',marginTop:5}]}>
            {place.accessibility.status==='documented'?'Zugangsmerkmale recherchiert':'Barrierefreiheit noch ungeklärt'}
          </Text>
          <Text style={styles.curatedPlaceLink}>Details & Zugänglichkeit ›</Text>
        </Pressable>)}
      </ScrollView>
    </View>
    <View style={styles.nationalBox}>
      <View style={[styles.row,{justifyContent:'space-between',gap:9,alignItems:'center'}]}>
        <View style={{flex:1}}>
          <Text style={styles.curatedEyebrow}>DEUTSCHLANDWEIT ENTDECKEN</Text>
          <Text style={styles.curatedTitle}>Die große Familien-Auswahl</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Alle bundesweiten Ziele auf der Karte anzeigen"
          style={styles.curatedMapBtn} onPress={showAllGermany}>
          <Text style={styles.curatedMapBtnText}>⌖ Deutschland</Text>
        </Pressable>
      </View>
      <Text style={[styles.micro,{marginTop:8,marginBottom:11}]}>
        {NATIONAL_FAMILY_PLACES.length} recherchierte Familienziele: von Freizeitparks über Indoor-Spielwelten bis zu interaktiven Museen.
      </Text>
      <Text style={styles.nationalLabel}>Was möchtet ihr unternehmen?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingRight:10}}>
        {NATIONAL_TYPES.map(x=><Chip key={x.id} label={x.icon+' '+x.label}
          selected={nationalType===x.id} onPress={()=>{setNationalType(x.id);setSelectedId(null);}}/>)}
      </ScrollView>
      <Text style={[styles.nationalLabel,{marginTop:13}]}>Welche Region?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingRight:10}}>
        {NATIONAL_AREAS.map(x=><Chip key={x.id} label={x.label}
          selected={nationalArea===x.id} onPress={()=>{setNationalArea(x.id);setSelectedId(null);}}/>)}
      </ScrollView>
      <View style={[styles.row,{justifyContent:'space-between',marginTop:15,marginBottom:10}]}>
        <Text style={styles.nationalCount}>{nationalShown.length} {nationalShown.length===1?'Ausflugsziel':'Ausflugsziele'}</Text>
        {nationalShown.length<NATIONAL_FAMILY_PLACES.length?<Pressable accessibilityRole="button"
          onPress={()=>{setNationalType('all');setNationalArea('all');setSelectedId(null);}}>
          <Text style={styles.nationalReset}>Filter löschen ×</Text>
        </Pressable>:null}
      </View>
      {nationalShown.length===0?<Text style={styles.micro}>Für diese Auswahl ist noch kein Ort erfasst. Probiere eine andere Region oder Kategorie.</Text>:
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10,paddingRight:12}}>
          {nationalShown.map(place=><View key={place.id} style={styles.nationalPlace}>
            <View style={[styles.row,{gap:8}]}>
              <Text style={styles.nationalPlaceIcon}>{NATIONAL_TYPES.find(t=>t.id===place.kind)?.icon||'✿'}</Text>
              <Text style={styles.nationalKind}>{place.kind_label}</Text>
            </View>
            <Text style={styles.curatedPlaceTitle} numberOfLines={2}>{place.title}</Text>
            <Text style={styles.micro} numberOfLines={2}>⌖ {place.region_label} · {place.state}</Text>
            <Text style={[styles.micro,{flex:1,marginTop:8}]} numberOfLines={3}>{place.description}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={place.title+' auf der Karte zeigen'}
              onPress={()=>showPlace(place)} style={styles.nationalPlaceButton}>
              <Text style={styles.nationalPlaceButtonText}>Auf Karte ansehen  ›</Text>
            </Pressable>
          </View>)}
        </ScrollView>}
      <Text style={[styles.micro,{marginTop:12}]}>Recherchestand November 2026. Saison, Preise, Altersgrenzen und Öffnungszeiten bitte auf den verlinkten Anbieterseiten prüfen.</Text>
    </View>
    </>:null}
    <View style={styles.suggestCard}>
      <Text style={styles.sectionNoMargin}>Kennt ihr noch einen tollen Ort?</Text>
      <Text style={[styles.micro,{marginTop:7}]}>Ihr könnt öffentlich zugängliche Spielplätze, Wickelmöglichkeiten und Ausflugsorte vorschlagen. Jeder neue Eintrag wird vor Veröffentlichung geprüft.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{expanded:openForm,disabled:!active}} disabled={!active} onPress={()=>{setOpenForm(v=>!v);setSearchError('');}}
       style={[styles.mainBtn,{marginTop:13,opacity:active?1:0.45}]}><Text style={styles.mainBtnText}>{openForm?'Vorschlag schließen':'+ Familienort vorschlagen'}</Text></Pressable>
      {!active?<Text style={[styles.micro,{marginTop:6}]}>Vorschläge sind nur mit freigegebenem Familienkonto möglich.</Text>:null}
      {openForm?<View style={styles.form}>
        <Text style={styles.formTitle}>Öffentlichen Ort markieren</Text>
        <Text style={styles.micro}>Wähle den öffentlichen Ort auf der Karte oder trage seine Koordinaten unten per Tastatur ein. Bitte keine privaten Wohnadressen oder Kinderstandorte eintragen.</Text>
        <Text style={[styles.label,{marginTop:13}]}>Ort ohne Kartenberührung markieren</Text>
        <Text style={styles.micro}>Breiten- und Längengrad kannst du zum Beispiel aus einem Kartendienst kopieren. Komma und Punkt werden akzeptiert.</Text>
        <View style={[styles.row,{gap:9,alignItems:'flex-start'}]}>
          <View style={{flex:1}}><Field label="Breitengrad" value={latitudeInput}
            onChange={v=>{setLatitudeInput(v);setDraftPoint(null);}} maxLength={16} placeholder="z. B. 52,36"/></View>
          <View style={{flex:1}}><Field label="Längengrad" value={longitudeInput}
            onChange={v=>{setLongitudeInput(v);setDraftPoint(null);}} maxLength={16} placeholder="z. B. 14,06"/></View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ort anhand der Koordinaten markieren"
          onPress={markCoordinates} style={[styles.mainBtn,{marginTop:2}]}>
          <Text style={styles.mainBtnText}>Koordinaten übernehmen</Text>
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={[styles.coordinate,{marginTop:10}]}>{draftPoint?'✓ Ort auf Karte markiert':'Noch kein Punkt ausgewählt'}</Text>
        {searchError?<Text accessibilityLiveRegion="assertive" style={[styles.warnText,{marginTop:9}]}>{searchError}</Text>:null}
        <Field label="Name des Ortes" value={name} onChange={setName} maxLength={100} placeholder="z. B. Spielplatz am Stadtpark"/>
        <Text style={[styles.label,{marginTop:13}]}>Art des Ortes</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>
          {TYPES.filter(t=>t[0]!=='all').map(([id,label])=><Chip key={id} label={label} selected={category===id} onPress={()=>setCategory(id)}/>)}
        </View>
        <Field label="Stadt oder Region (freiwillig)" value={region} onChange={setRegion} maxLength={80} placeholder="z. B. Fürstenwalde"/>
        <Field label="Was sollten Familien wissen?" value={description} onChange={setDescription} maxLength={600} multi placeholder="z. B. Schattenplätze, Zugang, Öffnungszeiten – nur wenn bekannt"/>
        <View style={[styles.row,{justifyContent:'space-between',marginTop:16}]}>
          <View style={{flex:1}}><Text style={styles.label}>Wickeltisch vorhanden?</Text><Text style={styles.micro}>Nur einschalten, wenn ihr euch sicher seid.</Text></View>
          <Switch accessibilityLabel="Wickeltisch vorhanden" accessibilityRole="switch" value={changing} onValueChange={setChanging} trackColor={{true:C.teal}}/>
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
accessibilitySection:{marginTop:17,borderWidth:1,borderColor:C.line,
  borderRadius:17,backgroundColor:C.mint,padding:15,gap:6},
accessibilityTitle:{fontSize:18,fontWeight:'800',color:C.ink},
accessibilityStatus:{fontSize:14,fontWeight:'800',color:C.accentDark,marginTop:3},
accessibilityText:{fontSize:15,color:C.ink,lineHeight:20},
accessibilityLabel:{fontSize:13.5,fontWeight:'800',color:C.ink,marginTop:8},
accessibilitySource:{minHeight:44,borderRadius:12,backgroundColor:C.paper,
  marginTop:7,paddingHorizontal:12,justifyContent:'center'},
accessibilitySourceText:{fontSize:14,fontWeight:'800',color:C.accentDark},
accessibilityDisclaimer:{fontSize:14,color:C.muted,lineHeight:18,marginTop:8},

 catalogToggle:{minHeight:60,backgroundColor:C.sunPale,borderRadius:16,padding:15,marginTop:18,justifyContent:'center',gap:5},
 catalogToggleTitle:{fontSize:16,fontWeight:'800',color:C.ink},
 catalogToggleText:{fontSize:14,color:C.accentDark},
 page:{flex:1,backgroundColor:C.bg},body:{padding:16,paddingBottom:40},
 nationalBox:{backgroundColor:'#F0F6F4',borderWidth:1,borderColor:'#D9EDE8',borderRadius:22,padding:16,marginTop:17},
 nationalLabel:{fontSize:14,fontWeight:'900',color:C.ink,marginBottom:8},
 nationalCount:{fontSize:12,fontWeight:'900',color:C.dark},
 nationalReset:{fontSize:12,fontWeight:'900',color:C.teal,textDecorationLine:'underline'},
 nationalPlace:{width:236,minHeight:224,borderRadius:17,backgroundColor:C.paper,borderWidth:1,borderColor:'#DDEAE6',padding:14},
 nationalPlaceIcon:{fontSize:21},
 nationalKind:{fontSize:14,fontWeight:'900',color:C.teal,flexShrink:1},
 nationalPlaceButton:{paddingHorizontal:12,paddingVertical:10,backgroundColor:C.pale,borderRadius:11,marginTop:11},
 nationalPlaceButtonText:{fontSize:12,fontWeight:'900',color:C.dark,textAlign:'center'},
 navigationRow:{flexDirection:'row',gap:9,alignItems:'stretch'},
 navigationGoogle:{flex:1,minHeight:48,backgroundColor:C.teal,borderRadius:14,justifyContent:'center',alignItems:'center',paddingHorizontal:8,paddingVertical:11},
 navigationApple:{flex:1,minHeight:48,backgroundColor:C.paper,borderRadius:14,justifyContent:'center',alignItems:'center',paddingHorizontal:8,paddingVertical:11,borderWidth:1,borderColor:C.teal},
 navigationGoogleText:{fontSize:13,fontWeight:'900',color:C.paper},
 navigationAppleText:{fontSize:13,fontWeight:'900',color:C.dark},
 hero:{backgroundColor:C.sun,borderRadius:25,padding:19,marginBottom:12},
 eyebrow:{fontSize:10,fontWeight:'900',color:C.dark,letterSpacing:1.3,marginBottom:6},
 title:{fontSize:25,fontWeight:'900',color:C.ink},
 sub:{fontSize:15,color:C.ink,lineHeight:20,marginTop:7},
 locationSearch:{...UI.card,padding:16,marginBottom:12},
 searchResultPanel:{marginTop:12,padding:14,backgroundColor:C.paper,borderRadius:18,borderWidth:2,borderColor:C.accentDark},
 searchResultSelected:{backgroundColor:C.sunPale,borderColor:C.teal},
 mapSelectedInfo:{marginTop:12,padding:15,backgroundColor:C.sunPale,borderRadius:17,borderWidth:1,borderColor:C.line},
 searchResult:{minHeight:48,flexDirection:'row',alignItems:'center',paddingVertical:10,paddingHorizontal:12,borderRadius:12,borderWidth:1,borderColor:C.line,backgroundColor:C.bg,marginTop:7},
 mapFrame:{height:350,backgroundColor:'#E7F0ED',borderRadius:20,overflow:'hidden',borderWidth:1,borderColor:C.line,position:'relative'},
 map:{flex:1,backgroundColor:'#E7F0ED'},mapLoading:{...StyleSheet.absoluteFillObject,alignItems:'center',justifyContent:'center',gap:10,backgroundColor:'#E7F0ED'},
 mapTag:{position:'absolute',top:12,left:11,backgroundColor:'#FFFFFFEE',paddingHorizontal:11,paddingVertical:7,borderRadius:12},
 mapTagText:{fontSize:14,fontWeight:'900',color:C.dark},
 micro:{fontSize:14,color:C.muted,lineHeight:18},section:{fontSize:18,fontWeight:'900',color:C.ink,marginTop:23,marginBottom:11},sectionNoMargin:{fontSize:17,fontWeight:'900',color:C.ink},
 row:{flexDirection:'row',alignItems:'center'},
 chip:{backgroundColor:C.pale,borderRadius:25,paddingHorizontal:14,paddingVertical:10,borderWidth:1,borderColor:'#CDE8E0'},
 chipActive:{backgroundColor:C.teal,borderColor:C.teal},chipText:{fontSize:14,fontWeight:'800',color:C.dark},
 mainBtn:{...UI.primary,paddingHorizontal:13,paddingVertical:12},
 mainBtnText:{color:C.paper,fontWeight:'900',fontSize:15},
 outlineBtn:{...UI.secondary,minWidth:50,padding:11},
 outlineText:{color:C.dark,fontWeight:'900'},
 warn:{backgroundColor:'#FFF0DA',padding:13,borderRadius:13,marginTop:11},warnText:{fontSize:12.2,color:'#80521A',lineHeight:19},
 tip:{backgroundColor:C.pale,padding:13,borderRadius:13,marginTop:11},tipText:{fontSize:12.5,color:C.dark,lineHeight:19},
 selectedCard:{...UI.card,padding:16,marginTop:15},
 cardEyebrow:{fontSize:11,fontWeight:'900',color:C.teal,marginBottom:5},selectedTitle:{fontSize:19,fontWeight:'900',color:C.ink,marginBottom:7},
 tagGood:{color:C.dark,fontWeight:'800',fontSize:12,marginTop:9},
 minorBtn:{backgroundColor:C.pale,borderRadius:12,padding:10,alignSelf:'flex-start',marginTop:13},minorBtnText:{fontSize:14,fontWeight:'900',color:C.dark},
 empty:{borderRadius:18,backgroundColor:C.paper,padding:19,marginTop:11},emptyTitle:{fontSize:15,fontWeight:'900',color:C.ink,marginBottom:7},
 placeRow:{...UI.card,flexDirection:'row',alignItems:'center',gap:11,padding:12,marginTop:9},
 placeGlyph:{width:39,height:39,borderRadius:13,backgroundColor:'#FFF1DA',alignItems:'center',justifyContent:'center'},
 placeTitle:{fontWeight:'900',fontSize:16,color:C.ink,marginBottom:4},chevron:{fontSize:24,color:C.teal},
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
 field:{...UI.field,color:C.ink,paddingHorizontal:13,paddingVertical:12,fontSize:14},
 coordinate:{fontSize:12,fontWeight:'900',color:C.teal},
});
