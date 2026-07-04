-- ============================================================
-- ARTHENIX — MARKETPLACE REMOVAL (Supabase-side cleanup)
-- Production project-এ marketplace-tied সব table/trigger/function drop করা হচ্ছে।
-- এই script একবারই চালানো লাগবে। চালানোর আগে backup নেওয়া recommended
-- (Supabase Dashboard → Database → Backups)।
-- ============================================================

-- 1. Marketplace-tied triggers আগে drop করো (table drop করার আগে,
--    না হলে dependency error আসতে পারে)
drop trigger if exists on_order_completed on public.orders;
drop trigger if exists on_review_change on public.reviews;

-- 2. এই trigger গুলোর function ও drop করো
drop function if exists public.trg_xp_on_order_completed();
drop function if exists public.trg_update_product_rating();

-- 3. Marketplace-only RPC function — কোডে কোথাও call হয় না (verified), drop করো
drop function if exists public.search_content(text);

-- 4. এখন টেবিলগুলো drop করো (CASCADE দিয়ে, যাতে ওদের উপর নির্ভরশীল
--    foreign key/policy/index সব একসাথে চলে যায়)
drop table if exists public.wishlists cascade;
drop table if exists public.price_history cascade;
drop table if exists public.reviews cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;

-- ============================================================
-- ঐচ্ছিক (optional) — is_seller column নিয়ে
-- ============================================================
-- profiles.is_seller column টা এখনো থাকবে (কোনো ক্ষতি নেই, শুধু একটা
-- অব্যবহৃত boolean column)। যদি একদম পরিষ্কার রাখতে চাও, নিচের লাইন
-- আলাদাভাবে চালাতে পারো (এটা এই script এর অংশ না, ইচ্ছাকৃতভাবে আলাদা রাখা হলো):
--
-- alter table public.profiles drop column if exists is_seller;
--
-- ⚠️ এটা চালানোর আগে types/database.ts থেকে is_seller field-ও বাদ দিতে হবে,
-- না হলে TypeScript error আসবে। এখনই না করে, Phase 16b শেষে একসাথে করলে ভালো।