import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface PostOAuthResult {
  isNewUser: boolean;
  userId: string;
  firstName: string;
}

/**
 * Google One Tap-এর মতো fully client-side OAuth flow-এর পর কল করা হয়।
 * এক্ষেত্রে app/auth/callback/route.ts (server-side redirect flow, যেটা
 * button-based "Sign in with Google" ব্যবহার করে) সম্পূর্ণ বাইপাস হয়ে
 * যায় — তাই profile-check + profile-creation লজিকটা এখানে আলাদাভাবে
 * রাখা হলো, যাতে দুটো flow (server redirect + client One Tap) একই
 * user-creation বিহেভিয়ার মেনে চলে এবং ডুপ্লিকেট/অসামঞ্জস্যপূর্ণ profile
 * তৈরি না হয়।
 *
 * নতুন user হলে profile row তৈরি করে দেয় (onboarding_complete: false),
 * আগে থেকে থাকলে existing profile থেকেই নাম বের করে।
 */
export async function ensureProfileAfterOAuth(
  supabase: SupabaseClient,
  user: User
): Promise<PostOAuthResult> {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return {
      isNewUser: false,
      userId: user.id,
      firstName:
        existingProfile.display_name?.split(" ")[0] ??
        user.email?.split("@")[0] ??
        "Explorer",
    };
  }

  const metadata = user.user_metadata as {
    full_name?: string;
    name?: string;
    username?: string;
  };
  const name =
    metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "Explorer";
  const username =
    metadata.username ?? user.email?.split("@")[0] ?? `user_${user.id.slice(0, 8)}`;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: name,
    username,
    onboarding_complete: false,
  });

  if (profileError) {
    console.error("OAuth profile creation failed:", profileError.message);
  }

  return {
    isNewUser: true,
    userId: user.id,
    firstName: name.split(" ")[0],
  };
}