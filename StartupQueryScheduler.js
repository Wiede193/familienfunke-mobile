// Prevent a simultaneous spike of independent initial PostgREST reads per
// account. Operations must be lazy functions so work only begins when scheduled.
// Results retain their original order and Supabase error objects are unchanged.
export async function runBoundedQueries(operations,limit=4){
 if(!Array.isArray(operations))throw new TypeError('operations must be an array');
 if(!Number.isInteger(limit)||limit<1||limit>16)throw new RangeError('query concurrency limit must be 1–16');
 if(operations.some(operation=>typeof operation!=='function'))throw new TypeError('queries must be lazy functions');
 const results=new Array(operations.length);
 let cursor=0,failed=false,firstError;
 async function worker(){
  while(!failed){
   const index=cursor++;
   if(index>=operations.length)return;
   try{results[index]=await operations[index]();}
   catch(error){if(!failed){failed=true;firstError=error;}}
  }
 }
 await Promise.all(Array.from({length:Math.min(limit,operations.length)},()=>worker()));
 if(failed)throw firstError;
 return results;
}
