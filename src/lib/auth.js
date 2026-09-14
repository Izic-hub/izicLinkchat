import { supabase } from "./supabaseClient";

/**
 * Sign up a new user. Supabase Auth creates the row in auth.users; a
 * database trigger (see fix_profile_trigger.sql) then automatically
 * creates the matching public.profiles row using the username/phone
 * passed here as metadata — no separate insert needed from the client.
 */
export async function signUp({ email, password, username, phone }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, phone_number: phone || null } },
  });
  if (error) throw error;

  return { pendingConfirmation: !data.session, userId: data.user?.id };
}

/**
 * Sign in with email + password. The AuthScreen UI also accepts username
 * or phone as the identifier — Supabase Auth itself only knows email, so
 * if you want username/phone login you'd look up the matching email in
 * `profiles` first, then pass that email here.
 */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Redirects the browser to Google, then back to this app once they
 *  approve — Supabase handles the OAuth exchange and creates a session
 *  automatically. AuthContext picks up the new session via its listener,
 *  no further code needed after calling this. Requires Google to be
 *  configured as a provider in Supabase (Authentication → Providers). */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function getCurrentUser() {
  // getSession() returns null gracefully when signed out; getUser() throws
  // an AuthSessionMissingError instead, which was surfacing as a visible
  // "Auth session missing!" error on every signed-out page instead of the
  // intended sign-in redirect.
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user ?? null;
}

/** Fires on sign-in, sign-out, and token refresh — use in App.jsx to track auth state app-wide. */
export function onAuthStateChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => listener.subscription.unsubscribe();
}
