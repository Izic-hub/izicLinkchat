-- =====================================================================
-- Fix: adds the two DELETE policies the schema was missing.
-- schema.sql had UPDATE policies for messages/groups but no DELETE ones
-- — with RLS enabled and no matching policy, delete always fails with
-- a permission error, regardless of who's asking. Needed for message
-- deletion and the new "delete group" feature.
-- =====================================================================

create policy "senders delete own messages" on public.messages for delete
  using (sender_id = auth.uid());

-- Deleting an entire group is host-only (not just any admin) — a bigger
-- action than the admin-level updates elsewhere.
create policy "host deletes group" on public.groups for delete
  using (host_id = auth.uid());
