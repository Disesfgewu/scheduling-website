-- ============================================================
-- Migration 004: Storage Bucket for Trip Cover Images
-- Bucket: trip-images（公開讀，登入後可上傳）
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-images',
  'trip-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 登入使用者可上傳（路徑建議：trips/{tripId}/{timestamp}.jpg）
create policy "trip_images_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'trip-images' and
    auth.role() = 'authenticated'
  );

-- 所有人可讀（封面圖是公開的）
create policy "trip_images_read"
  on storage.objects for select
  using (bucket_id = 'trip-images');

-- 上傳者可刪除自己的圖片
create policy "trip_images_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'trip-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── App 端使用方式（接 Supabase 後參考）────────────────────
-- const { data, error } = await supabase.storage
--   .from('trip-images')
--   .upload(`trips/${tripId}/${Date.now()}.jpg`, file, {
--     cacheControl: '3600',
--     upsert: false,
--   });
--
-- const { data: { publicUrl } } = supabase.storage
--   .from('trip-images')
--   .getPublicUrl(data.path);
--
-- // 儲存 publicUrl 到 tripsync.trips.cover_image
