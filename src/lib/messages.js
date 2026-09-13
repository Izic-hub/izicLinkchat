import { supabase } from "./supabaseClient";

/** Most recent messages for a group, oldest first (ready to render top-to-bottom). */
export async function getMessages(groupId, limit = 50) {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles(id, username, display_name, profile_image_url)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.reverse();
}

export async function sendMessage({ groupId, senderId, content, type = "text", replyTo = null }) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ group_id: groupId, sender_id: senderId, content, message_type: type, reply_to: replyTo })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Live message updates for one group. Call in a useEffect on the chat screen:
 *
 *   useEffect(() => {
 *     const unsubscribe = subscribeToMessages(groupId, (newMsg) => {
 *       setMessages((prev) => [...prev, newMsg]);
 *     });
 *     return unsubscribe;
 *   }, [groupId]);
 */
export function subscribeToMessages(groupId, onInsert) {
  const channel = supabase
    .channel(`messages:${groupId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/** Typing indicator via Supabase Presence — broadcast, not stored in the DB. */
export function subscribeToPresence(groupId, userId, { onTyping, onOnlineChange }) {
  const channel = supabase.channel(`presence:${groupId}`, { config: { presence: { key: userId } } });

  channel
    .on("presence", { event: "sync" }, () => {
      onOnlineChange?.(Object.keys(channel.presenceState()));
    })
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      onTyping?.(payload.userId);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

  function sendTyping() {
    channel.send({ type: "broadcast", event: "typing", payload: { userId } });
  }

  return { sendTyping, unsubscribe: () => supabase.removeChannel(channel) };
}
