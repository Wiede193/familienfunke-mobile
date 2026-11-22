// Familienfunke – send-message (Pilotversion)
// Nur angemeldete Benutzer duerfen diese Funktion aufrufen.
// Erst berechtigten Kontakt pruefen, dann moderate-content V2,
// danach kontrolliert speichern.
// WICHTIG: Direkte INSERT-Rechte der App erst NACH erfolgreichem
// App-Umbau und Funktionstest entziehen. Sicherheitsreview vor Launch.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type Payload = { contact_id?: unknown; body?: unknown; request_id?: unknown };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  if (status >= 500) {
    console.error("send-message:", message);
  }
  return Response.json({ error: message }, { status });
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return fail("Methode nicht erlaubt", 405);

    const senderId = ctx.userClaims?.id;
    if (!senderId) return fail("Anmeldung erforderlich", 401);

    let payload: Payload;
    try {
      payload = (await req.json()) as Payload;
    } catch {
      return fail("Ungueltige Anfrage", 400);
    }

    const contactId = payload?.contact_id;
    const body = typeof payload?.body === "string" ? payload.body.trim() : "";
    // Old released clients without a request_id continue to work unchanged.
    // New clients provide one stable UUIDv4 for each intended send.
    const requestId = payload?.request_id;
    if (typeof contactId !== "string" || !UUID.test(contactId) || !body || body.length > 2000 ||
        (requestId !== undefined && (typeof requestId !== "string" || !UUID.test(requestId)))) {
      return fail("Kontakt, Nachricht oder Anfrage-ID ungueltig", 400);
    }

    // Der Server ermittelt die Absender-ID selbst aus der geprueften Anmeldung.
    // Die App darf keine fremde sender_id vorgeben.
    const db = ctx.supabaseAdmin;
    const contactResult = await db.from("contact_requests")
      .select("id, sender_id, recipient_id, status")
      .eq("id", contactId).maybeSingle();

if (contactResult.error) {
  console.error(
    "Kontaktabfrage fehlgeschlagen:",
    contactResult.error.code,
    contactResult.error.message
  );
  return fail("Kontaktpruefung nicht verfuegbar", 503);
}

    const contact = contactResult.data;
    if (!contact || contact.status !== "accepted" ||
        (contact.sender_id !== senderId && contact.recipient_id !== senderId)) {
      return fail("Kein bestaetigter Kontakt", 403);
    }
    const otherId = contact.sender_id === senderId ? contact.recipient_id : contact.sender_id;

    // Auch mit Admin-Zugriff muessen die Berechtigungen explizit geprueft werden.
    const [blockedResult, profilesResult, verificationResult, membershipResult] = await Promise.all([
      db.from("blocks").select("blocker_id, blocked_id")
        .in("blocker_id", [senderId, otherId])
        .in("blocked_id", [senderId, otherId]).limit(1),
      db.from("profiles").select("user_id, moderation_status")
        .in("user_id", [senderId, otherId]),
      db.from("verifications").select("user_id, status")
        .in("user_id", [senderId, otherId]),
      db.from("memberships").select("user_id, status")
        .in("user_id", [senderId, otherId]),
    ]);
    if (blockedResult.error || profilesResult.error || verificationResult.error || membershipResult.error) {
      return fail("Sicherheitspruefung nicht verfuegbar", 503);
    }
    if ((blockedResult.data ?? []).length > 0) return fail("Kontakt ist blockiert", 403);

    const ids = [senderId, otherId];
    const profiles = profilesResult.data ?? [];
    const verifications = verificationResult.data ?? [];
    if (!ids.every(id => profiles.some(p => p.user_id === id && p.moderation_status === "approved") &&
                           verifications.some(v => v.user_id === id && v.status === "verified"))) {
      return fail("Konto noch nicht freigegeben", 403);
    }
    if (!ids.every(id => (membershipResult.data ?? []).some(m => m.user_id === id && m.status !== "suspended"))) {
      return fail("Konto gesperrt", 403);
    }

    // Duplicate replays are resolved only AFTER checking the authenticated
    // participant, block status, verified adults and non-suspended membership.
    // They do not consume another moderation call or send another notification.
    const identical = (row: { id: string; contact_id: string; sender_id: string; body: string }) =>
      row.sender_id === senderId && row.contact_id === contactId && row.body === body;
    const findPrevious = async () => requestId
      ? await db.from("messages").select("id, contact_id, sender_id, body, created_at")
          .eq("id", requestId).maybeSingle()
      : { data: null, error: null };

    if (requestId) {
      const previous = await findPrevious();
      if (previous.error) return fail("Nachrichtenstatus nicht verfuegbar", 503);
      if (previous.data) {
        if (!identical(previous.data)) return fail("Anfrage-ID bereits anders verwendet", 409);
        return Response.json({ message: previous.data, duplicate: true }, { status: 200 });
      }
    }

    // Bestehende, getestete Moderation V2 mit dem Nutzer-JWT aufrufen.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const authorization = req.headers.get("authorization");
    if (!supabaseUrl || !authorization) return fail("Moderationsdienst nicht konfiguriert", 503);

    let moderated: unknown;
    try {
      const moderationResponse = await fetch(`${supabaseUrl}/functions/v1/moderate-content`, {
        method: "POST",
        headers: {
          "Authorization": authorization,
          "Content-Type": "application/json",
          ...(req.headers.get("apikey") ? { apikey: req.headers.get("apikey")! } : {}),
        },
        body: JSON.stringify({ text: body }),
        signal: AbortSignal.timeout(12000),
      });
      if (moderationResponse.status === 429) return fail("Zu viele Nachrichtenprüfungen. Bitte später erneut versuchen.",429);
      if (!moderationResponse.ok) return fail("Moderationspruefung derzeit nicht verfuegbar", 503);
      moderated = await moderationResponse.json();
    } catch {
      return fail("Moderationspruefung derzeit nicht verfuegbar", 503);
    }

    if (!moderated || typeof moderated !== "object" ||
        !("flagged" in moderated) || !("status" in moderated)) {
      return fail("Keine gueltige Moderationsentscheidung", 503);
    }
    const result = moderated as { flagged?: unknown; status?: unknown };
    if (result.flagged !== false || result.status !== "not_flagged") {
      return fail("Nachricht wegen Inhaltsregeln zurueckgehalten", 422);
    }

    // Nur der Server speichert die gepruefte Nachricht.
    const inserted = await db.from("messages")
      .insert({ ...(requestId ? { id: requestId } : {}), contact_id: contactId, sender_id: senderId, body })
      .select("id, contact_id, sender_id, body, created_at")
      .single();
    if (inserted.error) {
      // A simultaneous replay can lose the unique primary-key race. The
      // existing 5-message BEFORE INSERT trigger can also reject a replay
      // before PostgreSQL reaches the unique check. In either case check the
      // authoritative row before returning a quota/duplicate error.
      if (requestId &&
          (inserted.error.code === "23505" ||
           (inserted.error.code === "P0001" && String(inserted.error.message).includes("FF_MSG_LIMIT_5")))) {
        const previous = await findPrevious();
        if (previous.error) return fail("Nachrichtenstatus nicht verfuegbar", 503);
        if (previous.data) {
          if (!identical(previous.data)) return fail("Anfrage-ID bereits anders verwendet", 409);
          return Response.json({ message: previous.data, duplicate: true }, { status: 200 });
        }
      }
      // Die PostgreSQL-Sperre ist die maßgebliche Sicherheitsregel.
      // Keine Absenderzählung nur im Client: manipulierbare Apps würden sie umgehen.
      if (inserted.error.code === "P0001" && String(inserted.error.message).includes("FF_MSG_LIMIT_5")) {
        return fail("Fünf Nachrichten ohne Antwort erreicht. Bitte warte auf eine Antwort.", 429);
      }
      if (inserted.error.code === "42501") return fail("Kontakt nicht mehr zum Schreiben berechtigt",403);
      // Keine Fehlermeldung/SQL-Details an andere App-Clients preisgeben.
      console.error("send-message INSERT:", inserted.error.code);
      return fail("Nachricht konnte nicht gespeichert werden", 500);
    }
    return Response.json({ message: inserted.data }, { status: 201 });
  }),
};
