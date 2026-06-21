-- ============================================================
-- ARTHENIX — PHASE 4 PREP: WISHLISTS TABLE
-- Product wishlist এর জন্য আলাদা টেবিল (bookmarks থেকে পৃথক,
-- কারণ bookmarks শুধু articles এর জন্য ব্যবহৃত হয়)।
-- ============================================================

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index idx_wishlists_user_id on public.wishlists(user_id);
create index idx_wishlists_product_id on public.wishlists(product_id);

alter table public.wishlists enable row level security;

create policy "Users can view their own wishlist"
  on public.wishlists for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own wishlist"
  on public.wishlists for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own wishlist"
  on public.wishlists for delete
  using (auth.uid() = user_id);