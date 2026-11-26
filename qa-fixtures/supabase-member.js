// QA only: copied over supabase.js by the isolated member workflow.
// No SDK, network, real credentials, production data or write access.
export const configured=true;
const id='00000000-0000-4000-8000-000000000001';
const profile={user_id:id,display_name:'Testfamilie',region_label:'Landkreis Oder-Spree',about:'Wir mögen Ausflüge und Brettspiele.',interests:['Wandern','Brettspiele'],is_discoverable:false,moderation_status:'approved',updated_at:'2026-11-25T00:00:00Z'};
const ok=data=>({data,error:null});
const deny=name=>({data:null,error:new Error('QA fixture: unsupported '+name)});
const seller='00000000-0000-4000-8000-000000000002';
const listing={id:'00000000-0000-4000-8000-000000000101',seller_id:seller,title:'Test-Kinderjeans Größe 116',description:'Blaue Kinderjeans. QA-Testartikel, kein echtes Angebot.',category:'Kleidung',trade_type:'sell',price_cents:400,item_condition:'Gut',region_label:'Landkreis Oder-Spree',moderation_status:'approved',created_at:'2026-11-25T00:00:00Z',photo_path:null};
const tables={ff_market_listings:[listing],profiles:[profile],verifications:[{user_id:id,status:'verified'}],memberships:[{user_id:id,status:'active'}],ff_organizations:[],ff_official_family_events:[],ff_official_decisions:[],ff_market_photos:[]};
const emptyRPC=new Set(['ff_discover_page','ff_contacts_page','ff_block_flags','ff_profile_photos_page','ff_my_market_page','ff_market_search','ff_market_favorite_flags','ff_search_events']);
function from(name){
 let rows=tables[name]||[],error=Object.hasOwn(tables,name)?null:deny(name).error;
 const result=single=>error?{data:null,error}:ok(single?(rows[0]||null):rows);
 const q={select:()=>q,eq:(key,value)=>{rows=rows.filter(row=>row[key]===value);return q;},in:(key,values)=>{rows=rows.filter(row=>values.includes(row[key]));return q;},order:()=>q,limit:n=>{rows=rows.slice(0,n);return q;},gte:()=>q,ilike:()=>q,maybeSingle:async()=>result(true),single:async()=>result(true),then:(resolve,reject)=>Promise.resolve(result(false)).then(resolve,reject)};
 for(const op of ['insert','update','delete','upsert'])q[op]=()=>{error=deny('write '+name).error;return q;};
 return q;
}
const session={user:{id,email:'test@example.invalid'}};
export const supabase={
 auth:{getSession:async()=>ok({session}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
 from,
 rpc:async(name,args={})=>name==='ff_market_search'?ok(args.p_favorites_only||args.p_offset>0||(args.p_category&&args.p_category!=='Alle'&&args.p_category!==listing.category)||(args.p_trade_type&&args.p_trade_type!=='all'&&args.p_trade_type!==listing.trade_type)||(args.p_min_cents!=null&&args.p_min_cents>400)||(args.p_max_cents!=null&&args.p_max_cents<400)||(args.p_query&&!('test-kinderjeans größe 116 blau kinderjeans'.includes(args.p_query.toLowerCase())))?[]:[{listing,match_item:''}]):name==='ff_inbox_page_by_kind'?ok({rows:[],unread:0,total:0,price_unread:0,decision_unread:0,as_of:'2026-11-25T00:00:00Z'}):emptyRPC.has(name)?ok([]):deny(name),
 functions:{invoke:async name=>deny(name)},
 storage:{from:()=>({createSignedUrls:async()=>ok([])})}
};
export function assertResult({error}){if(error)throw error;}
export const errorMessage=error=>error?.message||String(error||'Unbekannter Fehler');
