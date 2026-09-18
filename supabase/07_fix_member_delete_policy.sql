-- =====================================================================
-- Fix: group_members never had a DELETE policy at all. With RLS enabled
-- and no matching policy, every "Remove member" click was silently
-- failing at the database level — the row never actually left the table,
-- so it reappeared on the next fetch. This is the real cause of "removed
-- members reappear."
-- =====================================================================

create policy "admins remove members" on public.group_members for delete
  using (is_group_admin(group_id));
