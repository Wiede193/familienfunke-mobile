// No cache across accounts, no public URLs, no extension of the current TTL.
// Supabase checks each object against storage access policies.
export async function signedImageLinks(client,bucket,paths,expiresIn){
 const unique=[...new Set(paths.filter(p=>typeof p==='string'&&p.length))];
 const output={};
 for(let offset=0;offset<unique.length;offset+=100){
  const batch=unique.slice(offset,offset+100);
  try{
   const {data,error}=await client.storage.from(bucket).createSignedUrls(batch,expiresIn);
   if(!error&&Array.isArray(data))for(const row of data){
    if(batch.includes(row.path)&&!row.error&&typeof row.signedUrl==='string')output[row.path]=row.signedUrl;
   }
  }catch{/* Fail closed for unavailable images; no public URL fallback. */}
 }
 return output;
}
