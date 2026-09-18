-- =====================================================================
-- Granular notifications — PART 2 of 2.
-- Run fix_granular_notifications_part1.sql FIRST, then this.
-- =====================================================================

-- Group settings changed (name, photo, description) → tell every active member.
create or replace function public.notify_on_group_updated()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  member_row record;
  change_desc text := '';
begin
  if new.name is distinct from old.name then
    change_desc := change_desc || 'renamed the group to "' || new.name || '". ';
  end if;
  if new.image_url is distinct from old.image_url then
    change_desc := change_desc || 'updated the group photo. ';
  end if;
  if new.description is distinct from old.description then
    change_desc := change_desc || 'updated the group description. ';
  end if;

  if change_desc = '' then
    return new; -- nothing notification-worthy changed (e.g. just a privacy toggle)
  end if;

  for member_row in
    select user_id from public.group_members where group_id = new.id and status = 'active'
  loop
    insert into public.notifications (user_id, group_id, type, content)
    values (member_row.user_id, new.id, 'group_updated', trim(change_desc));
  end loop;

  return new;
end;
$$;

drop trigger if exists on_group_updated_notify on public.groups;
create trigger on_group_updated_notify
  after update on public.groups
  for each row execute function public.notify_on_group_updated();

-- Member removed entirely (kicked or left) → tell the remaining host/admins.
create or replace function public.notify_on_member_removed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  admin_row record;
  removed_name text;
begin
  if old.status not in ('active', 'muted') then
    return old; -- cleanup of a pending/already-banned row isn't notification-worthy
  end if;

  select coalesce(display_name, username) into removed_name from public.profiles where id = old.user_id;

  for admin_row in
    select user_id from public.group_members
    where group_id = old.group_id and status = 'active' and role in ('host','admin') and user_id <> old.user_id
  loop
    insert into public.notifications (user_id, group_id, type, content)
    values (admin_row.user_id, old.group_id, 'member_removed', coalesce(removed_name, 'A member') || ' left or was removed from the group.');
  end loop;

  return old;
end;
$$;

drop trigger if exists on_member_removed_notify on public.group_members;
create trigger on_member_removed_notify
  after delete on public.group_members
  for each row execute function public.notify_on_member_removed();

-- Member banned (a status change, not a row deletion) → tell host/admins.
create or replace function public.notify_on_member_banned()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  admin_row record;
  banned_name text;
begin
  if new.status <> 'banned' or old.status = 'banned' then
    return new;
  end if;

  select coalesce(display_name, username) into banned_name from public.profiles where id = new.user_id;

  for admin_row in
    select user_id from public.group_members
    where group_id = new.group_id and status = 'active' and role in ('host','admin') and user_id <> new.user_id
  loop
    insert into public.notifications (user_id, group_id, type, content)
    values (admin_row.user_id, new.group_id, 'member_removed', coalesce(banned_name, 'A member') || ' was banned from the group.');
  end loop;

  return new;
end;
$$;

drop trigger if exists on_member_banned_notify on public.group_members;
create trigger on_member_banned_notify
  after update on public.group_members
  for each row execute function public.notify_on_member_banned();
