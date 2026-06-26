import { createClient } from "@/lib/supabase/client";

export async function toggleFollow(followingId: string): Promise<{
  following: boolean;
  error: string | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("toggle_follow", {
    p_following_id: followingId,
  });
  if (error) return { following: false, error: error.message };
  return { following: (data as { following: boolean }).following, error: null };
}

export async function getFollowState(profileId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_follow_state", {
    p_profile_id: profileId,
  });
  return (data as boolean) ?? false;
}

export async function getFollowers(profileId: string): Promise<{
  data: { id: string; username: string; display_name: string | null; avatar_url: string | null; level: string }[];
  error: string | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("follows")
    .select("follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, level)")
    .eq("following_id", profileId)
    .limit(50);

  if (error) return { data: [], error: error.message };
  const profiles = (data ?? []).map((row: unknown) => {
    const r = row as { follower: { id: string; username: string; display_name: string | null; avatar_url: string | null; level: string } };
    return r.follower;
  });
  return { data: profiles, error: null };
}

export async function getFollowing(profileId: string): Promise<{
  data: { id: string; username: string; display_name: string | null; avatar_url: string | null; level: string }[];
  error: string | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("follows")
    .select("following:profiles!follows_following_id_fkey(id, username, display_name, avatar_url, level)")
    .eq("follower_id", profileId)
    .limit(50);

  if (error) return { data: [], error: error.message };
  const profiles = (data ?? []).map((row: unknown) => {
    const r = row as { following: { id: string; username: string; display_name: string | null; avatar_url: string | null; level: string } };
    return r.following;
  });
  return { data: profiles, error: null };
}