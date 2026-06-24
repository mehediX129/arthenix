import { createClient } from "@/lib/supabase/client";
import type { Quest, UserQuestWithQuest } from "@/types/database";

// Fetch today's assigned quests for a user (creates them if not exists)
export async function getTodayQuests(userId: string): Promise<{
  data: UserQuestWithQuest[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  // Check if quests already assigned today
  const { data: existing, error: fetchError } = await supabase
    .from("user_quests")
    .select("*, quest:quests(*)")
    .eq("user_id", userId)
    .eq("assigned_date", today);

  if (fetchError) return { data: null, error: fetchError.message };

  // If already assigned, return them
  if (existing && existing.length > 0) {
    return { data: existing as UserQuestWithQuest[], error: null };
  }

  // Otherwise pick 3 random active quests and assign
  const { data: allQuests, error: questError } = await supabase
    .from("quests")
    .select("*")
    .eq("is_active", true)
    .eq("quest_type", "daily");

  if (questError || !allQuests) return { data: null, error: questError?.message ?? "No quests found" };

  // Shuffle and pick 3
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

  // Re-fetch with quest details
  const { data: fresh, error: refetchError } = await supabase
    .from("user_quests")
    .select("*, quest:quests(*)")
    .eq("user_id", userId)
    .eq("assigned_date", today);

  if (refetchError) return { data: null, error: refetchError.message };

  return { data: fresh as UserQuestWithQuest[], error: null };
}

// Update quest progress
export async function updateQuestProgress(
  userQuestId: string,
  newProgress: number,
  targetCount: number
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const completed = newProgress >= targetCount;

  const { error } = await supabase
    .from("user_quests")
    .update({
      progress: newProgress,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", userQuestId);

  return { error: error?.message ?? null };
}

// Complete a quest manually (for demo/testing)
export async function completeQuest(
  userQuestId: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("user_quests")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      progress: 999,
    })
    .eq("id", userQuestId);

  return { error: error?.message ?? null };
}