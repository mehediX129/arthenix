import { createClient } from "@/lib/supabase/client";
import type { UserActivity } from "@/types/database";

// Get last 365 days of activity
export async function getUserActivity(userId: string): Promise<{
  data: UserActivity[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);

  const { data, error } = await supabase
    .from("user_activity")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", from.toISOString().split("T")[0])
    .order("activity_date", { ascending: true });

  return { data, error: error?.message ?? null };
}

// Log activity for today
export async function logActivity(userId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("user_activity")
    .upsert(
      { user_id: userId, activity_date: today, activity_count: 1 },
      { onConflict: "user_id,activity_date" }
    );

  // If already exists, increment count
  if (!error) {
    await supabase.rpc("increment_activity", { p_user_id: userId, p_date: today });
  }

  return { error: error?.message ?? null };
}