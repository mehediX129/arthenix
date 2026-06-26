import { createClient } from "@/lib/supabase/client";

export interface SearchResultArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  world_id: string;
  published_at: string | null;
  view_count: number;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface SearchResultProduct {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  cover_image: string | null;
  category: string;
  world_id: string;
  seller: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface SearchResultUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: string;
  xp: number;
}

export interface SearchResults {
  articles: SearchResultArticle[];
  products: SearchResultProduct[];
  users: SearchResultUser[];
}

export async function globalSearch(query: string): Promise<{
  data: SearchResults | null;
  error: string | null;
}> {
  if (!query.trim() || query.trim().length < 2) {
    return { data: { articles: [], products: [], users: [] }, error: null };
  }

  const supabase = createClient();
  const q = query.trim();

  const [articlesRes, productsRes, usersRes] = await Promise.all([
    supabase
      .from("articles")
      .select(
        "id, title, slug, excerpt, cover_image, world_id, published_at, view_count, author:profiles!articles_author_id_fkey(id, username, display_name, avatar_url)"
      )
      .eq("is_published", true)
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .order("view_count", { ascending: false })
      .limit(5),

    supabase
      .from("products")
      .select(
        "id, title, slug, description, price, cover_image, category, world_id, seller:profiles!products_seller_id_fkey(id, username, display_name, avatar_url)"
      )
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, level, xp")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%,bio.ilike.%${q}%`)
      .limit(4),
  ]);

  if (articlesRes.error || productsRes.error || usersRes.error) {
    return {
      data: null,
      error:
        articlesRes.error?.message ??
        productsRes.error?.message ??
        usersRes.error?.message ??
        "Search failed",
    };
  }

  return {
    data: {
      articles: (articlesRes.data ?? []) as unknown as SearchResultArticle[],
      products: (productsRes.data ?? []) as unknown as SearchResultProduct[],
      users: (usersRes.data ?? []) as unknown as SearchResultUser[],
    },
    error: null,
  };
}