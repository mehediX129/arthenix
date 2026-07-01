import { createClient } from "@/lib/supabase/client";
import type { UserLevel } from "@/lib/utils/gamification";

export interface AwardXPResult {
  newXP: number;
  newLevel: UserLevel;
  oldLevel: UserLevel;
  leveledUp: boolean;
}

/**
 * Server-side `award_xp` RPC কল করে user-কে real XP দেয় এবং
 * প্রয়োজনে level আপডেট করে। কোনো কারণে fail করলে null রিটার্ন করে —
 * caller তখন UI-তে XP toast/level-up না দেখিয়ে নিরবে fail করতে পারবে,
 * যাতে quest completion আটকে না যায়।
 */
export async function awardXP(
  userId: string,
  amount: number
): Promise<AwardXPResult | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc("award_xp", { p_user_id: userId, p_amount: amount })
    .single();

  if (error || !data) {
    console.error("awardXP failed:", error?.message);
    return null;
  }

  const row = data as {
    new_xp: number;
    new_level: string;
    old_level: string;
    leveled_up: boolean;
  };

  return {
    newXP: row.new_xp,
    newLevel: row.new_level as UserLevel,
    oldLevel: row.old_level as UserLevel,
    leveledUp: row.leveled_up,
  };
}