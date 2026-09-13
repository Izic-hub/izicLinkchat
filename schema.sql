-- =====================================================================
-- LINKCHAT — Postgres / Supabase schema
-- Matches the shape already used by the frontend mock data layer:
--   profiles.id      <-> CURRENT_USER.id / senderId  (uuid, not "u1")
--   groups.id        <-> GROUPS[].id                 (uuid, not "g1")
--   group_members.role   <-> RoleBadge "Host"/"Admin"/"Member"
--   messages.message_type <-> Message "text"/"announcement"
-- Swap the mock arrays (GROUPS, MEMBERS, INITIAL_MESSAGES, fakeSend) for
-- queries/inserts against these tables + a realtime channel on `messages`.
-- =====================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type group_privacy   as enum ('public', 'private');
create type member_role     as enum ('host', 'admin', 'member');
create type member_status   as enum ('active', 'muted', 'banned', 'pending');
create type message_type    as enum ('text', 'image', 'file', 'voice', 'announcement', 'system');

-- ---------------------------------------------------------------------
-- PROFILES  (extends Supabase auth.users — do not duplicate auth fields)
-- ---------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text unique not null,
  display_name        text,
  phone_number        text unique,
  profile_image_url   text,
  bio                 text,
  -- privacy controls (page 10 in the brief)
  phone_discoverable  boolean not null default false,
  phone_visible       boolean not null default false,
  username_visible    boolean not null default true,
  show_online_status  boolean not null default true,
  created_at          timestamptz not null default now()
);

create index idx_profiles_username on public.profiles (username);
create index idx_profiles_phone    on public.profiles (phone_number) where phone_discoverable;

-- ---------------------------------------------------------------------
-- GROUPS
-- ---------------------------------------------------------------------
create table public.groups (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  image_url         text,
  category          text,
  privacy           group_privacy not null default 'public',
  host_id           uuid not null references public.profiles(id),
  invite_code       text unique not null,          -- e.g. "ABX72K" -> /join/ABX72K
  invite_enabled    boolean not null default true,
  -- admin dashboard toggles (page 9)
  media_enabled     boolean not null default true,
  files_enabled     boolean not null default true,
  slow_mode_seconds int not null default 0,
  announcement_mode boolean not null default false,
  created_at        timestamptz not null default now()
);

create index idx_groups_invite_code on public.groups (invite_code);
create index idx_groups_host        on public.groups (host_id);

-- ---------------------------------------------------------------------
-- GROUP MEMBERS
-- ---------------------------------------------------------------------
create table public.group_members (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        member_role   not null default 'member',
  status      member_status not null default 'active',
  joined_at   timestamptz not null default now(),
  unique (group_id, user_id)
);

create index idx_members_group on public.group_members (group_id);
create index idx_members_user  on public.group_members (user_id);

-- ---------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups(id) on delete cascade,
  sender_id     uuid not null references public.profiles(id),
  content       text,
  message_type  message_type not null default 'text',
  media_url     text,
  reply_to      uuid references public.messages(id),
  reactions     jsonb not null default '[]',   -- [{ "emoji": "👍", "user_ids": [...] }]
  pinned        boolean not null default false,
  edited_at     timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_messages_group_time on public.messages (group_id, created_at desc);
create index idx_messages_reply      on public.messages (reply_to);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Core rule: you may only read/write a group's data if you are an
-- active member of that group (or the action is host/admin-only).
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.groups       enable row level security;
alter table public.group_members enable row level security;
alter table public.messages     enable row level security;

create or replace function public.is_active_member(p_group_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
      and status = 'active' and role in ('host', 'admin')
  );
$$;

-- profiles: readable by anyone (username search); writable only by owner
create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

-- groups: public groups readable by all; private groups readable by members only
create policy "public groups are readable" on public.groups for select
  using (privacy = 'public' or is_active_member(id));
create policy "hosts/admins update group" on public.groups for update
  using (is_group_admin(id));
create policy "authenticated users create groups" on public.groups for insert
  with check (auth.uid() = host_id);

-- group_members: members of a group can see the roster
create policy "members can view roster" on public.group_members for select
  using (is_active_member(group_id));
create policy "users can join (insert own row)" on public.group_members for insert
  with check (user_id = auth.uid());
create policy "admins manage members" on public.group_members for update
  using (is_group_admin(group_id));

-- messages: only active members can read/send within their group
create policy "members read messages" on public.messages for select
  using (is_active_member(group_id));
create policy "members send messages" on public.messages for insert
  with check (is_active_member(group_id) and sender_id = auth.uid());
create policy "senders edit own messages" on public.messages for update
  using (sender_id = auth.uid());

-- ---------------------------------------------------------------------
-- REALTIME
-- ---------------------------------------------------------------------
-- In Supabase: enable replication on `messages` (and `group_members` for
-- presence/online-status), then subscribe client-side:
--   supabase.channel('group:' + groupId)
--     .on('postgres_changes', { event: 'INSERT', schema: 'public',
--         table: 'messages', filter: `group_id=eq.${groupId}` }, handler)
--     .subscribe()
