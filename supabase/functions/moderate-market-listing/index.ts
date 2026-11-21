// Retired single-photo legacy moderation route. Never approve or alter an advert here.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(()=>Response.json({error:"Dieser Prüfdienst ist veraltet. Bitte die aktuelle App verwenden."},{status:410,headers:{"Cache-Control":"no-store"}}));
