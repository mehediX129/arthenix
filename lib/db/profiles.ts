import { createClient } from "@/lib/supabase/client";
import type {
  Profile,
  ProfileUpdate,
  UserBadgeWithBadge,
  WorldAffinity,
  DbResult,
} from "@/types/database";

/**
 * Username দিয়ে public profile খুঁজে বের করে (Profile page এর জন্য)।
 */
export async function getProfileByUsername(
  username: string
): Promise<DbResult<Profile>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Profile, error: null };
}

/**
 * নিজের profile আপডেট করার জন্য (bio, display_name, avatar_url ইত্যাদি)।
 * RLS policy নিশ্চিত করে শুধু নিজের profile-ই update করা যাবে।
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<DbResult<Profile>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Profile, error: null };
}

/**
 * একজন ইউজারের অর্জিত সব badge fetch করে, badge এর details সহ (joined)।
 */
export async function getUserBadges(
  userId: string
): Promise<DbResult<UserBadgeWithBadge[]>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as UserBadgeWithBadge[], error: null };
}

/**
 * একজন ইউজার কোন world-এ কতটা engaged, সেটা বের করে
 * (Phase 3B এর get_user_world_affinity SQL function কল করে)।
 */
export async function getWorldAffinity(
  userId: string
): Promise<DbResult<WorldAffinity[]>> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_user_world_affinity", {
    p_user_id: userId,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as WorldAffinity[], error: null };
}

/**
 * Login হওয়ার সময় কল করার জন্য — last_active আপডেট করে,
 * যেটা Phase 3B এর streak trigger কে fire করবে automatically।
 */
export async function recordUserActivity(
  userId: string
): Promise<DbResult<null>> {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ last_active: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

/**
 * Username availability check করে signup form-এর real-time validation এর জন্য।
 */
export async function isUsernameAvailable(
  username: string
): Promise<DbResult<boolean>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data === null, error: null };
}