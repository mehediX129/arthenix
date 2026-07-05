import { createClient } from "@/lib/supabase/client";
import type { Quest, UserQuestWithQuest } from "@/types/database";

export interface CompletedQuestInfo {
  userQuestId: string;
  title: string;
  icon: string;
  xpReward: number;
  newTotalXP: number;
  newLevel: string;
}

// আজকের জন্য assign করা quest fetch করে (না থাকলে নতুন করে assign করে দেয়)
export async function getTodayQuests(userId: string): Promise<{
  data: UserQuestWithQuest[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: existing, error: fetchError } = await supabase
    .from("user_quests")
    .select("*, quest:quests(*)")
    .eq("user_id", userId)
    .eq("assigned_date", today);

  if (fetchError) return { data: null, error: fetchError.message };

  if (existing && existing.length > 0) {
    return { data: existing as UserQuestWithQuest[], error: null };
  }

  const { data: allQuests, error: questError } = await supabase
    .from("quests")
    .select("*")
    .eq("is_active", true)
    .eq("quest_type", "daily");

  if (questError || !allQuests) {
    return { data: null, error: questError?.message ?? "No quests found" };
  }

  const shuffled = [...allQuests].sort(() => Math.random() - 0.5);
  const picked: Quest[] = shuffled.slice(0, 3);

  const inserts = picked.map((q) => ({
    user_id: userId,
    quest_id: q.id,
    progress: 0,
    completed: false,
    assigned_date: today,
  }));

  const { error: insertError } = await supabase
    .from("user_quests")
    .insert(inserts);

  if (insertError) return { data: null, error: insertError.message };

  const { data: fresh, error: refetchError } = await supabase
    .from("user_quests")
    .select("*, quest:quests(*)")
    .eq("user_id", userId)
    .eq("assigned_date", today);

  if (refetchError) return { data: null, error: refetchError.message };

  return { data: fresh as UserQuestWithQuest[], error: null };
}

/**
 * মূল automation — আজকের সব incomplete quest এর real progress
 * (like/read/publish/world-visit থেকে) সার্ভার-সাইডে recalculate করে,
 * target পূরণ হয়ে থাকলে নিজে থেকেই complete করে XP দিয়ে দেয়।
 * নতুন completed quest এর তালিকা রিটার্ন করে, যাতে UI toast দেখাতে পারে।
 */
export async function recalculateQuestProgress(
  userId: string
): Promise<{ data: CompletedQuestInfo[]; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "recalculate_daily_quest_progress",
    { p_user_id: userId }
  );

  if (error) {
    return { data: [], error: error.message };
  }

  const completed: CompletedQuestInfo[] = (data ?? []).map(
    (row: {
      user_quest_id: string;
      quest_title: string;
      quest_icon: string;
      xp_reward: number;
      new_total_xp: number;
      new_level: string;
    }) => ({
      userQuestId: row.user_quest_id,
      title: row.quest_title,
      icon: row.quest_icon,
      xpReward: row.xp_reward,
      newTotalXP: row.new_total_xp,
      newLevel: row.new_level,
    })
  );

  return { data: completed, error: null };
}

// World page-এ ঢুকলে call হবে — "Explorer" quest (visit_world) এর জন্য
export async function recordWorldVisit(
  userId: string,
  worldId: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase.rpc("record_world_visit", {
    p_user_id: userId,
    p_world_id: worldId,
  });

  return { error: error?.message ?? null };
}