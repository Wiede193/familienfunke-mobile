// Familienfunke - moderate-photo (Pilotversion)
// Prüft ausschließlich Fotos des angemeldeten Nutzers aus privatem Storage.
// Unauffällige Fotos werden freigegeben, auffällige bleiben auf "pending".
// Bei Fehlern bleibt das Foto ebenfalls "pending" (fail closed).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

const BUCKET = "familienfunke-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  if (status >= 500) console.error("moderate-photo:", message);
  return Response.json({ error: message }, { status });
}

// Jedes Teilstück ist ein Vielfaches von 3 Bytes, damit keine ungültige
// Base64-Kodierung durch Padding zwischen den Stücken entsteht.
function toBase64(bytes: Uint8Array): string {
  const CHUNK = 24 * 1024;
  const pieces: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const part = bytes.subarray(i, i + CHUNK);
    let binary = "";
    for (const byte of part) binary += String.fromCharCode(byte);
    pieces.push(btoa(binary));
  }
  return pieces.join("");
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return fail("Methode nicht erlaubt", 405);

    const userId = ctx.userClaims?.id;
    if (!userId) return fail("Anmeldung erforderlich", 401);

    let payload: unknown;
    try { payload = await req.json(); }
    catch { return fail("Ungültiges JSON", 400); }

    const photoId = (payload && typeof payload === "object" &&
      "photo_id" in payload) ? (payload as { photo_id: unknown }).photo_id : null;
    if (typeof photoId !== "string" || !UUID.test(photoId)) {
      return fail("Ungültige Foto-ID", 400);
    }

    // Der Client übergibt ausschließlich die Foto-ID. Eigentümer und
    // Speicherpfad werden vertrauenswürdig aus der Datenbank ermittelt.
    const db = ctx.supabaseAdmin;
    const { data: photo, error: photoError } = await db
      .from("profile_photos")
      .select("id, owner_id, storage_path, moderation_status, caption")
      .eq("id", photoId)
      .maybeSingle();

    if (photoError) {
      console.error("moderate-photo: Fotoabfrage", photoError.code, photoError.message);
      return fail("Fotoabfrage nicht verfügbar", 503);
    }
    if (!photo || photo.owner_id !== userId) return fail("Foto nicht gefunden", 404);
    if (photo.moderation_status !== "pending") {
      return fail("Foto ist nicht mehr in Prüfung", 409);
    }

    const path = photo.storage_path;
    if (typeof path !== "string" || !path.startsWith(`${userId}/`) ||
        !/^[-a-zA-Z0-9_/.]+\.jpe?g$/i.test(path) || path.includes("..")) {
      return fail("Ungültiger Speicherpfad", 400);
    }

    const {data:allowed,error:quotaError}=await db.rpc("ff_moderation_claim",{p_service:"photo",p_user_id:userId});
    if(quotaError)return fail("Prüfung derzeit nicht verfügbar",503);
    if(allowed!==true)return fail("Prüflimit erreicht",429);
    const { data: file, error: fileError } = await db.storage.from(BUCKET).download(path);
    if (fileError || !file) {
      console.error("moderate-photo: Datei nicht abrufbar", fileError?.message);
      return fail("Foto nicht abrufbar", 503);
    }
    if (file.size < 3 || file.size > MAX_BYTES) {
      return fail("Foto hat eine ungültige Größe", 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    // Unsere App lädt JPEG-Dateien hoch. Andere Formate vorerst nicht freigeben.
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
      return fail("Nur JPEG-Fotos werden unterstützt", 400);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return fail("OpenAI nicht konfiguriert", 503);

    const inputs: Array<Record<string, unknown>> = [
      {
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${toBase64(bytes)}` },
      },
    ];
    if (typeof photo.caption === "string" && photo.caption.trim()) {
      inputs.push({ type: "text", text: photo.caption.trim().slice(0, 200) });
    }

    let verdict: unknown;
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "omni-moderation-latest", input: inputs }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        console.error("moderate-photo: OpenAI HTTP", response.status);
        return fail("Bildmoderation derzeit nicht verfügbar", 503);
      }
      const result = await response.json();
      verdict = result?.results?.[0]?.flagged;
    } catch (error) {
      console.error("moderate-photo: OpenAI-Aufruf fehlgeschlagen", String(error));
      return fail("Bildmoderation derzeit nicht verfügbar", 503);
    }

    if (typeof verdict !== "boolean") {
      return fail("Keine eindeutige Bildbewertung", 503);
    }
    if (verdict) {
      // Das Foto bleibt privat und wartet auf eine menschliche Entscheidung.
      return Response.json({ status: "review_required", moderation_status: "pending" });
    }

    // Status nur für dieses eigene, weiterhin ausstehende Foto ändern.
    const { data: changed, error: updateError } = await db
      .from("profile_photos")
      .update({ moderation_status: "approved" })
      .eq("id", photoId)
      .eq("owner_id", userId)
      .eq("moderation_status", "pending")
      .eq("storage_path",path)
      .eq("caption",photo.caption??"")
      .select("id")
      .maybeSingle();
    if (updateError) {
      console.error("moderate-photo: Freigabe fehlgeschlagen", updateError.code, updateError.message);
      return fail("Fotofreigabe nicht verfügbar", 503);
    }
    if (!changed) return fail("Fotostatus wurde inzwischen geändert", 409);

    return Response.json({ status: "approved", moderation_status: "approved" });
  }),
};
