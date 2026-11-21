// Familienfunke – Moderation V2 (Pilotversion)
// Authentifizierte Supabase Edge Function. JWT-Legacy-Check im Dashboard OFF,
// da withSupabase({ auth: "user" }) die Nutzeranmeldung validiert.
// Diese Funktion kontrolliert TEXT, noch keine Bilddateien.
// Keine Produktionsfreigabe ohne serverseitige Erzwingung und Tests.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";
import { filterFWordsToSegments } from "npm:ts-profanity-filter@1.2.0";

type InputBody = { text?: unknown };

export default {
  fetch: withSupabase({ auth: "user" }, async (req: Request, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let body: InputBody;
    try {
      body = await req.json() as InputBody;
    } catch {
      return Response.json({ error: "Ungueltige Anfrage" }, { status: 400 });
    }

    const text = body?.text;
    if (typeof text !== "string" || !text.trim() || text.length > 10000) {
      return Response.json({ error: "Ungueltiger Text" }, { status: 400 });
    }

    const uid=ctx.userClaims?.id;
    if(!uid)return Response.json({error:"Anmeldung erforderlich"},{status:401});
    const {data:allowed,error:quotaError}=await ctx.supabaseAdmin.rpc("ff_moderation_claim",{p_service:"text",p_user_id:uid});
    if(quotaError)return Response.json({error:"Prüfung derzeit nicht verfügbar"},{status:503});
    if(allowed!==true)return Response.json({error:"Prüflimit erreicht"},{status:429});

    // Erste Stufe: Familienfreundliche Sprache (Deutsch und Englisch).
    // Der Filter laeuft lokal in der Edge Function und kostet keine Modellanfrage.
    // Er erkennt viele Umschreibungen, ist aber nicht fehlerfrei.
    let profane: boolean;
    try {
      profane = filterFWordsToSegments(text, {
        languages: ["de", "en"],
        aggressive: true,
        crossCheck: true,
      }).some((segment) => segment.isProfane);
    } catch {
      // Bei einem internen Prueffehler darf der Text NICHT ungeprueft durch.
      return Response.json(
        { error: "Sprachpruefung momentan nicht verfuegbar" },
        { status: 503 },
      );
    }

    // Bestehende Testregel: als alleinstehende extremistische Namensnennung.
    // Diese Regel sollte spaeter durch Kontext-/Richtlinienpruefung ersetzt werden.
    const isolatedTestTerm = text.normalize("NFKC").trim().toLocaleLowerCase("de") === "hitler";

    if (profane || isolatedTestTerm) {
      return Response.json({
        flagged: true,
        status: "review_required",
        categories: {},
        reason: "language_policy",
      });
    }

    // Zweite Stufe: kostenlose OpenAI Moderation API fuer weitere Risikokategorien.
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return Response.json(
        { error: "OpenAI-Schluessel nicht konfiguriert" },
        { status: 500 },
      );
    }

    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        return Response.json(
          { error: "Moderationsdienst nicht verfuegbar" },
          { status: 502 },
        );
      }

      const result = await response.json();
      const moderation = result?.results?.[0];
      if (!moderation || typeof moderation.flagged !== "boolean") {
        return Response.json(
          { error: "Keine eindeutige Moderationsbewertung erhalten" },
          { status: 502 },
        );
      }

      return Response.json({
        flagged: moderation.flagged,
        categories: moderation.categories ?? {},
        status: moderation.flagged ? "review_required" : "not_flagged",
        reason: moderation.flagged ? "openai_policy" : null,
      });
    } catch {
      return Response.json(
        { error: "Moderationspruefung fehlgeschlagen" },
        { status: 502 },
      );
    }
  }),
};