import { supabase } from "./supabaseClient";

/** Everyone I've privately messaged (or been messaged by) in this group,
 *  newest conversation first, with the last message and an unread count.
 *  Row-level security already limits the query to messages I'm part of. */
export async function getConversations(groupId, myId) {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, content, created_at, read_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const byPerson = new Map();
  for (const m of data) {
    const other = m.sender_id === myId ? m.recipient_id : m.sender_id;
    if (!byPerson.has(other)) byPerson.set(other, { userId: other, last: m, unread: 0 });
    if (m.recipient_id === myId && !m.read_at) byPerson.get(other).unread += 1;
  }
  return [...byPerson.values()];
}

/** The full thread between me and one other member, oldest first. */
export async function getDirectMessages(groupId, otherId, limit = 100) {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("group_id", groupId)
    .or(`sender_id.eq.${otherId},recipient_id.eq.${otherId}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.reverse();
}

export async function sendDirectMessage({ groupId, senderId, recipientId, content }) {
  const { data, error } = await supabase
    .from("direct_messages")
    .insert({ group_id: groupId, sender_id: senderId, recipient_id: recipientId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markRead(groupId, otherId) {
  const { error } = await supabase.rpc("mark_dm_read", { p_group: groupId, p_other: otherId });
  if (error) throw error;
}

export async function deleteDirectMessage(id) {
  const { error } = await supabase.from("direct_messages").delete().eq("id", id);
  if (error) throw error;
}

/** Live updates. Realtime applies the table's RLS, so this channel only
 *  ever delivers rows the current user is allowed to read. */
export function subscribeToDirectMessages(groupId, myId, onEvent) {
  const channel = supabase
    .channel(`dm:${groupId}:${myId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "direct_messages", filter: `group_id=eq.${groupId}` },
      (p) => onEvent({ type: "insert", row: p.new })
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "direct_messages", filter: `group_id=eq.${groupId}` },
      (p) => onEvent({ type: "delete", id: p.old.id })
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
