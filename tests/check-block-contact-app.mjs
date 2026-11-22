import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sql=read('database/ff_blocks_scoped_pages_20261122.sql');
const app=read('App.jsx'),panel=read('BlockedAccountsPanel.jsx');
assert.match(sql,/create index if not exists blocks_blocker_recent_idx/);
assert.match(sql,/create or replace function public\.ff_block_flags\(p_user_ids uuid\[\]\)/);
assert.match(sql,/if cardinality\(p_user_ids\)>120/);
assert.match(sql,/b\.blocker_id=\(select auth\.uid\(\)\)/);
assert.match(sql,/create or replace function public\.ff_my_blocks_page/);
assert.match(sql,/\(b\.created_at,b\.blocked_id\)<\(p_before_at,p_before_id\)/);
assert.match(sql,/limit greatest\(1,least\(coalesce\(p_limit,30\),30\)\)/);
assert.equal((sql.match(/security invoker/g)||[]).length,2);
assert.match(sql,/revoke all on function public\.ff_block_flags\(uuid\[\]\) from public,anon,authenticated/);
assert.match(sql,/revoke all on function public\.ff_my_blocks_page\(timestamptz,uuid,integer\) from public,anon,authenticated/);
assert.match(sql,/grant execute on function public\.ff_block_flags\(uuid\[\]\) to authenticated/);
assert.match(sql,/grant execute on function public\.ff_my_blocks_page\(timestamptz,uuid,integer\) to authenticated/);
assert.ok(!app.includes("supabase.from('blocks').select('*').limit(200)"),
  'Never preload a capped global block list at app startup');
assert.ok(app.includes("const blockIds=visibleBlockTargets("));
assert.ok(app.includes("supabase.rpc('ff_block_flags',{p_user_ids:blockIds})"));
assert.ok(app.includes('blocks:currentBlockFlags'));
assert.ok(app.includes("blocks:mergeVisibleBlockFlags(old.blocks,me,ids,flags.data)"));
assert.ok(app.includes("blocks:mergeVisibleBlockFlags(old.blocks,me,idsToCheck,flags.data)"));
assert.ok(app.includes("supabase.rpc('ff_block_flags',{p_user_ids:[counterpart]})"),
  'Deep-linked older conversation must check block status');
assert.ok(app.includes('accountRef.current===owner?({'),'Guard asynchronous older-contact results');
assert.ok(app.includes('<BlockedAccountsPanel userId={userId}'), 'Security settings should show all blocked accounts by page');
assert.ok(!app.includes('blocks.map(b=><Row'), 'Never show only startup-loaded blocks in settings');
assert.ok(panel.includes("supabase.rpc('ff_my_blocks_page',{p_limit:BLOCK_PAGE_SIZE})"));
assert.ok(panel.includes("supabase.rpc('ff_my_blocks_page',{p_limit:BLOCK_PAGE_SIZE,...cursor})"));
assert.ok(panel.includes('blockPageCursor(data)'));
assert.ok(panel.includes('setRevision(n=>n+1)'),'Unblock must refresh server-verified page');
assert.ok(panel.includes('if(await onUnblock(id))'),'Unblock failure must not pretend success');
assert.ok(panel.includes("accessibilityRole=\"button\""));
const begin=app.indexOf('function ContactsScreen('),end=app.indexOf('function ChatScreen(',begin);
assert.ok(begin>0&&end>begin);
const screens=app.slice(begin,end);
assert.equal((screens.match(/return <FlatList/g)||[]).length,2,
  'Contacts and chat overview should both virtualize long lists');
assert.ok(screens.includes('initialNumToRender={12} maxToRenderPerBatch={12}'));
assert.ok(screens.includes('alreadyLoaded.current.add(id)'),'Incrementally cache previously requested chat previews');
assert.ok(screens.includes("supabase.rpc('ff_chat_previews',{p_contact_ids:batch})"));
assert.ok(screens.includes("const ids=(idsKey?idsKey.split(','):[]).filter(id=>!alreadyLoaded.current.has(id))"),
  'Never refetch all previews after appending the next contacts page');
assert.ok(screens.includes('disabled={isBlocked}'),'Blocked conversations cannot be opened from overview');
assert.ok(screens.includes("previews[c.id]||'Noch keine Nachrichten'"));
console.log('Block permissions, scoped loading, private paged settings and virtualized contact UI checks passed');
