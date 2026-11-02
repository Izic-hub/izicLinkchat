-- =====================================================================
-- Private (1-to-1) chat INSIDE an existing group.
-- No new group, no new invite link: two active members of the same
-- group can message each other privately.
--
-- Privacy design: this is its own table, on purpose. The group's
-- `messages` table has policies that let group admins delete anything
-- and the platform admin read everything. None of those policies exist
-- here, so only the two people in a private chat can ever read it.
--
-- Run after 09_notifications_schema.sql. If the first line errors with
-- "cannot run inside a transaction block", run that line alone first,
-- then run the rest.
-- =====================================================================

alter type notification_type add value if not exists 'direct_message';

create table public.direct_messages (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups(id) on delete cascade,
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  content       text not null check (char_length(content) between 1 and 4000),
  created_at    timestamptz not null default now(),
  read_at       timestamptz,
  check (sender_id <> recipient_id)
);

create index idx_dm_group_pair
  on public.direct_messages (group_id, sender_id, recipient_id, created_at desc);

alter table public.direct_messages enable row level security;

-- Is this specific user an active member of this group?
create or replace function public.is_member_of(p_group uuid, p_user uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group and user_id = p_user and status = 'active'
  );
$$;

-- Read: only the two participants, and only while they're still in the group.
create policy "participants read their private messages"
  on public.direct_messages for select
  using ((sender_id = auth.uid() or recipient_id = auth.uid()) and is_active_member(group_id));

-- Send: as yourself, to someone who is also an active member of that group.
create policy "members send private messages"
  on public.direct_messages for insert
  with check (
    sender_id = auth.uid()
    and is_active_member(group_id)
    and is_member_of(group_id, recipient_id)
  );

-- Delete: only the sender can remove their own message.
create policy "senders delete own private messages"
  on public.direct_messages for delete
  using (sender_id = auth.uid());

-- No UPDATE policy on purpose (nobody can edit what was sent). Marking
-- messages as read goes through this function, which can only ever touch
-- messages addressed to the caller.
create or replace function public.mark_dm_read(p_group uuid, p_other uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.direct_messages
  set read_at = now()
  where group_id = p_group and sender_id = p_other
    and recipient_id = auth.uid() and read_at is null;
$$;

grant execute on function public.mark_dm_read(uuid, uuid) to authenticated;

-- Tell the recipient. The notification never contains the message text,
-- and only one unread alert per sender per group is kept so a long
-- conversation doesn't flood the notification list.
create or replace function public.notify_on_direct_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  sender_name text;
begin
  if exists (
    select 1 from public.notifications
    where user_id = new.recipient_id and actor_id = new.sender_id
      and group_id = new.group_id and type = 'direct_message' and read = false
  ) then
    return new;
  end if;

  select coalesce(display_name, username) into sender_name
  from public.profiles where id = new.sender_id;

  insert into public.notifications (user_id, actor_id, group_id, type, content)
  values (new.recipient_id, new.sender_id, new.group_id, 'direct_message',
          coalesce(sender_name, 'Someone') || ' sent you a private message.');
  return new;
end;
$$;

drop trigger if exists on_direct_message_notify on public.direct_messages;
create trigger on_direct_message_notify
  after insert on public.direct_messages
  for each row execute function public.notify_on_direct_message();

-- Live delivery (replaces the dashboard Replication toggle for this table).
alter publication supabase_realtime add table public.direct_messages;
