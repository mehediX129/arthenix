import { createClient } from "@/lib/supabase/client";

// Check and update streak on login
export async function checkAndUpdateStreak(userId: string): Promise<{
  streakDays: number;
  isNewDay: boolean;
  froze: boolean;
  error: string | null;
}> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("streak_days, last_active_date, freeze_count")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { streakDays: 0, isNewDay: false, froze: false, error: profileError?.message ?? "Profile not found" };
  }

  const lastActive = profile.last_active_date;

  // Already active today
  if (lastActive === today) {
    return { streakDays: profile.streak_days, isNewDay: false, froze: false, error: null };
  }

  let newStreak = profile.streak_days;
  let froze = false;

  if (lastActive === yesterday) {
    // Consecutive day — streak continues
    newStreak += 1;
  } else if (lastActive) {
    // Missed a day — check if freeze was used
    const { data: freeze } = await supabase
      .from("streak_freezes")
      .select("id")
      .eq("user_id", userId)
      .eq("used_on", yesterday)
      .maybeSingle();

    if (freeze) {
      // Freeze was used — streak continues
      newStreak += 1;
      froze = true;
    } else {
      // No freeze — reset streak
      newStreak = 1;
    }
  } else {
    // First time
    newStreak = 1;
  }

  await supabase
    .from("profiles")
    .update({ streak_days: newStreak, last_active_date: today })
    .eq("id", userId);

  return { streakDays: newStreak, isNewDay: true, froze, error: null };
}

// Use a streak freeze
export async function applyStreakFreeze(userId: string): Promise<{
  success: boolean;
  remainingFreezes: number;
  error: string | null;
}> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("freeze_count")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { success: false, remainingFreezes: 0, error: "Profile not found" };
  }

  if (profile.freeze_count <= 0) {
    return { success: false, remainingFreezes: 0, error: "No freezes remaining" };
  }

  // Insert freeze record for today
  const { error: freezeError } = await supabase
    .from("streak_freezes")
    .insert({ user_id: userId, used_on: today });

  if (freezeError) {
    return { success: false, remainingFreezes: profile.freeze_count, error: freezeError.message };
  }

  // Decrement freeze count
  const newCount = profile.freeze_count - 1;
  await supabase
    .from("profiles")
    .update({ freeze_count: newCount })
    .eq("id", userId);

  return { success: true, remainingFreezes: newCount, error: null };
}

// Get streak info
export async function getStreakInfo(userId: string): Promise<{
  streakDays: number;
  freezeCount: number;
  lastActiveDate: string | null;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("streak_days, freeze_count, last_active_date")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { streakDays: 0, freezeCount: 0, lastActiveDate: null, error: error?.message ?? null };
  }

  return {
    streakDays: data.streak_days,
    freezeCount: data.freeze_count,
    lastActiveDate: data.last_active_date,
    error: null,
  };
}