-- ============================================================
-- ARTHENIX — ARTICLE CONTENT IMAGES (inline body images)
-- article-covers bucket-এর জন্য RLS policy সেট করা হচ্ছে।
--
-- এই bucket-টা আগে Supabase Dashboard থেকে ম্যানুয়ালি বানানো
-- হয়েছিল বলে এতদিন কোনো migration ফাইলে ট্র্যাক করা ছিল না,
-- এবং এর RLS policy ঠিক কী ছিল সেটাও অজানা। এই migration
-- bucket-টা (যদি না থাকে) তৈরি করে এবং policy-গুলো idempotent
-- ভাবে re-apply করে, যাতে এখন থেকে কোড আর DB state sync-এ থাকে।
--
-- Path convention (ইতিমধ্যে app/write/page.tsx-এ ব্যবহৃত):
--   covers/{user_id}/{timestamp}.{ext}   — article cover image
--   content/{user_id}/{timestamp}.{ext}  — article-এর ভিতরের inline image
-- দুই ক্ষেত্রেই user_id হলো path-এর ২য় segment, তাই একটাই
-- policy দুটো ব্যবহারই কভার করে।
-- ============================================================

-- 1. Bucket তৈরি করা হচ্ছে যদি আগে থেকে না থাকে (public read)
insert into storage.buckets (id, name, public)
values ('article-covers', 'article-covers', true)
on conflict (id) do nothing;

-- 2. Public read — সবাই article-এর ছবি দেখতে পারবে
drop policy if exists "Article images are publicly accessible" on storage.objects;
create policy "Article images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'article-covers');

-- 3. Insert — শুধু নিজের user_id ফোল্ডারে আপলোড করতে পারবে
drop policy if exists "Users can upload their own article images" on storage.objects;
create policy "Users can upload their own article images"
  on storage.objects for insert
  with check (
    bucket_id = 'article-covers'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- 4. Update — শুধু নিজের ছবি replace করতে পারবে (upsert)
drop policy if exists "Users can update their own article images" on storage.objects;
create policy "Users can update their own article images"
  on storage.objects for update
  using (
    bucket_id = 'article-covers'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- 5. Delete — শুধু নিজের ছবি delete করতে পারবে
drop policy if exists "Users can delete their own article images" on storage.objects;
create policy "Users can delete their own article images"
  on storage.objects for delete
  using (
    bucket_id = 'article-covers'
    and auth.uid()::text = (storage.foldername(name))[2]
  );