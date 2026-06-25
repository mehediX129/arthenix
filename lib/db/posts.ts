import { createClient } from "@/lib/supabase/client";
import type { Post, PostWithAuthor, PostComment, PostCommentWithAuthor } from "@/types/database";

// Get all posts (with optional world filter)
export async function getPosts(worldId?: string, limit = 20): Promise<{
  data: PostWithAuthor[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  let query = supabase
    .from("posts")
    .select("*, author:profiles(id, username, display_name, avatar_url, level)")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (worldId) query = query.eq("world_id", worldId);

  const { data, error } = await query;
  return { data: data as PostWithAuthor[], error: error?.message ?? null };
}

// Get single post
export async function getPostById(postId: string): Promise<{
  data: PostWithAuthor | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, author:profiles(id, username, display_name, avatar_url, level)")
    .eq("id", postId)
    .single();

  return { data: data as PostWithAuthor, error: error?.message ?? null };
}

// Create post
export async function createPost(payload: {
  author_id: string;
  title: string;
  content: string;
  world_id?: string;
}): Promise<{ data: Post | null; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .insert(payload)
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

// Delete post
export async function deletePost(postId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  return { error: error?.message ?? null };
}

// Toggle like
export async function togglePostLike(postId: string, userId: string): Promise<{
  liked: boolean;
  error: string | null;
}> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_likes").delete().eq("id", existing.id);
    await supabase.rpc("decrement_post_likes", { p_post_id: postId });
    return { liked: false, error: null };
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    await supabase.rpc("increment_post_likes", { p_post_id: postId });
    return { liked: true, error: null };
  }
}

// Check if user liked a post
export async function checkPostLike(postId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

// Get comments for a post
export async function getPostComments(postId: string): Promise<{
  data: PostCommentWithAuthor[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("post_comments")
    .select("*, author:profiles(id, username, display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  return { data: data as PostCommentWithAuthor[], error: error?.message ?? null };
}

// Add comment
export async function addPostComment(payload: {
  post_id: string;
  author_id: string;
  content: string;
}): Promise<{ data: PostComment | null; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("post_comments")
    .insert(payload)
    .select()
    .single();

  if (!error) {
    await supabase.rpc("increment_post_comments", { p_post_id: payload.post_id });
  }

  return { data, error: error?.message ?? null };
}

// Delete comment
export async function deletePostComment(commentId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
  return { error: error?.message ?? null };
}