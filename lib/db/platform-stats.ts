import { createClient } from "@/lib/supabase/client";

export interface PlatformStats {
  articles: number;
  members: number;
  worlds: number;
  totalXP: number;
}

/**
 * Homepage hero-তে real, live সংখ্যা দেখানোর জন্য — কোনো hardcoded/fake
 * বিশাল সংখ্যা না। নতুন platform-এ সংখ্যা ছোট হতে পারে, কিন্তু সততাই
 * বিশ্বাসযোগ্যতা তৈরি করে — কেউ signup করে বাস্তবতা দেখে হতাশ হবে না।
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = createClient();

  const [articlesRes, membersRes, xpRes] = await Promise.all([
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("xp"),
  ]);

  const totalXP =
    xpRes.data?.reduce((sum, row) => sum + (row.xp ?? 0), 0) ?? 0;

  return {
    articles: articlesRes.count ?? 0,
    members: membersRes.count ?? 0,
    worlds: 12,
    totalXP,
  };
}