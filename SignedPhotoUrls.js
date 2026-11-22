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
