import { createClient } from "@/lib/supabase/client";
import type {
  Article,
  ArticleInsert,
  ArticleWithRelations,
  PaginatedResult,
  DbResult,
} from "@/types/database";

const ARTICLE_RELATIONS_SELECT =
  "*, author:profiles(id, username, display_name, avatar_url), world:worlds(id, name, color)";

/**
 * Slug দিয়ে একটা সম্পূর্ণ article fetch করে, author + world এর তথ্য সহ।
 * Article detail page এর জন্য মূল ফাংশন।
 */
export async function getArticleBySlug(
  slug: string
): Promise<DbResult<ArticleWithRelations>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_RELATIONS_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as ArticleWithRelations, error: null };
}

/**
 * একটা নির্দিষ্ট world এর published article গুলো pagination সহ fetch করে।
 * Worlds page (Phase 6) এ ব্যবহার হবে।
 */
export async function getArticlesByWorld(
  worldId: string,
  page: number = 1,
  limit: number = 12
): Promise<DbResult<PaginatedResult<ArticleWithRelations>>> {
  const supabase = createClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("articles")
    .select(ARTICLE_RELATIONS_SELECT, { count: "exact" })
    .eq("world_id", worldId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return { data: null, error: error.message };
  }

  const totalCount = count ?? 0;

  return {
    data: {
      data: data as unknown as ArticleWithRelations[],
      count: totalCount,
      page,
      pageSize: limit,
      hasMore: from + limit < totalCount,
    },
    error: null,
  };
}

/**
 * Trending articles fetch করে (Phase 3B এর get_trending_articles SQL function কল করে)।
 * worldId না দিলে সব world মিলিয়ে trending দেখাবে।
 */
export async function getTrendingArticles(
  worldId?: string,
  limit: number = 10
): Promise<DbResult<Article[]>> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_trending_articles", {
    p_world_id: worldId ?? null,
    p_limit: limit,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Article[], error: null };
}

/**
 * নতুন article তৈরি করে। author_id RLS policy অনুযায়ী
 * logged-in user এর নিজের id হতে হবে।
 */
export async function createArticle(
  data: ArticleInsert
): Promise<DbResult<Article>> {
  const supabase = createClient();

  const { data: created, error } = await supabase
    .from("articles")
    .insert(data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: created as Article, error: null };
}

/**
 * Article view count বাড়ায়। Article page mount হওয়ার সময় কল হবে।
 *
 * এখানেই +10 XP logic (Phase 3 ডকুমেন্টে চাওয়া হয়েছিল) app-level এ handle করা হচ্ছে,
 * কারণ database trigger লেভেলে "কে দেখলো" সেই তথ্য available না।
 * শুধুমাত্র logged-in viewer XP পাবে, এবং একই ইউজার বারবার XP পাবে না
 * তা নিশ্চিত করার দায়িত্ব caller (component) এর — যেমন session/local state দিয়ে
 * একবারই কল করা নিশ্চিত করতে হবে।
 */
export async function incrementViews(
  articleId: string,
  viewerId?: string
): Promise<DbResult<null>> {
  const supabase = createClient();

  const { error: viewError } = await supabase.rpc("increment_article_views", {
    p_article_id: articleId,
  });

  if (viewError) {
    return { data: null, error: viewError.message };
  }

  // Logged-in viewer থাকলে তাকে +10 XP দাও
  if (viewerId) {
    await supabase.rpc("award_xp", { p_user_id: viewerId, p_amount: 10 });
  }

  return { data: null, error: null };
}