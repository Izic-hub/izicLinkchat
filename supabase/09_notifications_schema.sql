-- =====================================================================
-- LINKCHAT — notifications schema + triggers
-- Adds: notifications table, group_mutes, group_invites (direct,
-- by-username invites — separate from the shareable invite_code link),
-- and three triggers that generate notifications automatically:
--   1. on_message_notify      — mentions, replies, announcements
--   2. on_member_joined_notify — tells host/admins when someone joins
--   3. on_invite_notify        — tells the invitee they were invited
-- Run this once, after schema.sql and the earlier fix_*.sql files.
-- =====================================================================

create type notification_type as enum ('mention', 'reply', 'invite', 'member_joined', 'announcement');

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,  -- recipient
  actor_id    uuid references public.profiles(id),                             -- who triggered it
  group_id    uuid references public.groups(id) on delete cascade,
  message_id  uuid references public.messages(id) on delete cascade,
  type        notification_type not null,
  content     text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user_time on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users read own notifications" on public.notifications for select
  using (user_id = auth.uid());
create policy "users mark own notifications read" on public.notifications for update
  using (user_id = auth.uid());
-- No insert policy for clients on purpose — notifications are only ever
-- created by the trigger functions below, which run as security definer.

-- ---------------------------------------------------------------------
-- GROUP MUTES (per-user, per-group — the "Mute group" button)
-- ---------------------------------------------------------------------
create table public.group_mutes (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  group_id  uuid not null references public.groups(id) on delete cascade,
  muted_at  timestamptz not null default now(),
  primary key (user_id, group_id)
);

alter table public.group_mutes enable row level security;

create policy "users manage own mutes" on public.group_mutes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- GROUP INVITES (direct, by-username — distinct from the shareable link)
-- ---------------------------------------------------------------------
create table public.group_invites (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  inviter_id  uuid not null references public.profiles(id),
  invitee_id  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (group_id, invitee_id)
);

alter table public.group_invites enable row level security;

create policy "invitee or inviter can read the invite" on public.group_invites for select
  using (invitee_id = auth.uid() or inviter_id = auth.uid());
create policy "host/admin creates invites" on public.group_invites for insert
  with check (is_group_admin(group_id));

-- ---------------------------------------------------------------------
-- TRIGGER 1 — new message: mentions, replies, announcements
-- ---------------------------------------------------------------------
create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  mention_username text;
  mentioned_user uuid;
  reply_sender uuid;
  member_row record;
begin
  -- announcement: notify every OTHER active member
  if new.message_type = 'announcement' then
    for member_row in
      select user_id from public.group_members
      where group_id = new.group_id and status = 'active' and user_id <> new.sender_id
    loop
      insert into public.notifications (user_id, actor_id, group_id, message_id, type, content)
      values (member_row.user_id, new.sender_id, new.group_id, new.id, 'announcement', left(new.content, 140));
    end loop;
    return new;
  end if;

  -- reply: notify the original message's sender (unless replying to self)
  if new.reply_to is not null then
    select sender_id into reply_sender from public.messages where id = new.reply_to;
    if reply_sender is not null and reply_sender <> new.sender_id then
      insert into public.notifications (user_id, actor_id, group_id, message_id, type, content)
      values (reply_sender, new.sender_id, new.group_id, new.id, 'reply', left(new.content, 140));
    end if;
  end if;

  -- mentions: @username tokens, must resolve to an active member of this group
  for mention_username in
    select distinct m[1] from regexp_matches(coalesce(new.content, ''), '@([A-Za-z0-9_.]+)', 'g') as m
  loop
    select p.id into mentioned_user
    from public.profiles p
    join public.group_members gm on gm.user_id = p.id and gm.group_id = new.group_id and gm.status = 'active'
    where p.username = mention_username;

    if mentioned_user is not null and mentioned_user <> new.sender_id then
      insert into public.notifications (user_id, actor_id, group_id, message_id, type, content)
      values (mentioned_user, new.sender_id, new.group_id, new.id, 'mention', left(new.content, 140));
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_message_notify on public.messages;
create trigger on_message_notify
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- ---------------------------------------------------------------------
-- TRIGGER 2 — new member joined: tells host/admins
-- ---------------------------------------------------------------------
create or replace function public.notify_on_member_joined()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  admin_row record;
  joiner_name text;
begin
  if new.status <> 'active' or new.role <> 'member' then
    return new; -- don't notify for the host's own row, or re-activations
  end if;

  select coalesce(display_name, username) into joiner_name from public.profiles where id = new.user_id;

  for admin_row in
    select user_id from public.group_members
    where group_id = new.group_id and status = 'active' and role in ('host','admin') and user_id <> new.user_id
  loop
    insert into public.notifications (user_id, actor_id, group_id, type, content)
    values (admin_row.user_id, new.user_id, new.group_id, 'member_joined', coalesce(joiner_name, 'Someone') || ' joined the group.');
  end loop;

  return new;
end;
$$;

drop trigger if exists on_member_joined_notify on public.group_members;
create trigger on_member_joined_notify
  after insert on public.group_members
  for each row execute function public.notify_on_member_joined();

-- ---------------------------------------------------------------------
-- TRIGGER 3 — direct invite created: tells the invitee
-- ---------------------------------------------------------------------
create or replace function public.notify_on_invite()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inviter_name text;
  target_group_name text;
begin
  select coalesce(display_name, username) into inviter_name from public.profiles where id = new.inviter_id;
  select name into target_group_name from public.groups where id = new.group_id;

  insert into public.notifications (user_id, actor_id, group_id, type, content)
  values (new.invitee_id, new.inviter_id, new.group_id, 'invite',
          coalesce(inviter_name, 'Someone') || ' invited you to join ' || coalesce(target_group_name, 'a group') || '.');

  return new;
end;
$$;

drop trigger if exists on_invite_notify on public.group_invites;
create trigger on_invite_notify
  after insert on public.group_invites
  for each row execute function public.notify_on_invite();
