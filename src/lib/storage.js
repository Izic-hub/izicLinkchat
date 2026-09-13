import { supabase } from "./supabaseClient";

/** Upload a File to a public bucket ('group-images' or 'avatars') and
 *  return its public URL. Used by CreateGroupFlow, GroupAdminDashboard
 *  (group photo), and UserProfile (avatar). */
export async function uploadImage(bucket, file) {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
