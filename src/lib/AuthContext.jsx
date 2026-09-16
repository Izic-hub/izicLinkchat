import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext({ user: null, loading: true, banned: false, isPlatformAdmin: false });

/**
 * Wraps the whole app (see App.jsx). Reads the session once on load, then
 * stays in sync via Supabase's own auth-state listener — so every page
 * reads the same answer instead of each one re-querying and redirecting
 * independently (which is what was causing inconsistent behavior).
 *
 * Also fetches two flags off the profile once a user is known: `banned`
 * (platform-level suspension — RequireAuth in App.jsx blocks access
 * entirely when this is true) and `isPlatformAdmin` (gates the
 * /superadmin route).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banned, setBanned] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setBanned(false);
      setIsPlatformAdmin(false);
      return;
    }
    supabase
      .from("profiles")
      .select("banned, is_platform_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setBanned(!!data?.banned);
        setIsPlatformAdmin(!!data?.is_platform_admin);
      });
  }, [user]);

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
