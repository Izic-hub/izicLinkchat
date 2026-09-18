-- =====================================================================
-- Storage bucket for message attachments (images, files, voice notes).
-- Same pattern as group-images and avatars from storage_setup.sql.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', true)
on conflict (id) do nothing;

create policy "message attachments are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'message-attachments');

create policy "authenticated users can upload message attachments"
  on storage.objects for insert
  with check (bucket_id = 'message-attachments' and auth.role() = 'authenticated');

create policy "uploader can delete their own attachment"
  on storage.objects for delete
  using (bucket_id = 'message-attachments' and owner = auth.uid());
