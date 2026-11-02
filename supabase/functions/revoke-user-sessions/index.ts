// Edge Function: revoke-user-sessions
// Ends every session for a user IMMEDIATELY.
//  - Anyone may call it for themselves ("sign out of all devices").
//  - Only the platform admin may call it for someone else (used when banning).
//
// Deploy: Supabase Dashboard -> Edge Functions -> Deploy a new function ->
// name it exactly "revoke-user-sessions" -> paste this file -> Deploy.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing auth" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await caller.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let body: { targetUserId?: string } = {};
  try { body = await req.json(); } catch { /* no body = revoke my own */ }
  const target = body.targetUserId ?? user.id;

  // Revoking someone else's sessions needs the platform-admin flag, checked
  // here on the server - the UI hiding the button is not the security.
  if (target !== user.id) {
    const { data: me } = await admin.from("profiles").select("is_platform_admin").eq("id", user.id).single();
    if (!me?.is_platform_admin) return json({ error: "Forbidden" }, 403);
  }

  await admin.from("active_sessions").delete().eq("user_id", target);
  const { error } = await admin.auth.admin.signOut(target, "global");
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
});
