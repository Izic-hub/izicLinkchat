-- =====================================================================
-- Fix: the profile-creation trigger (from fix_profile_trigger.sql) only
-- ever set username/phone from signup metadata. A Google sign-in has no
-- "username" — it has full_name and avatar_url instead — so without this,
-- every Google user would land with a blank display name and no photo.
-- This replaces that function to also populate those two fields when
-- Google (or any OAuth provider using the same field names) provides them.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, phone_number, display_name, profile_image_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
