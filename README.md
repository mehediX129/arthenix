# Arthenix — The Universe of Human Knowledge

Arthenix is a knowledge-sharing and community platform organized around 12
themed "worlds" (Gaming, AI, Psychology, Anime, Science, Tech, and more).
Users write and read articles, post in a community feed, follow each other,
and earn XP, levels, streaks, quests, and badges as they engage with content.

## Tech stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **State management:** Zustand

## Local setup

1. **Clone the repo and install dependencies:**

   git clone https://github.com/mehediX129/arthenix.git
   cd arthenix
   npm install

2. **Create your environment file:**

   cp .env.example .env.local

   Fill in the values from your Supabase project dashboard
   (Project Settings > API):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (server-side only, never expose this)
   - NEXT_PUBLIC_APP_URL (use http://localhost:3000 for local dev)

3. **Set up the database.** In the Supabase SQL Editor, run the migration
   files below in this exact order:

   supabase/schema.sql
   supabase/functions_triggers.sql
   supabase/profile_extensions.sql
   supabase/migrations/phase16_article_reads.sql
   supabase/migrations/phase16_streak_fix.sql
   supabase/migrations/fix_level_column_type.sql
   supabase/migrations/phase16b_profile_settings.sql
   supabase/migrations/phase16b_pronouns.sql
   supabase/migrations/phase16_auto_quest_tracking.sql

   Do not run supabase/wishlists_table.sql or
   supabase/price_history_table.sql — these belonged to a marketplace
   feature that has been permanently removed.

4. **Run the dev server:**

   npm run dev

   Open http://localhost:3000

## Project structure

app/                Next.js App Router pages
components/         Reusable UI components, grouped by feature
lib/db/             Supabase query functions (one file per table/domain)
lib/utils/          Gamification helpers (XP, levels, streaks)
store/              Zustand stores (user, search, notifications, toasts)
supabase/           SQL schema and migrations
types/database.ts   TypeScript types mirroring the Supabase schema

## Notes for contributors

- All code, comments, and UI strings are written in English.
- Every Supabase query function verifies its assumptions against the real
  database schema — column names and types are a common source of bugs
  when they drift from what the code expects.
- Gamification features (XP, quests, streaks) are driven by real user
  actions tracked server-side, not client-side manual completion.