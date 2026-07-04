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
 * Username availability check করে signup এবং profile-edit form এর
 * real-time validation এর জন্য। Edit mode এ excludeUserId পাঠালে
 * ইউজারের নিজের বর্তমান username কে "taken" ধরবে না।
 */
export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<DbResult<boolean>> {
  const supabase = createClient();

  let query = supabase
    .from("profiles")
    .select("id")
    .eq("username", username);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data === null, error: null };
}

/**
 * Avatar image Supabase Storage এর "avatars" bucket এ upload করে।
 * সবসময় {userId}/avatar.{ext} path এ upsert করা হয় — মানে পুরনো
 * avatar automatically replace হয়ে যায়, storage এ orphan file জমে না।
 * সফল হলে public URL রিটার্ন করে, যেটা profiles.avatar_url এ সেভ করতে হবে।
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<DbResult<string>> {
  const supabase = createClient();

  // শুধু image file allow করা হচ্ছে, size limit ৫MB
  if (!file.type.startsWith("image/")) {
    return { data: null, error: "শুধু image file upload করা যাবে" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { data: null, error: "Image size ৫MB এর কম হতে হবে" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) {
    return { data: null, error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  // cache-busting query param যোগ করা হচ্ছে, না হলে browser পুরনো
  // avatar cache করে রাখতে পারে (path একই থাকে upsert এর কারণে)
  const cacheBustedUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  return { data: cacheBustedUrl, error: null };
}