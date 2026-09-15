import { supabase } from "./supabaseClient";

export async function getProfile(userId) {
  // phone_number is intentionally excluded here — it's column-restricted
  // at the database level (see fix_phone_privacy.sql), so a plain
  // select("*") would now error out entirely rather than just omit it.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, phone_discoverable, phone_visible, username_visible, show_online_status, profile_image_url, bio, created_at")
    .eq("id", userId)
    .single();
  if (error) throw error;

  // Fetch the phone number separately via a function that only ever
  // returns the CALLER's own number — safe even though userId here is
  // always "my own id" in this app today, since it can't accidentally
  // return someone else's number even if that ever changes.
  const { data: phone } = await supabase.rpc("get_my_phone_number");
  return { ...data, phone_number: phone };
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

/** Read-only view of ANY user's profile — used for "View profile" from a
 *  member list. Deliberately excludes phone_number (which is revoked at
 *  the database level for everyone but the owner anyway, see
 *  fix_phone_privacy.sql) and the privacy-setting booleans, which are
 *  nobody else's business. */
export async function getPublicProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, profile_image_url, bio, created_at")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

/** Groups & people search for the Search & Discovery screen. */
export async function searchGroups(query) {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, image_url, privacy")
    .eq("privacy", "public")
    .ilike("name", `%${query}%`)
    .limit(20);
  if (error) throw error;
  return data;
}

export async function searchPeople(query) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, profile_image_url")
    .eq("username_visible", true)
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return data;
}
