import { createClient } from "@/lib/supabase/client";
import type { DbResult } from "@/types/database";

export type ActivityType = "comment" | "purchase" | "review";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  createdAt: string;
}

/**
 * Fetches a user's recent activity across comments, orders, and reviews.
 * Merges three separate queries client-side since there is no
 * unified activity log table in the schema.
 */
export async function getUserActivity(
  userId: string,
  limit: number = 20
): Promise<DbResult<ActivityItem[]>> {
  const supabase = createClient();

  const [commentsResult, ordersResult, reviewsResult] = await Promise.all([
    supabase
      .from("comments")
      .select("id, content, created_at, article:articles(title)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("orders")
      .select("id, created_at, status, product:products(title)")
      .eq("buyer_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("reviews")
      .select("id, created_at, product:products(title)")
      .eq("reviewer_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [];

  if (commentsResult.data) {
    for (const c of commentsResult.data as unknown as {
      id: string;
      content: string;
      created_at: string;
      article: { title: string } | null;
    }[]) {
      items.push({
        id: `comment-${c.id}`,
        type: "comment",
        title: c.article?.title ?? "an article",
        createdAt: c.created_at,
      });
    }
  }

  if (ordersResult.data) {
    for (const o of ordersResult.data as unknown as {
      id: string;
      created_at: string;
      product: { title: string } | null;
    }[]) {
      items.push({
        id: `order-${o.id}`,
        type: "purchase",
        title: o.product?.title ?? "a product",
        createdAt: o.created_at,
      });
    }
  }

  if (reviewsResult.data) {
    for (const r of reviewsResult.data as unknown as {
      id: string;
      created_at: string;
      product: { title: string } | null;
    }[]) {
      items.push({
        id: `review-${r.id}`,
        type: "review",
        title: r.product?.title ?? "a product",
        createdAt: r.created_at,
      });
    }
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { data: items.slice(0, limit), error: null };
}