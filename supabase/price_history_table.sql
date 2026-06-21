-- ============================================================
-- ARTHENIX — PHASE 4C PREP: PRICE HISTORY TABLE + TRIGGER
-- Product price change হলে automatically log হবে,
-- যাতে আসল "Price History" chart এবং
-- "Lowest price in 30 days" badge দেখানো যায়।
-- ============================================================

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  price decimal(10, 2) not null,
  recorded_at timestamptz not null default now()
);

create index idx_price_history_product_id on public.price_history(product_id);
create index idx_price_history_recorded_at on public.price_history(recorded_at desc);

alter table public.price_history enable row level security;

create policy "Price history is publicly viewable"
  on public.price_history for select
  using (true);

-- ------------------------------------------------------------
-- TRIGGER — নতুন product তৈরি হলে initial price log করে,
-- এবং price পরিবর্তন হলে নতুন entry যোগ করে।
-- ------------------------------------------------------------
create or replace function public.trg_log_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.price_history (product_id, price)
    values (new.id, new.price);
  elsif tg_op = 'UPDATE' and old.price is distinct from new.price then
    insert into public.price_history (product_id, price)
    values (new.id, new.price);
  end if;

  return new;
end;
$$;

create trigger on_product_price_change
  after insert or update on public.products
  for each row
  execute function public.trg_log_price_change();

-- ------------------------------------------------------------
-- FUNCTION — গত ৩০ দিনের সর্বনিম্ন দাম বের করে,
-- "Lowest price in 30 days" badge দেখানোর জন্য।
-- ------------------------------------------------------------
create or replace function public.get_lowest_price_30d(p_product_id uuid)
returns decimal
language sql
stable
as $$
  select min(price)
  from public.price_history
  where product_id = p_product_id
    and recorded_at >= now() - interval '30 days';
$$;