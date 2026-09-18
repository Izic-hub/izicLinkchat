-- =====================================================================
-- Fix: phone_number privacy gap.
--
-- The "profiles are publicly readable" policy in schema.sql is a ROW-level
-- policy (using (true)) — it makes every row visible, with no way to hide
-- just one column per row. In practice this means the phone_visible /
-- phone_discoverable toggles on the Profile page were cosmetic: nothing
-- in the database actually stopped a direct query (via the Supabase REST
-- API, using nothing but the public anon key) from reading ANY user's
-- phone_number, regardless of their settings.
--
-- No current app code path actually does this (search results and message
-- senders never select phone_number), but the raw table was still exposed
-- to anyone querying the API directly — a real gap, not just a UI one.
--
-- Fix: revoke SELECT on that one column at the database level, and add a
-- security-definer function that only ever returns the CALLER's own phone
-- number. This makes the restriction absolute — no policy or app code can
-- accidentally leak it — while leaving every other column (username,
-- bio, image, etc.) exactly as before.
-- =====================================================================

revoke select (phone_number) on public.profiles from authenticated, anon;

create or replace function public.get_my_phone_number()
returns text
language sql
security definer set search_path = public
stable
as $$
  select phone_number from public.profiles where id = auth.uid();
$$;

grant execute on function public.get_my_phone_number() to authenticated;
