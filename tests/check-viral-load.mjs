import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../App.jsx',import.meta.url),'utf8');
assert.ok(src.includes("import { signPhotoPaths } from './SignedPhotoUrls'"));
assert.ok(!src.includes('.createSignedUrl('),'Avoid per-image HTTP fanout');
assert.ok(src.includes(".in('listing_id',visibleListingIds)"));
assert.ok(!src.includes("supabase.from('ff_market_photos').select('*').order('slot'"));
assert.ok(src.includes("const signed=await signPhotoPaths(supabase,'ff-market-photos'"));
console.log('Viral readiness static checks passed');
