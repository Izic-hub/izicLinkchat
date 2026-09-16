import { supabase } from "./supabaseClient";

/** Every group on the platform, with host info resolved separately
 *  (avoids relying on PostgREST's foreign-key-name embedding, same
 *  reasoning as notifications.js). */
export async function getAllGroups() {
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, name, privacy, image_url, created_at, host_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (groups.length === 0) return [];

  const hostIds = [...new Set(groups.map((g) => g.host_id))];
  const { data: hosts } = await supabase.from("profiles").select("id, username, display_name").in("id", hostIds);
  const hostsById = Object.fromEntries((hosts || []).map((h) => [h.id, h]));

  return groups.map((g) => ({ ...g, host: hostsById[g.host_id] }));
}

export async function platformDeleteGroup(groupId) {
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw error;
}

/** Every user on the platform. Deliberately excludes phone_number — that
 *  column is revoked at the database level for everyone but its owner
 *  (see fix_phone_privacy.sql), including the platform admin. */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, profile_image_url, banned, is_platform_admin, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function setUserBanned(userId, banned) {
  const { error } = await supabase.from("profiles").update({ banned }).eq("id", userId);
  if (error) throw error;
}
