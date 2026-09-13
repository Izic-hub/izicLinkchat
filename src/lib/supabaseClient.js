import { createClient } from "@supabase/supabase-js";

// Every page imports its Supabase access from here — one client, one
// realtime connection, rather than each page creating its own.
//
//   import { supabase } from "../lib/supabaseClient";
//
// Until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set in .env, this
// client exists but every call to it will fail — pages keep working off
// their own mock data until each is wired up individually.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabaseClient] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — " +
    "set them in .env once the Supabase project exists. Pages using mock data still work."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
