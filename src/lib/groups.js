import { supabase } from "./supabaseClient";
import { uploadImage } from "./storage";

function genInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** Create a group and add the creator as host in one call. */
export async function createGroup({ name, description, category, privacy, imageFile, userId }) {
  let imageUrl = null;
  if (imageFile) {
    imageUrl = await uploadGroupImage(imageFile);
  }

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name,
      description,
      category,
      privacy,
      image_url: imageUrl,
      host_id: userId,
      invite_code: genInviteCode(),
    })
    .select()
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: userId,
    role: "host",
    status: "active",
  });
  if (memberError) throw memberError;

  return group;
}

/** Upload to the 'group-images' storage bucket. */
async function uploadGroupImage(file) {
  return uploadImage("group-images", file);
}

/** For the Join Group preview screen — fetch group info by its invite code, before joining. */
export async function getGroupByInviteCode(code) {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, image_url, privacy, invite_enabled, members:group_members(count)")
    .eq("invite_code", code)
    .single();
  if (error) throw error;
  return data;
}

/** Add the current user as a member of a group (the actual "Join Conversation" action). */
/** Add the current user as a member of a group (the actual "Join Conversation"
 *  action). Public groups grant access immediately; private groups create a
 *  pending request that needs host/admin approval instead — pass the group's
 *  privacy in so this doesn't need an extra round-trip to look it up. */
export async function joinGroup({ groupId, userId, privacy }) {
  // Check for an existing row first — someone can only ever have one
  // group_members row per group (unique constraint), so re-joining after
  // being banned must be blocked explicitly rather than silently allowed
  // through as "already a member."
  const { data: existing } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.status === "banned") {
    throw new Error("You've been banned from this group.");
  }
  if (existing?.status === "pending") {
    return { status: "pending" }; // already requested — nothing new to do
  }
  if (existing) {
    return { status: "active" }; // already an active/muted member
  }

  const initialStatus = privacy === "private" ? "pending" : "active";

  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: userId,
    role: "member",
    status: initialStatus,
  });
  if (error) throw error;

  return { status: initialStatus };
}

/** Groups the current user belongs to, for the sidebar list and Landing "My Groups". */
export async function getMyGroups(userId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("role, groups(id, name, description, image_url, privacy)")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw error;
  return data.map((row) => ({ ...row.groups, myRole: row.role }));
}

export async function getGroupDetails(groupId) {
  const { data, error } = await supabase.from("groups").select("*").eq("id", groupId).single();
  if (error) throw error;
  return data;
}

export async function updateGroupSettings(groupId, updates) {
  const { error } = await supabase.from("groups").update(updates).eq("id", groupId);
  if (error) throw error;
}

export async function regenerateInviteCode(groupId) {
  const code = genInviteCode();
  const { error } = await supabase.from("groups").update({ invite_code: code }).eq("id", groupId);
  if (error) throw error;
  return code;
}

/** Permanently deletes a group. RLS restricts this to the host only.
 *  Everything else (members, messages, invites, mutes) cascades via the
 *  foreign keys already defined in schema.sql — nothing else to clean up. */
export async function deleteGroup(groupId) {
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw error;
}

/** Directly invite one person by username — distinct from the shareable
 *  invite_code link. Only host/admin can do this (enforced by RLS via
 *  is_group_admin). The database trigger on group_invites creates the
 *  actual notification the invitee sees. */
export async function inviteUserToGroup({ groupId, inviterId, username }) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const { data: invitee, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", cleanUsername)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!invitee) throw new Error("No user found with that username.");

  const { error } = await supabase.from("group_invites").insert({
    group_id: groupId,
    inviter_id: inviterId,
    invitee_id: invitee.id,
  });
  if (error) {
    if (error.code === "23505") throw new Error("You've already invited this person.");
    throw error;
  }
}
