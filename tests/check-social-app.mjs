import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../App.jsx',import.meta.url),'utf8');
for(const rpc of ['ff_discover_page','ff_contacts_page','ff_chat_page']) {
 assert.ok(app.includes(rpc),rpc+' must be used from client');
}
assert.ok(!app.includes("supabase.from('messages').select('*').order('created_at'"),'Never download global chat history on app startup');
assert.ok(!app.includes("messages={db.messages"),'Private chats fetch only selected contact');
assert.ok(app.includes("p_contact_id:contactId,p_limit:SOCIAL_PAGE_SIZE"),'Chat messages scoped by conversation ID');
assert.ok(app.includes('Ältere Nachrichten laden'));
assert.ok(app.includes('Weitere Familien laden'));
assert.ok(app.includes('Weitere Kontakte laden'));
assert.ok(app.includes('Weitere Gespräche anzeigen'));
assert.ok(app.includes("contacts:appendUniqueRows([older],old.contacts)"),'Open notification may reference an older contact, fetched by exact id');
assert.ok(app.includes("supabase.rpc('ff_block_flags',{p_user_ids:[counterpart]})"),'Deep-linked older contacts must have a checked block status first');
assert.ok(app.includes('send={(body)=>sendChatMessage(body,selectedContact)}'),'Sending one chat message must not refresh the entire app');
assert.ok(!app.includes("send={(body)=>execute(async"),'Chat sends must not invoke global refresh');
assert.ok(app.includes("scrollToEnd({animated:false})"),'Chat should show newest messages');
assert.ok(app.includes("supabase.rpc('ff_chat_previews'"),'Last message summaries must be lazy and batched');
assert.ok(app.includes("previews[c.id]||'Noch keine Nachrichten'"),'Keep message previews in chat list');
console.log('Scoped social loading static checks passed');
