import { createClient } from "@/lib/supabase/client";
import type { Article, ArticleWithAuthor, ArticleInsert, ArticleUpdate } from "@/types/database";

// Get published articles by world
export async function getArticlesByWorld(worldId: string, limit = 20): Promise<{
  data: ArticleWithAuthor[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*, author:profiles(id, username, display_name, avatar_url, level)")
    .eq("world_id", worldId)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  return { data: data as ArticleWithAuthor[], error: error?.message ?? null };
}

// Get single article by slug
export async function getArticleBySlug(slug: string): Promise<{
  data: ArticleWithAuthor | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*, author:profiles(id, username, display_name, avatar_url, level)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  return { data: data as ArticleWithAuthor, error: error?.message ?? null };
}

// Get user's own articles (drafts + published)
export async function getMyArticles(userId: string): Promise<{
  data: Article[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  return { data, error: error?.message ?? null };
}

// Create new article (draft)
export async function createArticle(payload: ArticleInsert): Promise<{
  data: Article | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .insert(payload)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

// Update article
export async function updateArticle(id: string, payload: ArticleUpdate): Promise<{
  data: Article | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

// Publish article
export async function publishArticle(id: string): Promise<{
  error: string | null;
}> {
  const supabase = createClient();

  const { error } = await supabase
    .from("articles")
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", id);

  return { error: error?.message ?? null };
}

// Delete article
export async function deleteArticle(id: string): Promise<{
  error: string | null;
}> {
  const supabase = createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  return { error: error?.message ?? null };
}

// Increment view count
export async function incrementArticleView(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.rpc("increment_article_views", { p_article_id: id });
}

// Like / Unlike article
export async function toggleArticleLike(articleId: string, userId: string): Promise<{
  liked: boolean;
  error: string | null;
}> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("article_likes")
    .select("id")
    .eq("article_id", articleId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("article_likes").delete().eq("id", existing.id);
    await supabase
      .from("articles")
      .update({ likes: supabase.rpc("decrement", { x: 1 }) })
      .eq("id", articleId);
    return { liked: false, error: null };
  } else {
    await supabase.from("article_likes").insert({ article_id: articleId, user_id: userId });
    await supabase.rpc("increment_article_likes", { p_article_id: articleId });
    return { liked: true, error: null };
  }
}

// Check if user liked an article
export async function checkArticleLike(articleId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from("article_likes")
    .select("id")
    .eq("article_id", articleId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

// Get recent articles across all worlds
export async function getRecentArticles(limit = 10): Promise<{
  data: ArticleWithAuthor[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*, author:profiles(id, username, display_name, avatar_url, level)")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  return { data: data as ArticleWithAuthor[], error: error?.message ?? null };
}