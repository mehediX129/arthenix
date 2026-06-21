-- ============================================================
-- ARTHENIX — PHASE 3A: CORE DATABASE SCHEMA
-- Supabase (PostgreSQL) এর জন্য সম্পূর্ণ schema
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSION: UUID generation এর জন্য (Supabase এ সাধারণত already enabled)
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PROFILES — auth.users এর extended info
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  xp integer not null default 0,
  level text not null default 'Novice',
  streak_days integer not null default 0,
  last_active timestamptz default now(),
  selected_worlds text[] default '{}',
  is_seller boolean not null default false,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_profiles_username on public.profiles(username);
create index idx_profiles_xp on public.profiles(xp desc);

alter table public.profiles enable row level security;

create policy "Profiles are publicly viewable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 2. WORLDS — content category গুলো
-- ------------------------------------------------------------
create table public.worlds (
  id text primary key,
  name text not null,
  tagline text,
  color text not null,
  article_count integer not null default 0,
  is_active boolean not null default true
);

alter table public.worlds enable row level security;

create policy "Worlds are publicly viewable"
  on public.worlds for select
  using (true);

-- ------------------------------------------------------------
-- 3. ARTICLES
-- ------------------------------------------------------------
create type complexity_level as enum ('quick', 'standard', 'deep');

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null,
  excerpt text,
  cover_image text,
  world_id text references public.worlds(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  read_time_minutes integer default 5,
  complexity_level complexity_level not null default 'standard',
  views integer not null default 0,
  likes integer not null default 0,
  is_published boolean not null default false,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_articles_slug on public.articles(slug);
create index idx_articles_world_id on public.articles(world_id);
create index idx_articles_author_id on public.articles(author_id);
create index idx_articles_published on public.articles(is_published) where is_published = true;
create index idx_articles_views on public.articles(views desc);

alter table public.articles enable row level security;

create policy "Published articles are publicly viewable"
  on public.articles for select
  using (is_published = true);

create policy "Authors can view their own unpublished articles"
  on public.articles for select
  using (auth.uid() = author_id);

create policy "Authors can insert their own articles"
  on public.articles for insert
  with check (auth.uid() = author_id);

create policy "Authors can update their own articles"
  on public.articles for update
  using (auth.uid() = author_id);

create policy "Authors can delete their own articles"
  on public.articles for delete
  using (auth.uid() = author_id);

-- ------------------------------------------------------------
-- 4. PRODUCTS — marketplace items
-- ------------------------------------------------------------
create type product_category as enum ('course', 'ebook', 'asset', 'gaming', 'tool');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price decimal(10, 2) not null,
  original_price decimal(10, 2),
  category product_category not null,
  seller_id uuid references public.profiles(id) on delete cascade,
  thumbnail_url text,
  file_url text,
  sales_count integer not null default 0,
  rating_avg decimal(3, 2) not null default 0,
  rating_count integer not null default 0,
  is_active boolean not null default true,
  flash_sale_end timestamptz,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create index idx_products_seller_id on public.products(seller_id);
create index idx_products_category on public.products(category);
create index idx_products_active on public.products(is_active) where is_active = true;
create index idx_products_sales on public.products(sales_count desc);

alter table public.products enable row level security;

create policy "Active products are publicly viewable"
  on public.products for select
  using (is_active = true);

create policy "Sellers can view their own inactive products"
  on public.products for select
  using (auth.uid() = seller_id);

create policy "Sellers can insert their own products"
  on public.products for insert
  with check (auth.uid() = seller_id);

create policy "Sellers can update their own products"
  on public.products for update
  using (auth.uid() = seller_id);

create policy "Sellers can delete their own products"
  on public.products for delete
  using (auth.uid() = seller_id);

-- ------------------------------------------------------------
-- 5. ORDERS
-- ------------------------------------------------------------
create type order_status as enum ('pending', 'completed', 'refunded');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  amount_paid decimal(10, 2) not null,
  stripe_payment_id text,
  status order_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_orders_buyer_id on public.orders(buyer_id);
create index idx_orders_product_id on public.orders(product_id);
create index idx_orders_status on public.orders(status);

alter table public.orders enable row level security;

create policy "Buyers can view their own orders"
  on public.orders for select
  using (auth.uid() = buyer_id);

create policy "Sellers can view orders for their products"
  on public.orders for select
  using (
    auth.uid() in (
      select seller_id from public.products where id = product_id
    )
  );

create policy "Buyers can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = buyer_id);

-- ------------------------------------------------------------
-- 6. REVIEWS
-- ------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  helpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, reviewer_id)
);

create index idx_reviews_product_id on public.reviews(product_id);
create index idx_reviews_reviewer_id on public.reviews(reviewer_id);

alter table public.reviews enable row level security;

create policy "Reviews are publicly viewable"
  on public.reviews for select
  using (true);

create policy "Users can insert their own reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "Users can update their own reviews"
  on public.reviews for update
  using (auth.uid() = reviewer_id);

create policy "Users can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = reviewer_id);

-- ------------------------------------------------------------
-- 7. BADGES
-- ------------------------------------------------------------
create type badge_tier as enum ('common', 'rare', 'epic', 'legendary');

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  tier badge_tier not null default 'common',
  condition_type text not null,
  condition_value integer not null
);

alter table public.badges enable row level security;

create policy "Badges are publicly viewable"
  on public.badges for select
  using (true);

-- ------------------------------------------------------------
-- 8. USER_BADGES — junction table
-- ------------------------------------------------------------
create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index idx_user_badges_user_id on public.user_badges(user_id);

alter table public.user_badges enable row level security;

create policy "User badges are publicly viewable"
  on public.user_badges for select
  using (true);

create policy "System can insert user badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 9. BOOKMARKS
-- ------------------------------------------------------------
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create index idx_bookmarks_user_id on public.bookmarks(user_id);
create index idx_bookmarks_article_id on public.bookmarks(article_id);

alter table public.bookmarks enable row level security;

create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 10. COMMENTS — supports replies via parent_id
-- ------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  likes integer not null default 0,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_comments_article_id on public.comments(article_id);
create index idx_comments_author_id on public.comments(author_id);
create index idx_comments_parent_id on public.comments(parent_id);

alter table public.comments enable row level security;

create policy "Comments are publicly viewable"
  on public.comments for select
  using (true);

create policy "Users can insert their own comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = author_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- ============================================================
-- SEED: worlds table এ Phase 1 এর ১২টা world data insert
-- (lib/worlds-data.ts এর সাথে মিলিয়ে)
-- ============================================================
insert into public.worlds (id, name, tagline, color, article_count, is_active) values
  ('gaming', 'Gaming Nexus', 'Every game. Every meta. Every legend.', '#7C3AED', 0, true),
  ('intelligence', 'Intelligence Lab', 'Train your mind like a weapon.', '#06B6D4', 0, true),
  ('psychology', 'Psychology Vault', 'Understand humans. Starting with yourself.', '#EC4899', 0, true),
  ('anime', 'Anime Dimension', 'From Ghibli to God-tier. All of it.', '#F59E0B', 0, true),
  ('science', 'Science Reactor', 'Reality is stranger than fiction.', '#10B981', 0, true),
  ('tech', 'Tech Underground', 'Build. Break. Repeat.', '#3B82F6', 0, true),
  ('math', 'Math Realm', 'Math is the language the universe speaks.', '#8B5CF6', 0, true),
  ('inventions', 'Inventions Archive', 'Ideas that changed everything.', '#F97316', 0, true),
  ('novels', 'Novel Universe', 'Stories that rewired civilization.', '#D97706', 0, true),
  ('marketplace', 'Marketplace Hub', 'Buy smart. Sell sharp. Win always.', '#06B6D4', 0, true),
  ('services', 'Services Grid', 'Skills meet opportunity.', '#14B8A6', 0, true),
  ('culture', 'Culture Feed', 'Trends, vibes, and the zeitgeist.', '#EC4899', 0, true)
on conflict (id) do nothing;