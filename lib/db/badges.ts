import { createClient } from "@/lib/supabase/client";
import type { Badge, DbResult } from "@/types/database";

/**
 * সব badge fetch করে (system-এ যত badge আছে, earned হোক বা না হোক)।
 * BadgesGrid component locked/unlocked state বের করতে এটা ব্যবহার করবে।
 */
export async function getAllBadges(): Promise<DbResult<Badge[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .order("tier", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Badge[], error: null };
}