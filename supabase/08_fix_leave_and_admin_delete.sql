-- =====================================================================
-- Two additive policies (both permissive — they add access, they don't
-- take any away from the existing policies they sit alongside).
-- =====================================================================

-- A member can remove their own row (= "Leave Group"). This sits next to
-- the existing "admins remove members" policy — together they cover both
-- self-removal and admin-initiated removal.
create policy "members can leave groups" on public.group_members for delete
  using (user_id = auth.uid());

-- Host/admin can delete ANY message in a group they manage, not just
-- their own — sits next to "senders delete own messages".
create policy "admins delete any group message" on public.messages for delete
  using (is_group_admin(group_id));
