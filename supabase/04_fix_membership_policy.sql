-- =====================================================================
-- Fix: a banned/muted user's own group_members row was invisible to them
-- under the existing "members can view roster" policy (which only shows
-- rows to *active* members). Without this, the ban check in joinGroup()
-- can't see the banned row and lets them silently back in.
-- Run this once in the SQL Editor, after fix_profile_trigger.sql.
-- =====================================================================

create policy "users can view own membership regardless of status"
  on public.group_members for select
  using (user_id = auth.uid());
