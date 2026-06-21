-- ============================================================
-- ARTHENIX — PHASE 5 PREP: PROFILE EXTENSIONS
-- Location + Privacy settings কলাম যোগ করা হচ্ছে profiles টেবিলে
-- ============================================================

alter table public.profiles
  add column if not exists location text,
  add column if not exists profile_visibility text not null default 'public'
    check (profile_visibility in ('public', 'private')),
  add column if not exists show_activity_feed boolean not null default true,
  add column if not exists show_purchases boolean not null default true;