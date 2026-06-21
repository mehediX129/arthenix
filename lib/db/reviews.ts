import { createClient } from "@/lib/supabase/client";
import type { ReviewInsert, ReviewWithReviewer, DbResult } from "@/types/database";

/**
 * একটা product এর সব review fetch করে, reviewer এর তথ্য সহ।
 */
export async function getProductReviews(
  productId: string
): Promise<DbResult<ReviewWithReviewer[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*, reviewer:profiles(id, username, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as ReviewWithReviewer[], error: null };
}

/**
 * Rating breakdown বের করে (5-star bar chart এর জন্য) —
 * প্রতিটা star count কতবার দেওয়া হয়েছে।
 */
export async function getRatingBreakdown(
  productId: string
): Promise<DbResult<Record<1 | 2 | 3 | 4 | 5, number>>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);

  if (error) {
    return { data: null, error: error.message };
  }

  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  (data as { rating: number }[]).forEach((r) => {
    const rating = r.rating as 1 | 2 | 3 | 4 | 5;
    if (breakdown[rating] !== undefined) {
      breakdown[rating]++;
    }
  });

  return { data: breakdown, error: null };
}

/**
 * নতুন review submit করে। reviewer_id RLS policy অনুযায়ী
 * logged-in user এর নিজের id হতে হবে।
 * unique(product_id, reviewer_id) constraint থাকায়
 * একই ইউজার একই product এ দুইবার review দিতে পারবে না।
 */
export async function submitReview(
  data: ReviewInsert
): Promise<DbResult<ReviewWithReviewer>> {
  const supabase = createClient();

  const { data: created, error } = await supabase
    .from("reviews")
    .insert(data)
    .select("*, reviewer:profiles(id, username, avatar_url)")
    .single();

  if (error) {
    return {
      data: null,
      error:
        error.code === "23505"
          ? "তুমি ইতিমধ্যে এই প্রোডাক্টে review দিয়েছো।"
          : error.message,
    };
  }

  return { data: created as unknown as ReviewWithReviewer, error: null };
}