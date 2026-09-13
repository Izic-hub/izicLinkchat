import { supabase } from "./supabaseClient";

export async function getNotifications(userId, limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey(id, username, display_name), group:groups(id, name, invite_code)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function markAllRead(userId) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) throw error;
}

/** Live-push new notifications as they're created (e.g. someone mentions you right now). */
export function subscribeToNotifications(userId, onInsert) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function getMutedGroupIds(userId) {
  const { data, error } = await supabase.from("group_mutes").select("group_id").eq("user_id", userId);
  if (error) throw error;
  return new Set(data.map((r) => r.group_id));
}

export async function setGroupMuted(userId, groupId, muted) {
  if (muted) {
    const { error } = await supabase.from("group_mutes").insert({ user_id: userId, group_id: groupId });
    if (error && error.code !== "23505") throw error; // already muted is fine
  } else {
    const { error } = await supabase.from("group_mutes").delete().eq("user_id", userId).eq("group_id", groupId);
    if (error) throw error;
  }
}
