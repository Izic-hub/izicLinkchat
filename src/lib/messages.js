import { supabase } from './supabaseClient';

/**
 * Sends a message and immediately returns the newly inserted database row.
 * This is what allows your UI to update seamlessly without reloading.
 */
export const sendMessage = async (text, groupId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in to send messages');

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          text,
          group_id: groupId,
          sender_id: user.id
        }
      ])
      .select(`
        id,
        text,
        created_at,
        sender_id,
        profiles:sender_id ( username, avatar_url )
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Message delivery failed:', error.message);
    return { data: null, error };
  }
};
