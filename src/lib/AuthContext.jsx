import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext({ user: null, loading: true });

/**
 * Wraps the whole app (see App.jsx). Reads the session once on load, then
 * stays in sync via Supabase's own auth-state listener — so every page
 * reads the same answer instead of each one re-querying and redirecting
 * independently (which is what was causing inconsistent behavior).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
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

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

/** Use this instead of calling getCurrentUser() directly inside a page. */
export function useAuth() {
  return useContext(AuthContext);
}
