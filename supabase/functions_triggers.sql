-- ============================================================
-- ARTHENIX — PHASE 3B: FUNCTIONS & TRIGGERS
-- ============================================================

-- ------------------------------------------------------------
-- HELPER FUNCTION: XP থেকে Level calculate করে
-- (lib/utils/gamification.ts এর LEVEL_TIERS এর সাথে মিলিয়ে)
-- ------------------------------------------------------------
create or replace function public.calculate_level(p_xp integer)
returns text
language plpgsql
immutable
as $$
begin
  if p_xp >= 50000 then return 'Legend';
  elsif p_xp >= 15000 then return 'Mastermind';
  elsif p_xp >= 5000 then return 'Architect';
  elsif p_xp >= 2000 then return 'Scholar';
  elsif p_xp >= 500 then return 'Explorer';
  else return 'Novice';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- HELPER FUNCTION: একটা profile কে XP দেয় এবং level recalculate করে
-- (সব XP trigger এই একটা central function ব্যবহার করবে, duplicate logic এড়াতে)
-- ------------------------------------------------------------
create or replace function public.award_xp(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_xp integer;
begin
  update public.profiles
  set xp = xp + p_amount
  where id = p_user_id
  returning xp into v_new_xp;

  if v_new_xp is not null then
    update public.profiles
    set level = public.calculate_level(v_new_xp)
    where id = p_user_id;
  end if;
end;
$$;

-- ============================================================
-- TRIGGER 1A — COMMENT INSERT হলে author কে +5 XP
-- ============================================================
create or replace function public.trg_xp_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_xp(new.author_id, 5);
  return new;
end;
$$;

create trigger on_comment_insert
  after insert on public.comments
  for each row
  execute function public.trg_xp_on_comment();

-- ============================================================
-- TRIGGER 1B — ORDER status 'completed' এ পরিবর্তন হলে
-- buyer কে +20 XP, seller কে +50 XP, এবং product এর sales_count +1
-- ============================================================
create or replace function public.trg_xp_on_order_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
begin
  -- শুধু তখনই চলবে যখন status নতুনভাবে 'completed' হয়
  -- (insert এ সরাসরি completed হলে, অথবা update এ pending->completed হলে)
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then

    if new.buyer_id is not null then
      perform public.award_xp(new.buyer_id, 20);
    end if;

    select seller_id into v_seller_id
    from public.products
    where id = new.product_id;

    if v_seller_id is not null then
      perform public.award_xp(v_seller_id, 50);

      update public.products
      set sales_count = sales_count + 1
      where id = new.product_id;
    end if;

  end if;

  return new;
end;
$$;

create trigger on_order_completed
  after insert or update on public.orders
  for each row
  execute function public.trg_xp_on_order_completed();

-- ============================================================
-- TRIGGER 2 — STREAK UPDATER + DAILY LOGIN XP
-- profiles.last_active manually update করলে (login এর সময়) এই trigger চলবে।
-- ============================================================
create or replace function public.trg_update_streak()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hours_gap numeric;
begin
  -- শুধু তখনই চলবে যখন last_active সত্যিই পরিবর্তন হয়েছে (loop প্রতিরোধে)
  if new.last_active is distinct from old.last_active then

    v_hours_gap := extract(epoch from (new.last_active - old.last_active)) / 3600;

    if v_hours_gap > 24 then
      -- 24 ঘণ্টার বেশি gap হলে streak reset
      new.streak_days := 0;
    elsif date(new.last_active) <> date(old.last_active) then
      -- নতুন দিনে প্রথম login হলে streak +1 এবং daily XP +2
      new.streak_days := old.streak_days + 1;
      perform public.award_xp(new.id, 2);
    end if;

  end if;

  return new;
end;
$$;

create trigger on_profile_last_active_update
  before update on public.profiles
  for each row
  execute function public.trg_update_streak();

-- ============================================================
-- TRIGGER 3 — ARTICLE PUBLISH হলে worlds.article_count +1
-- ============================================================
create or replace function public.trg_increment_world_article_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- নতুন article সরাসরি published অবস্থায় insert হলে,
  -- অথবা existing article draft থেকে published এ পরিবর্তন হলে
  if new.is_published = true and (tg_op = 'INSERT' or old.is_published = false) then
    update public.worlds
    set article_count = article_count + 1
    where id = new.world_id;
  end if;

  -- Published article unpublish হলে count কমে যাবে
  if tg_op = 'UPDATE' and old.is_published = true and new.is_published = false then
    update public.worlds
    set article_count = greatest(article_count - 1, 0)
    where id = new.world_id;
  end if;

  return new;
end;
$$;

create trigger on_article_publish_change
  after insert or update on public.articles
  for each row
  execute function public.trg_increment_world_article_count();

-- ============================================================
-- TRIGGER 4 — REVIEW INSERT/UPDATE/DELETE হলে
-- products.rating_avg এবং rating_count recalculate
-- ============================================================
create or replace function public.trg_update_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
  v_avg decimal(3, 2);
  v_count integer;
begin
  v_product_id := coalesce(new.product_id, old.product_id);

  select
    coalesce(round(avg(rating)::numeric, 2), 0),
    count(*)
  into v_avg, v_count
  from public.reviews
  where product_id = v_product_id;

  update public.products
  set rating_avg = v_avg,
      rating_count = v_count
  where id = v_product_id;

  return coalesce(new, old);
end;
$$;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row
  execute function public.trg_update_product_rating();

-- ============================================================
-- FUNCTION 1 — get_trending_articles(world_id, limit)
-- Last 24h এ সবচেয়ে বেশি view পাওয়া articles
-- world_id NULL দিলে সব world মিলিয়ে trending দেখাবে
-- ============================================================
create or replace function public.get_trending_articles(
  p_world_id text default null,
  p_limit integer default 10
)
returns setof public.articles
language sql
stable
as $$
  select *
  from public.articles
  where is_published = true
    and (p_world_id is null or world_id = p_world_id)
    and created_at >= now() - interval '24 hours'
  order by views desc
  limit p_limit;
$$;

-- ============================================================
-- FUNCTION 2 — get_user_world_affinity(user_id)
-- User কোন world এ কতটা engaged (bookmark + article count মিলিয়ে স্কোর)
-- ============================================================
create or replace function public.get_user_world_affinity(p_user_id uuid)
returns table (
  world_id text,
  world_name text,
  bookmark_count bigint,
  affinity_score bigint
)
language sql
stable
as $$
  select
    w.id as world_id,
    w.name as world_name,
    count(b.id) as bookmark_count,
    count(b.id) * 10 as affinity_score
  from public.worlds w
  left join public.articles a on a.world_id = w.id
  left join public.bookmarks b
    on b.article_id = a.id and b.user_id = p_user_id
  group by w.id, w.name
  having count(b.id) > 0
  order by affinity_score desc;
$$;

-- ============================================================
-- FUNCTION 3 — search_content(query)
-- Articles + Products এর মধ্যে full-text search
-- ============================================================
create or replace function public.search_content(p_query text)
returns table (
  result_type text,
  id uuid,
  title text,
  description text,
  thumbnail text,
  rank real
)
language sql
stable
as $$
  select
    'article'::text as result_type,
    a.id,
    a.title,
    a.excerpt as description,
    a.cover_image as thumbnail,
    ts_rank(
      to_tsvector('english', a.title || ' ' || coalesce(a.excerpt, '')),
      plainto_tsquery('english', p_query)
    ) as rank
  from public.articles a
  where a.is_published = true
    and to_tsvector('english', a.title || ' ' || coalesce(a.excerpt, ''))
        @@ plainto_tsquery('english', p_query)

  union all

  select
    'product'::text as result_type,
    p.id,
    p.title,
    p.description,
    p.thumbnail_url as thumbnail,
    ts_rank(
      to_tsvector('english', p.title || ' ' || coalesce(p.description, '')),
      plainto_tsquery('english', p_query)
    ) as rank
  from public.products p
  where p.is_active = true
    and to_tsvector('english', p.title || ' ' || coalesce(p.description, ''))
        @@ plainto_tsquery('english', p_query)

  order by rank desc
  limit 30;
$$;
-- ============================================================
-- FUNCTION (অতিরিক্ত) — increment_article_views(article_id)
-- Article view atomically বাড়ায়, race condition এড়াতে।
-- lib/db/articles.ts এর incrementViews() এই function কল করে।
-- ============================================================
create or replace function public.increment_article_views(p_article_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.articles
  set views = views + 1
  where id = p_article_id;
end;
$$;