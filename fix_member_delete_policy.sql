-- =====================================================================
-- group_members  DELETE policy  .  "
-- =====================================================================

create policy "admins remove members" on public.group_members for delete
  using (is_group_admin(group_id));
