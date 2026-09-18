-- =====================================================================
-- Creator / Super-Admin infrastructure.
-- One specific account (atendorisaac@gmail.com) gets full platform
-- oversight: see/delete any group, ban/unban any user. Enforced at the
-- database level (RLS), not just hidden behind a UI route — the UI gate
-- alone would not actually stop someone from calling the API directly.
-- =====================================================================

alter table public.profiles add column if not exists is_platform_admin boolean not null default false;
alter table public.profiles add column if not exists banned boolean not null default false;

-- One-time grant to the specific account. Re-running this is harmless —
-- it just re-confirms the same account.
update public.profiles
set is_platform_admin = true
where id = (select id from auth.users where email = 'atendorisaac@gmail.com');

create or replace function public.is_platform_admin_check()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_platform_admin from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.is_platform_admin_check() to authenticated;

-- These are ADDITIVE (permissive) policies — they grant the platform
-- admin extra access on top of everyone else's existing policies, they
-- don't remove anything from anyone else.
create policy "platform admin full access to groups" on public.groups for all
  using (is_platform_admin_check()) with check (is_platform_admin_check());

create policy "platform admin full access to profiles" on public.profiles for all
  using (is_platform_admin_check()) with check (is_platform_admin_check());

create policy "platform admin full access to messages" on public.messages for all
  using (is_platform_admin_check()) with check (is_platform_admin_check());

create policy "platform admin reads all memberships" on public.group_members for select
  using (is_platform_admin_check());
