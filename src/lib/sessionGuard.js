import { supabase } from "./supabaseClient";

// Stored as "<userId>:<sessionId>" so a leftover id from a DIFFERENT account
// on the same browser is never mistaken for the current user's session.
const KEY = "linkchat-session";
let inFlight = null; // stops near-simultaneous calls racing each other

const stored = (uid) => {
  const v = localStorage.getItem(KEY) || "";
  const [u, s] = v.split(":");
  return u === uid && s ? s : null;
};

async function isValid(sessionId) {
  const { data, error } = await supabase.rpc("is_session_valid", { p_session_id: sessionId });
  if (error) throw error;
  return !!data;
}

/** Records this device's 24-hour session and signs every OTHER device out.
 *  Safe to call repeatedly: if this browser already holds a valid session it
 *  does nothing, so it can't keep resetting the 24h clock. */
export function registerSession(uid) {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const existing = stored(uid);
      if (existing) {
        try { if (await isValid(existing)) return; } catch { /* re-register below */ }
      }
      const { data, error } = await supabase.functions.invoke("register-session");
      if (error) throw error;
      localStorage.setItem(KEY, `${uid}:${data.sessionId}`);
    } catch (err) {
      console.error("Session registration failed:", err);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export const hasSession = (uid) => !!stored(uid);

/** true = fine; false = this device's session expired or was revoked.
 *  Fails OPEN on network/setup errors so a blip never signs anyone out. */
export async function checkSessionValid(uid) {
  const id = stored(uid);
  if (!id) return true;
  try { return await isValid(id); } catch { return true; }
}

export const clearSession = () => localStorage.removeItem(KEY);

/** Ends every session for the signed-in user, on every device, right now. */
export async function signOutEverywhere() {
  const { error } = await supabase.functions.invoke("revoke-user-sessions", { body: {} });
  if (error) throw error;
  clearSession();
}
