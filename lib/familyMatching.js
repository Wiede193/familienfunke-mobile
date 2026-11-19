// Familienfunke – transparentes Familien-Matching ohne GPS und ohne
// Rückschlüsse auf persönliche/sensible Daten. Nur sichtbare Profilangaben.
// CommonJS erlaubt kleine echte Node-Tests ohne zusätzliche Testbibliotheken.
function normalized(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-DE')
    : '';
}
function uniqueTags(values) {
  if (!Array.isArray(values)) return [];
  const found = new Set();
  return values.filter(value=>{
    const key=normalized(value);
    if (!key || found.has(key)) return false;
    found.add(key);
    return true;
  }).map(x=>x.trim());
}
function buildIndex(groups) {
  const categories={};
  const byTag={};
  for (const [category,subgroups] of Object.entries(groups||{})){
    categories[category]=[];
    for (const group of (Array.isArray(subgroups)?subgroups:[])){
      const [label,items]=group;
      const entry={key:category+':'+label,category,label,tags:new Set()};
      for (const tag of (Array.isArray(items)?items:[])){
        const key=normalized(tag);
        if (!key)continue;
        entry.tags.add(key);
        if (!byTag[key])byTag[key]=[];
        byTag[key].push(entry.key);
      }
      categories[category].push(entry);
    }
  }
  return {categories,byTag};
}
function matchingReasons(viewer,other,groups,focus='all') {
  const own=uniqueTags(viewer?.interests);
  const theirs=uniqueTags(other?.interests);
  const ownKeys=new Set(own.map(normalized));
  const shared=theirs.filter(tag=>ownKeys.has(normalized(tag)));
  const sharedKeys=new Set(shared.map(normalized));
  const ownRegion=normalized(viewer?.region_label);
  const sameRegion=!!ownRegion && ownRegion===normalized(other?.region_label);
  const byTopic={hobbys:[],unterwegs:[],treffen:[]};
  const index=buildIndex(groups);
  const seenGroups=new Set();
  const similar=[];
  const ownTagKeys=new Set(own.map(normalized));
  const theirsTagKeys=new Set(theirs.map(normalized));
  for (const [category,entries] of Object.entries(index.categories)){
    if (!byTopic[category])byTopic[category]=[];
    for (const entry of entries) {
      const common=[...entry.tags].filter(tag=>sharedKeys.has(tag));
      for (const tag of common) {
        const original=shared.find(item=>normalized(item)===tag);
        if (original && !byTopic[category].includes(original)) byTopic[category].push(original);
      }
      const ownHere=[...entry.tags].some(t=>ownTagKeys.has(t));
      const otherHere=[...entry.tags].some(t=>theirsTagKeys.has(t));
      // Gemeinsames Oberthema, aber keine identische Auswahl in diesem Unterthema.
      // Es ist eine ähnliche Vorliebe, keine nachgewiesene identische Aktivität.
      if(ownHere&&otherHere&&common.length===0&&!seenGroups.has(entry.key)){
        seenGroups.add(entry.key);
        similar.push({category,label:entry.label});
      }
    }
  }
  const categoryShared=(byTopic[focus]||[]).length;
  const similarFocused=similar.filter(x=>x.category===focus);
  const score=shared.length*8
    +Math.min(similar.length,4)*2
    +(sameRegion?6:0)
    +(focus!=='all' ? categoryShared*5+Math.min(similarFocused.length,3)*2 : 0);
  return {
    sharedInterests:shared,
    sharedByTopic:byTopic,
    similarTopics:similar,
    sameRegion,
    // Zahl der exakt gemeinsamen Interessen (kompatibel mit Hinweis-Zählern).
    match:shared.length,
    score,
    hasEvidence:shared.length>0||similar.length>0||sameRegion,
  };
}
function rankFamilyProfiles({profiles,viewerProfile,viewerId,groups,blockedIds=[],focus='all'}) {
  const excluded=new Set(blockedIds);
  const output=[];
  for (const p of (Array.isArray(profiles)?profiles:[])) {
    if (!p?.user_id||p.user_id===viewerId||excluded.has(p.user_id)
      ||p.moderation_status!=='approved'||p.is_discoverable!==true)continue;
    output.push({...p,...matchingReasons(viewerProfile,p,groups,focus)});
  }
  output.sort((a,b)=>b.score-a.score
    || String(a.display_name||'').localeCompare(String(b.display_name||''),'de')
    || String(a.user_id).localeCompare(String(b.user_id)));
  return output;
}

module.exports={normalized,uniqueTags,matchingReasons,rankFamilyProfiles};
