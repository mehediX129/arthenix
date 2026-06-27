import { createClient } from "@/lib/supabase/client";

const XP_VALUES = {
  article_like: 5,
  article_publish: 50,
  post_create: 15,
  post_like: 2,
  daily_login: 10,
} as const;

export type XPAction = keyof typeof XP_VALUES;

export async function awardXP(
  userId: string,
  action: XPAction
): Promise<{ newXP: number | null; error: string | null }> {
  const supabase = createClient();
  const amount = XP_VALUES[action];

  const { data, error } = await supabase.rpc("award_xp", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) return { newXP: null, error: error.message };
  return { newXP: data as number, error: null };
}