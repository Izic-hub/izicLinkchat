import { supabase } from "./supabaseClient";
import { uploadImage } from "./storage";

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

/** Image, file, or voice message — uploads to the 'message-attachments'
 *  bucket first, then inserts a row pointing at it. `file` can be a real
 *  File (from an <input type="file">) or a Blob wrapped as a File (voice
 *  recordings, which come from MediaRecorder). */
export async function sendMediaMessage({ groupId, senderId, file, type }) {
  const mediaUrl = await uploadImage("message-attachments", file);
  const { data, error } = await supabase
    .from("messages")
    .insert({
      group_id: groupId,
      sender_id: senderId,
      content: type === "voice" ? "Voice message" : file.name,
      message_type: type,
      media_url: mediaUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function editMessage(messageId, content) {
  const { data, error } = await supabase
    .from("messages")
    .update({ content, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMessage(messageId) {
  const { error } = await supabase.from("messages").delete().eq("id", messageId);
  if (error) throw error;
}

/**
 * Live message changes for one group — insert, edit, and delete all in one
 * subscription. Call in a useEffect on the chat screen:
 *
 *   useEffect(() => {
 *     const unsubscribe = subscribeToMessageChanges(groupId, {
 *       onInsert: (msg) => ...,
 *       onUpdate: (msg) => ...,
 *       onDelete: (id) => ...,
 *     });
 *     return unsubscribe;
 *   }, [groupId]);
 */
export function subscribeToMessageChanges(groupId, { onInsert, onUpdate, onDelete }) {
  const channel = supabase
    .channel(`messages:${groupId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
      (payload) => onInsert?.(payload.new)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
      (payload) => onUpdate?.(payload.new)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
      (payload) => onDelete?.(payload.old.id)
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
