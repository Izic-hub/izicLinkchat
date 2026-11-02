// Edge Function: register-session
// Called by the app right after a sign-in. Enforces ONE device at a time:
// every other session this user has is revoked (our tracking rows AND their
// real Supabase refresh tokens), then a fresh 24-hour session is recorded.
//
// Deploy: Supabase Dashboard -> Edge Functions -> Deploy a new function ->
// name it exactly "register-session" -> paste this file -> Deploy.
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// automatically; no secrets to set.
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
  // Work out who is calling from their own token, never from the request body.
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await caller.auth.getUser();
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);

  // Service-role client: bypasses RLS and may call auth.admin.*. Server only.
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  await admin.from("active_sessions").delete().eq("user_id", user.id);
  await admin.auth.admin.signOut(user.id, "others");

  const { data: session, error } = await admin
    .from("active_sessions").insert({ user_id: user.id }).select().single();
  if (error) return json({ error: error.message }, 500);

  return json({ sessionId: session.id, expiresAt: session.expires_at });
});
