-- =====================================================================
-- LINKCHAT — storage buckets for group images and profile avatars
-- Run once in the SQL Editor.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('group-images', 'group-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Both buckets: anyone can view (they're public URLs used as <img> src),
-- any signed-in user can upload, and only the uploader can replace/delete
-- their own file (Supabase auto-sets `owner` to auth.uid() on upload).

create policy "group images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'group-images');

create policy "authenticated users can upload group images"
  on storage.objects for insert
  with check (bucket_id = 'group-images' and auth.role() = 'authenticated');

create policy "uploader can replace their own group image"
  on storage.objects for update
  using (bucket_id = 'group-images' and owner = auth.uid());

create policy "uploader can delete their own group image"
  on storage.objects for delete
  using (bucket_id = 'group-images' and owner = auth.uid());

create policy "avatars are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "uploader can replace their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and owner = auth.uid());

create policy "uploader can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and owner = auth.uid());
