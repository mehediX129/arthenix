import { createClient } from "@/lib/supabase/client";

/**
 * User-এর daily streak update করে। প্রতিদিন একবারই call করতে হয়
 * (RPC-এর ভেতরে same-day guard আছে, তাই বারবার call করলেও safe)।
 * `useUser` hook বা app layout থেকে user load হলে call করা হয়।
 */
export async function checkAndUpdateStreak(userId: string): Promise<{
  streakDays: number;
  isNewDay: boolean;
  usedFreeze: boolean;
  error: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc("update_streak", { p_user_id: userId })
    .single();

  if (error || !data) {
    console.error("checkAndUpdateStreak failed:", error?.message);
    return { streakDays: 0, isNewDay: false, usedFreeze: false, error: error?.message ?? null };
  }

  const row = data as {
    streak_days: number;
    is_new_day: boolean;
    used_freeze: boolean;
  };

  return {
    streakDays: row.streak_days,
    isNewDay: row.is_new_day,
    usedFreeze: row.used_freeze,
    error: null,
  };
}

/**
 * Streak freeze ব্যবহার করে — আজকের date-এ freeze row insert করে
 * এবং profiles.freeze_count কমায়।
 */
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

  const { error: freezeError } = await supabase
    .from("streak_freezes")
    .insert({ user_id: userId, used_on: today });

  if (freezeError) {
    return {
      success: false,
      remainingFreezes: profile.freeze_count,
      error: freezeError.message,
    };
  }

  const newCount = profile.freeze_count - 1;
  await supabase
    .from("profiles")
    .update({ freeze_count: newCount })
    .eq("id", userId);

  return { success: true, remainingFreezes: newCount, error: null };
}

/**
 * User-এর streak info fetch করে — StreakCard-এর initial load-এ ব্যবহার হয়।
 */
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
    return {
      streakDays: 0,
      freezeCount: 0,
      lastActiveDate: null,
      error: error?.message ?? null,
    };
  }

  return {
    streakDays: data.streak_days,
    freezeCount: data.freeze_count ?? 2,
    lastActiveDate: data.last_active_date,
    error: null,
  };
}