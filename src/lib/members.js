import { supabase } from "./supabaseClient";

/** The normal member roster — excludes banned (they shouldn't clutter the
 *  regular list) and pending (those are join requests, not members yet;
 *  see getPendingMembers below). */
export async function getMembers(groupId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("id, role, status, joined_at, profile:profiles(id, username, display_name, profile_image_url)")
    .eq("group_id", groupId)
    .in("status", ["active", "muted"])
    .order("role", { ascending: true });
  if (error) throw error;
  return data;
}

/** Banned members — kept separate from the main roster so admins have a
 *  dedicated place to review and (if needed) unban someone. */
export async function getBannedMembers(groupId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("id, role, status, joined_at, profile:profiles(id, username, display_name, profile_image_url)")
    .eq("group_id", groupId)
    .eq("status", "banned");
  if (error) throw error;
  return data;
}

/** Pending join requests for a private group — waiting on host/admin approval. */
export async function getPendingMembers(groupId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("id, role, status, joined_at, profile:profiles(id, username, display_name, profile_image_url)")
    .eq("group_id", groupId)
    .eq("status", "pending");
  if (error) throw error;
  return data;
}

export async function setMemberRole(memberRowId, role) {
  const { error } = await supabase.from("group_members").update({ role }).eq("id", memberRowId);
  if (error) throw error;
}

export async function setMemberStatus(memberRowId, status) {
  // status: 'active' | 'muted' | 'banned' | 'pending'
  const { error } = await supabase.from("group_members").update({ status }).eq("id", memberRowId);
  if (error) throw error;
}

export async function unbanMember(memberRowId) {
  return setMemberStatus(memberRowId, "active");
}

/** Approve a pending join request. */
export async function approveMember(memberRowId) {
  return setMemberStatus(memberRowId, "active");
}

/** Deny a pending join request — just removes the row entirely rather
 *  than leaving a rejected-but-visible status around. */
export async function denyMember(memberRowId) {
  return removeMember(memberRowId);
}

export async function removeMember(memberRowId) {
  const { error } = await supabase.from("group_members").delete().eq("id", memberRowId);
  if (error) throw error;
}
