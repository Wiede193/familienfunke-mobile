// Persistent, account/contact-scoped intent IDs for private chat sends.
// Only a SHA-256 fingerprint is stored (never the message text). The server
// verifies the actual contact, sender and text before reusing an ID.
// This does not send messages, enqueue retries or bypass content moderation.

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PREFIX = 'familienfunke.chat-intent.v1.';
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function uuidFromCrypto(source) {
  if (typeof source?.randomUUID === 'function') {
    const id = source.randomUUID();
    if (UUID_V4.test(id)) return id.toLowerCase();
  }
  if (typeof source?.getRandomValues !== 'function') return null;
  const bytes = source.getRandomValues(new Uint8Array(16));
  if (!(bytes instanceof Uint8Array) || bytes.length !== 16) return null;
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}

// Small dependency-free SHA-256 (body <= 2000 characters). Kept portable
// across Hermes, iOS, Android and Jest/Node without native crypto packages.
const SHA_K = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];
const ROT = (v,n) => (v >>> n) | (v << (32-n));
function utf8Bytes(value) {
  const bytes=[];
  for (let i=0;i<value.length;i++) {
    let code=value.charCodeAt(i);
    if (code>=0xd800 && code<=0xdbff && i+1<value.length) {
      const next=value.charCodeAt(i+1);
      if (next>=0xdc00 && next<=0xdfff) {
        code=0x10000+((code-0xd800)<<10)+(next-0xdc00);i++;
      }
    }
    if (code>=0xd800 && code<=0xdfff) code=0xfffd;
    if (code<128) bytes.push(code);
    else if (code<2048) bytes.push(192|(code>>6),128|(code&63));
    else if (code<65536) bytes.push(224|(code>>12),128|((code>>6)&63),128|(code&63));
    else bytes.push(240|(code>>18),128|((code>>12)&63),128|((code>>6)&63),128|(code&63));
  }
  return bytes;
}
export function sha256Text(text) {
  const bytes=utf8Bytes(String(text));
  if (bytes.length>1048576) throw new Error('Intent fingerprint input too large');
  const bitLength=bytes.length*8;
  bytes.push(128);
  while (bytes.length%64!==56) bytes.push(0);
  for (let i=7;i>=0;i--) bytes.push(i>=4?0:(bitLength>>>(i*8))&255);
  const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const words=new Array(64);
  for (let offset=0;offset<bytes.length;offset+=64) {
    for (let i=0;i<16;i++) {
      const j=offset+i*4;
      words[i]=((bytes[j]<<24)|(bytes[j+1]<<16)|(bytes[j+2]<<8)|bytes[j+3])|0;
    }
    for (let i=16;i<64;i++) {
      const a=words[i-15],b=words[i-2];
      words[i]=(words[i-16]+(ROT(a,7)^ROT(a,18)^(a>>>3))
        +words[i-7]+(ROT(b,17)^ROT(b,19)^(b>>>10)))|0;
    }
    let [a,b,c,d,e,f,g,j]=h;
    for (let i=0;i<64;i++) {
      const t1=(j+(ROT(e,6)^ROT(e,11)^ROT(e,25))+((e&f)^(~e&g))+SHA_K[i]+words[i])|0;
      const t2=((ROT(a,2)^ROT(a,13)^ROT(a,22))+((a&b)^(a&c)^(b&c)))|0;
      j=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    const next=[a,b,c,d,e,f,g,j];
    for (let i=0;i<8;i++) h[i]=(h[i]+next[i])|0;
  }
  return h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}

export function createChatIntentRepository({storage,createId,now=Date.now}) {
  if (!storage?.getItem || !storage?.setItem || !storage?.removeItem || typeof createId!=='function') {
    throw new Error('Chat intent storage or UUID generator missing');
  }
  function key(owner,contact) {
    if (!UUID_V4.test(owner) || !UUID_V4.test(contact)) {
      // User IDs and contact IDs from Supabase are UUIDs, often v4.
      // Revalidate below using generic UUIDs for any future UUID version.
      const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuid.test(owner) || !uuid.test(contact)) throw new Error('Invalid chat intent owner or contact');
    }
    return PREFIX+owner+'.'+contact;
  }
  async function reserve(owner,contact,body) {
    const storageKey=key(owner,contact);
    const signature=sha256Text(owner+'\u0000'+contact+'\u0000'+String(body).trim());
    const timestamp=now();
    const raw=await storage.getItem(storageKey);
    let prior=null;
    if (raw) { try { prior=JSON.parse(raw); } catch {} }
    if (prior && UUID_V4.test(prior.id) && prior.signature===signature &&
      Number.isFinite(prior.at) && timestamp>=prior.at && timestamp-prior.at<=RETENTION_MS) {
      return prior.id;
    }
    const id=await createId();
    if (!UUID_V4.test(id)) throw new Error('No valid UUIDv4 available for chat send');
    // If saving fails, DO NOT send: an interruption could create duplicates.
    await storage.setItem(storageKey,JSON.stringify({id,signature,at:timestamp}));
    return id;
  }
  async function acknowledge(owner,contact,id) {
    const storageKey=key(owner,contact);
    const raw=await storage.getItem(storageKey);
    if (!raw) return;
    let record;try{record=JSON.parse(raw);}catch{return;}
    if (record?.id===id) await storage.removeItem(storageKey);
  }
  return {reserve,acknowledge};
}
