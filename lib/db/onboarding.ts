import { createClient } from "@/lib/supabase/client";
import type { ArticleWithAuthor, Badge } from "@/types/database";

/**
 * Onboarding শেষ হওয়ার পর "Pioneer" badge টা current user-কে award করে।
 * Badge row যদি না থাকে (migration না চালানো থাকলে), বা user_badges-এ
 * আগে থেকেই থাকে (unique constraint), তাহলে নিরবে fail করে — কোনো
 * onboarding ধাপ এর জন্য আটকে থাকবে না।
 */
export async function awardOnboardingBadge(userId: string): Promise<{
  badge: Badge | null;
  alreadyEarned: boolean;
}> {
  const supabase = createClient();

  const { data: badge } = await supabase
    .from("badges")
    .select("*")
    .eq("name", "Pioneer")
    .maybeSingle();

  if (!badge) {
    return { badge: null, alreadyEarned: false };
  }

  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badge.id,
  });

  // Unique constraint violation মানে user আগেই badge পেয়ে গেছে —
  // সেটা error না, just skip the celebration insert.
  const alreadyEarned = !!error && error.code === "23505";

  return { badge: badge as Badge, alreadyEarned };
}

/**
 * User এর selected worlds থেকে 1-2টা করে trending article টেনে আনে,
 * "First Article Prompt" স্ক্রিনে suggest করার জন্য। Max 6টা article।
 */
export async function getOnboardingArticleSuggestions(
  worldIds: string[]
): Promise<ArticleWithAuthor[]> {
  if (worldIds.length === 0) return [];

  const supabase = createClient();
  const perWorld = worldIds.length > 3 ? 1 : 2;

  const results = await Promise.all(
    worldIds.slice(0, 4).map(async (worldId) => {
      const { data } = await supabase
        .from("articles")
        .select("*, author:profiles(id, username, display_name, avatar_url, level)")
        .eq("world_id", worldId)
        .eq("is_published", true)
        .order("views_count", { ascending: false })
        .limit(perWorld);

      return (data as ArticleWithAuthor[]) ?? [];
    })
  );

  return results.flat().slice(0, 6);
}