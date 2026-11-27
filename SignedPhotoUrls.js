// Bound the HTTP fanout when signing private photos; Storage RLS remains authoritative.
export async function signPhotoPaths(supabase, bucket, paths, expiresIn) {
  const unique = [...new Set((paths || []).filter(path => typeof path === 'string' && path.length > 0))];
  const signed = Object.create(null);
  // Two concurrent requests maximum, 50 paths in each request.
  for (let offset = 0; offset < unique.length; offset += 100) {
    const chunks = [unique.slice(offset, offset + 50), unique.slice(offset + 50, offset + 100)]
      .filter(chunk => chunk.length > 0);
    const groups = await Promise.all(chunks.map(async chunk => {
      try {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrls(chunk, expiresIn);
        if (error || !Array.isArray(data)) return [];
        return chunk.map((path, i) => {
          const item = data[i];
          return [path, !item?.error && typeof item?.signedUrl === 'string' ? item.signedUrl : null];
        });
      } catch {
        return [];
      }
    }));
    for (const group of groups) {
      for (const [path, url] of group) if (url) signed[path] = url;
    }
  }
  return signed;
}


 // Family photos: never create a bearer-style signed link in the normal app.
 // The native image request sends the current user JWT only to our own Storage.
 // Each refresh has a fresh cache key; cache reload is best-effort on native.
let profilePhotoSequence=0;
export function authenticatedProfilePhotoSources(paths,{url,key,accessToken,nonce}={}) {
  const sources=Object.create(null);
  if(typeof url!=='string'||!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)||
     typeof key!=='string'||!key.startsWith('sb_publishable_')||
     typeof accessToken!=='string'||!accessToken)return sources;
  const root=url.replace(/\/$/,'');
  const refresh=String(nonce??(Date.now()+'-'+(++profilePhotoSequence)));
  for(const path of new Set(paths||[])){
    if(typeof path!=='string'||!/^([0-9a-f-]{36})\/[A-Za-z0-9_.-]+\.(jpg|jpeg|png|webp)$/i.test(path))continue;
    if(path.split('/').some(segment=>segment==='.'||segment==='..'))continue;
    const encoded=path.split('/').map(encodeURIComponent).join('/');
    sources[path]={
      uri:root+'/storage/v1/object/authenticated/familienfunke-photos/'+encoded+'?ff_refresh='+encodeURIComponent(refresh),
      headers:{Authorization:'Bearer '+accessToken,apikey:key,'Cache-Control':'no-cache, no-store'},
      cache:'reload'
    };
  }
  return sources;
}
