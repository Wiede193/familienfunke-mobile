import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../SignedPhotoUrls.js',import.meta.url),'utf8');
const {signPhotoPaths}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));
let inflight=0,maxFlight=0; const calls=[];
const mock={storage:{from(bucket){assert.equal(bucket,'private');return{async createSignedUrls(paths,ttl){
  calls.push(paths); assert.equal(ttl,600); inflight++;maxFlight=Math.max(maxFlight,inflight);
  await Promise.resolve();inflight--;
  return{data:paths.map(path=>({signedUrl:'https://example.test/'+path,error:path==='3.jpg'?'denied':null})),error:null};
}};}}};
const paths=Array.from({length:105},(_,i)=>i+'.jpg');
const signed=await signPhotoPaths(mock,'private',[...paths,'1.jpg','',null],600);
assert.deepEqual(calls.map(c=>c.length),[50,50,5]);
assert.ok(maxFlight<=2);assert.equal(signed['1.jpg'],'https://example.test/1.jpg');
assert.equal(signed['3.jpg'],undefined);assert.equal(Object.keys(signed).length,104);
assert.equal(Object.keys(await signPhotoPaths(mock,'private',[],600)).length,0);
const broken={storage:{from(){return{async createSignedUrls(){throw Error('offline')}}}}};
assert.equal(Object.keys(await signPhotoPaths(broken,'private',['x.jpg'],600)).length,0);
console.log('Signed URL batching tests passed');
