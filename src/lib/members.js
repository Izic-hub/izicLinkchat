import { supabase } from "./supabaseClient";

export async function getMembers(groupId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("id, role, status, joined_at, profile:profiles(id, username, display_name, profile_image_url)")
    .eq("group_id", groupId)
    .order("role", { ascending: true }); // 'admin' < 'host' < 'member' alphabetically — sort client-side if exact order matters
  if (error) throw error;
  return data;
}

export async function setMemberRole(memberRowId, role) {
  const { error } = await supabase.from("group_members").update({ role }).eq("id", memberRowId);
  if (error) throw error;
}

export async function setMemberStatus(memberRowId, status) {
  // status: 'active' | 'muted' | 'banned'
  const { error } = await supabase.from("group_members").update({ status }).eq("id", memberRowId);
  if (error) throw error;
}

export async function removeMember(memberRowId) {
  const { error } = await supabase.from("group_members").delete().eq("id", memberRowId);
  if (error) throw error;
}
