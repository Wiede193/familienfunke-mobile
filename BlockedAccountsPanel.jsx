import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,Text,View,StyleSheet} from 'react-native';
import {FAMILY_COLORS as C} from './FamilyTheme';
import {supabase} from './supabase';
import {retryRead} from './NetworkResilience';
import {appendUniqueRows} from './SocialPages';
import {BLOCK_PAGE_SIZE,blockPageCursor} from './BlockPages';

function Action({label,onPress,disabled=false}){
  return <Pressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
    style={[styles.action,disabled&&{opacity:.48}]}>
    <Text style={styles.actionText}>{label}</Text>
  </Pressable>;
}

// Rendered ONLY when Konto & Sicherheit is open. Never preload all blocked
// accounts into the global app state or enumerate other users' block choices.
export default function BlockedAccountsPanel({userId,onUnblock,disabled=false}){
  const [rows,setRows]=useState([]);
  const [cursor,setCursor]=useState(null);
  const [hasMore,setHasMore]=useState(false);
  const [loading,setLoading]=useState(true);
  const [loadingMore,setLoadingMore]=useState(false);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const [removing,setRemoving]=useState(null);
  const seq=useRef(0);
  const pageLock=useRef(false);
  const removeLock=useRef(false);

  useEffect(()=>{
    let live=true;
    const ticket=++seq.current;
    pageLock.current=false;
    setRows([]);setCursor(null);setHasMore(false);setError('');
    setLoading(!!userId);setLoadingMore(false);
    if(userId){
      (async()=>{
        const {data,error:e}=await retryRead(
          ()=>supabase.rpc('ff_my_blocks_page',{p_limit:BLOCK_PAGE_SIZE}),
          {isCurrent:()=>live&&seq.current===ticket}
        );
        if(e||!Array.isArray(data))throw e||new Error('Invalid block page');
        if(!live||seq.current!==ticket)return;
        setRows(data);setCursor(blockPageCursor(data));setHasMore(data.length===BLOCK_PAGE_SIZE);
      })().catch(()=>{
        if(live&&seq.current===ticket)setError('Deine Blockierungen konnten nicht geladen werden.');
      }).finally(()=>{
        if(live&&seq.current===ticket)setLoading(false);
      });
    }
    return()=>{live=false;seq.current++;pageLock.current=false;};
  },[userId,revision]);

  async function loadMore(){
    if(!userId||!hasMore||!cursor||loading||loadingMore||pageLock.current)return;
    pageLock.current=true;
    const ticket=seq.current;
    setLoadingMore(true);setError('');
    try{
      const {data,error:e}=await retryRead(
        ()=>supabase.rpc('ff_my_blocks_page',{p_limit:BLOCK_PAGE_SIZE,...cursor}),
        {isCurrent:()=>seq.current===ticket}
      );
      if(e||!Array.isArray(data))throw e||new Error('Invalid block page');
      if(seq.current!==ticket)return;
      setRows(old=>seq.current===ticket?appendUniqueRows(old,data,'blocked_id'):old);
      setCursor(blockPageCursor(data));setHasMore(data.length===BLOCK_PAGE_SIZE);
    }catch{
      if(seq.current===ticket)setError('Weitere Blockierungen konnten nicht geladen werden.');
    }finally{
      if(seq.current===ticket){pageLock.current=false;setLoadingMore(false);}
    }
  }

  async function unblock(id){
    if(disabled||removeLock.current)return;
    removeLock.current=true;setRemoving(id);
    try{
      if(await onUnblock(id))setRevision(n=>n+1);
    }finally{
      removeLock.current=false;setRemoving(null);
    }
  }

  return <View style={styles.container}>
    <Text style={styles.heading} accessibilityRole="header">Blockierte Konten</Text>
    <Text style={styles.helper}>Du siehst hier alle selbst blockierten Konten, jeweils in kleinen Gruppen. Andere Familien erfahren nicht, wen du blockiert hast.</Text>
    {loading?<ActivityIndicator accessibilityLabel="Blockierte Konten werden geladen" color={C.accent}/>:null}
    {error?<View style={styles.error}><Text style={styles.helper}>{error}</Text>
      <Action label="Blockierungen erneut laden" disabled={loading}
        onPress={()=>setRevision(n=>n+1)}/></View>:null}
    {!loading&&!error&&rows.length===0?<Text style={styles.helper}>Du hast keine Konten blockiert.</Text>:null}
    {rows.map(row=><View key={row.blocked_id} style={styles.row}>
      <View style={{flex:1}}>
        <Text style={styles.person}>Konto …{row.blocked_id.slice(-7)}</Text>
        <Text style={styles.helper}>Seit {new Date(row.created_at).toLocaleDateString('de-DE')} blockiert</Text>
      </View>
      <Action label={removing===row.blocked_id?'Wird entsperrt …':'Entsperren'}
        disabled={disabled||!!removing||loadingMore} onPress={()=>unblock(row.blocked_id)}/>
    </View>)}
    {hasMore?<Action label={loadingMore?'Weitere Blockierungen werden geladen …':'Weitere blockierte Konten laden'}
      disabled={loading||loadingMore||!!removing} onPress={loadMore}/>:null}
  </View>;
}

const styles=StyleSheet.create({
  container:{marginTop:18,gap:10},
  heading:{fontSize:17,fontWeight:'800',color:C.ink},
  helper:{fontSize:13,lineHeight:19,color:C.muted},
  row:{paddingVertical:10,borderTopWidth:1,borderTopColor:C.line,flexDirection:'row',alignItems:'center',gap:10},
  person:{fontSize:14,fontWeight:'700',color:C.ink},
  action:{backgroundColor:C.sunPale,borderRadius:13,paddingVertical:10,paddingHorizontal:12,minHeight:44,alignItems:'center',justifyContent:'center'},
  actionText:{color:C.accentDark,fontSize:13,fontWeight:'800',textAlign:'center'},
  error:{padding:10,borderRadius:12,backgroundColor:C.sunPale,gap:9}
});
