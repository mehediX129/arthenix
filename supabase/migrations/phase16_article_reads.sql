-- ------------------------------------------------------------
-- PHASE 16 — Per-user article read tracking
-- Tracks which articles a user has actually opened/read, powering
-- the real "Articles Read" stat on the profile page (previously
-- hardcoded to 0).
-- ------------------------------------------------------------

create table if not exists public.article_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create index if not exists idx_article_reads_user_id on public.article_reads(user_id);

alter table public.article_reads enable row level security;

drop policy if exists "Users can view their own article reads" on public.article_reads;
create policy "Users can view their own article reads"
  on public.article_reads for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own article reads" on public.article_reads;
create policy "Users can insert their own article reads"
  on public.article_reads for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- record_article_read — একটা article প্রথমবার পড়লে row insert করে।
-- একই user একই article আবার পড়লে unique constraint-এর কারণে
-- conflict হয়, সেটা চুপচাপ ignore করা হয় (do nothing) — তাই বারবার
-- visit করলেও count ডুপ্লিকেট হবে না। p_user_id explicit parameter
-- হিসেবে নেওয়া হয়েছে, কারণ RPC-এর ভেতরে auth.uid() null হয়ে যায়
-- (project rule অনুযায়ী)।
-- ------------------------------------------------------------
drop function if exists public.record_article_read(uuid, uuid);

create or replace function public.record_article_read(
  p_user_id uuid,
  p_article_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_inserted boolean;
begin
  insert into public.article_reads (user_id, article_id)
  values (p_user_id, p_article_id)
  on conflict (user_id, article_id) do nothing;

  v_inserted := found;
  return v_inserted;
end;
$$;

grant execute on function public.record_article_read(uuid, uuid) to authenticated;