import { supabase } from "./supabaseClient";

/**
 * Fetches notifications, then separately fetches the actor profiles and
 * groups involved and merges them in — rather than relying on PostgREST's
 * foreign-key-name embedding hint (profiles!notifications_actor_id_fkey),
 * which silently returns nothing if that auto-generated constraint name
 * ever doesn't match exactly. This is slower by one round-trip but far
 * more robust, and easy to reason about when debugging.
 */
export async function getNotifications(userId, limit = 50) {
  const { data: notifs, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (notifs.length === 0) return [];

  const actorIds = [...new Set(notifs.map((n) => n.actor_id).filter(Boolean))];
  const groupIds = [...new Set(notifs.map((n) => n.group_id).filter(Boolean))];

  const [actorsRes, groupsRes] = await Promise.all([
    actorIds.length
      ? supabase.from("profiles").select("id, username, display_name").in("id", actorIds)
      : { data: [] },
    groupIds.length
      ? supabase.from("groups").select("id, name, invite_code").in("id", groupIds)
      : { data: [] },
  ]);

  const actorsById = Object.fromEntries((actorsRes.data || []).map((a) => [a.id, a]));
  const groupsById = Object.fromEntries((groupsRes.data || []).map((g) => [g.id, g]));

  return notifs.map((n) => ({
    ...n,
    actor: n.actor_id ? actorsById[n.actor_id] : null,
    group: n.group_id ? groupsById[n.group_id] : null,
  }));
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
