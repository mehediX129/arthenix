-- ============================================================
-- ARTHENIX — AUTOMATED DAILY QUEST TRACKING
-- এখন থেকে quest progress সত্যিকারের user action (like, read,
-- publish, world visit) থেকে automatically calculate হবে —
-- কোনো manual "click to complete" বাটন লাগবে না।
-- ============================================================

-- ------------------------------------------------------------
-- 1. "Critic" quest deactivate করা হচ্ছে — এটার action_type
--    (submit_review) reviews table এর উপর নির্ভরশীল ছিল, যেটা
--    marketplace removal এর সময় drop করা হয়েছে। এই quest আর
--    কখনো complete করা সম্ভব না, তাই নতুন করে assign হওয়া বন্ধ।
-- ------------------------------------------------------------
update public.quests
set is_active = false
where action_type = 'submit_review';

-- ------------------------------------------------------------
-- 2. world_visits — প্রতিদিন কে কোন world visit করলো তার log।
--    "visit_world" quest এর real progress track করার জন্য।
-- ------------------------------------------------------------
create table if not exists public.world_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  world_id text not null,
  visited_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, world_id, visited_date)
);

create index if not exists idx_world_visits_user_date
  on public.world_visits(user_id, visited_date);

alter table public.world_visits enable row level security;

drop policy if exists "Users can view their own world visits" on public.world_visits;
create policy "Users can view their own world visits"
  on public.world_visits for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own world visits" on public.world_visits;
create policy "Users can insert their own world visits"
  on public.world_visits for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3. record_world_visit — world page এ ঢুকলে call হবে।
--    একই user একই world একই দিনে বারবার visit করলেও unique
--    constraint এর কারণে duplicate row হবে না।
-- ------------------------------------------------------------
create or replace function public.record_world_visit(
  p_user_id uuid,
  p_world_id text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.world_visits (user_id, world_id, visited_date)
  values (p_user_id, p_world_id, current_date)
  on conflict (user_id, world_id, visited_date) do nothing;
end;
$$;

grant execute on function public.record_world_visit(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 4. recalculate_daily_quest_progress — মূল automation function।
--    আজকের assigned quest গুলোর জন্য real action count বের করে
--    progress আপডেট করে, target পূর্ণ হলে নিজে থেকেই completed=true
--    করে দেয় এবং award_xp() কল করে XP দিয়ে দেয় (ঠিক একবারই — আগে
--    থেকে completed থাকলে আবার XP দেবে না)। যেসব quest নতুন করে
--    complete হলো তাদের তালিকা রিটার্ন করে, যাতে frontend toast/
--    celebration দেখাতে পারে।
-- ------------------------------------------------------------
create or replace function public.recalculate_daily_quest_progress(p_user_id uuid)
returns table (
  user_quest_id uuid,
  quest_title text,
  quest_icon text,
  xp_reward integer,
  new_total_xp integer,
  new_level text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_count integer;
  v_profile record;
begin
  for v_row in
    select uq.id, uq.completed, uq.quest_id, q.action_type, q.target_count,
           q.title, q.icon, q.xp_reward
    from public.user_quests uq
    join public.quests q on q.id = uq.quest_id
    where uq.user_id = p_user_id
      and uq.assigned_date = current_date
      and uq.completed = false
  loop
    v_count := 0;

    if v_row.action_type = 'like_article' then
      select count(*) into v_count
      from public.article_likes
      where user_id = p_user_id
        and created_at::date = current_date;

    elsif v_row.action_type = 'read_article' then
      select count(*) into v_count
      from public.article_reads
      where user_id = p_user_id
        and read_at::date = current_date;

    elsif v_row.action_type = 'publish_article' then
      select count(*) into v_count
      from public.articles
      where author_id = p_user_id
        and published_at::date = current_date;

    elsif v_row.action_type = 'visit_world' then
      select count(distinct world_id) into v_count
      from public.world_visits
      where user_id = p_user_id
        and visited_date = current_date;

    else
      -- অচেনা/broken action_type (যেমন submit_review) — progress 0 থাকবে,
      -- কখনো auto-complete হবে না।
      v_count := 0;
    end if;

    update public.user_quests
    set progress = v_count
    where id = v_row.id;

    if v_count >= v_row.target_count then
      update public.user_quests
      set completed = true,
          completed_at = now(),
          progress = v_row.target_count
      where id = v_row.id;

      perform public.award_xp(p_user_id, v_row.xp_reward);

      select xp, level into v_profile from public.profiles where id = p_user_id;

      user_quest_id := v_row.id;
      quest_title := v_row.title;
      quest_icon := v_row.icon;
      xp_reward := v_row.xp_reward;
      new_total_xp := v_profile.xp;
      new_level := v_profile.level;
      return next;
    end if;
  end loop;
end;
$$;

grant execute on function public.recalculate_daily_quest_progress(uuid) to authenticated;