import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { registerSession, checkSessionValid, hasSession, clearSession } from "./sessionGuard";

const AuthContext = createContext({ user: null, loading: true, banned: false, isPlatformAdmin: false });

const CHECK_EVERY_MS = 2 * 60 * 1000;

/**
 * Wraps the whole app (see App.jsx): one shared answer to "who is signed in",
 * so pages don't each re-check and redirect on their own.
 *
 * Besides the user it exposes two profile flags: `banned` (RequireAuth shows a
 * suspended screen) and `isPlatformAdmin` (gates /superadmin).
 *
 * Session security (see supabase/16_session_security.sql and the two Edge
 * Functions): once a user is signed in, this registers the device's session
 * (24h, and signs every other device out), then re-checks it every couple of
 * minutes and whenever the tab regains focus. If it expired, or a newer
 * sign-in / admin ban revoked it, the user is signed out here.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banned, setBanned] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") clearSession();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Session guard. Keyed on the user id (not the user object) so token
  // refreshes don't restart it.
  useEffect(() => {
    if (!userId) return;

    async function guard() {
      if (!hasSession(userId)) { await registerSession(userId); return; }
      if (!(await checkSessionValid(userId))) {
        clearSession();
        await supabase.auth.signOut();
      }
    }

    guard();
    const timer = setInterval(guard, CHECK_EVERY_MS);
    const onVisible = () => { if (document.visibilityState === "visible") guard(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setBanned(false);
      setIsPlatformAdmin(false);
      return;
    }
    supabase
      .from("profiles")
      .select("banned, is_platform_admin")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setBanned(!!data?.banned);
        setIsPlatformAdmin(!!data?.is_platform_admin);
      });
  }, [userId]);

  return (
    <AuthContext.Provider value={{ user, loading, banned, isPlatformAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Use this instead of calling getCurrentUser() directly inside a page. */
export function useAuth() {
  return useContext(AuthContext);
}
