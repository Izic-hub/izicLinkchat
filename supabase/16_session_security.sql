-- =====================================================================
-- Session security: 24-hour expiry, one device at a time, instant
-- revocation. This is the Free-plan equivalent of Supabase's Pro-only
-- "User Sessions" settings.
--
-- A JWT can't be un-issued early, so enforcement lives in a table we
-- control. Sessions are written ONLY by the two Edge Functions in
-- supabase/functions/ (service-role key, bypasses RLS). A client can
-- read its own rows and ask "is my session still valid?" - nothing more.
-- =====================================================================

create table public.active_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '24 hours')
);

create index idx_active_sessions_user on public.active_sessions (user_id);

alter table public.active_sessions enable row level security;

create policy "users read own sessions" on public.active_sessions for select
  using (user_id = auth.uid());

create or replace function public.is_session_valid(p_session_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.active_sessions
    where id = p_session_id and user_id = auth.uid() and expires_at > now()
  );
$$;

grant execute on function public.is_session_valid(uuid) to authenticated;
