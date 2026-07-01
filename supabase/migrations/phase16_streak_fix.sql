-- ------------------------------------------------------------
-- PHASE 16 — Streak system real fix
-- 1. profiles টেবিলে missing columns যোগ করা
-- 2. streak_freezes টেবিল তৈরি করা
-- 3. update_streak RPC যোগ করা
-- ------------------------------------------------------------

-- profiles-এ missing columns যোগ করা (already থাকলে safe)
alter table public.profiles
  add column if not exists last_active_date date default null,
  add column if not exists freeze_count integer not null default 2;

-- streak_freezes টেবিল
create table if not exists public.streak_freezes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  used_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, used_on)
);

create index if not exists idx_streak_freezes_user_id on public.streak_freezes(user_id);

alter table public.streak_freezes enable row level security;

drop policy if exists "Users can manage their own streak freezes" on public.streak_freezes;
create policy "Users can manage their own streak freezes"
  on public.streak_freezes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- update_streak RPC — atomically streak update করে
drop function if exists public.update_streak(uuid);

create or replace function public.update_streak(p_user_id uuid)
returns table (
  streak_days integer,
  is_new_day boolean,
  used_freeze boolean
)
language plpgsql
security definer
as $$
declare
  v_today date := current_date;
  v_yesterday date := current_date - interval '1 day';
  v_last_active date;
  v_current_streak integer;
  v_freeze_count integer;
  v_new_streak integer;
  v_is_new_day boolean := false;
  v_used_freeze boolean := false;
  v_freeze record;
begin
  select last_active_date, streak_days, freeze_count
  into v_last_active, v_current_streak, v_freeze_count
  from public.profiles
  where id = p_user_id
  for update;

  -- আজকে already active ছিল — কিছু করার নেই
  if v_last_active = v_today then
    return query select v_current_streak, false, false;
    return;
  end if;

  v_is_new_day := true;
  v_new_streak := v_current_streak;

  if v_last_active = v_yesterday then
    -- Consecutive day — streak বাড়ে
    v_new_streak := v_current_streak + 1;

  elsif v_last_active is not null then
    -- একদিনের বেশি miss হয়েছে — freeze আছে কিনা চেক
    select * into v_freeze
    from public.streak_freezes
    where user_id = p_user_id
      and used_on = v_yesterday
    limit 1;

    if v_freeze.id is not null then
      -- Freeze ব্যবহার হয়েছিল — streak চলে
      v_new_streak := v_current_streak + 1;
      v_used_freeze := true;
    else
      -- Reset
      v_new_streak := 1;
    end if;

  else
    -- প্রথমবার
    v_new_streak := 1;
  end if;

  update public.profiles
  set
    streak_days = v_new_streak,
    last_active_date = v_today,
    last_active = now()
  where id = p_user_id;

  return query select v_new_streak, v_is_new_day, v_used_freeze;
end;
$$;

grant execute on function public.update_streak(uuid) to authenticated;