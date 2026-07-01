import type { SupabaseClient } from "@supabase/supabase-js";

export type OAuthProvider = "google" | "discord";

interface OAuthResult {
  success: boolean;
  error: string | null;
}

const FRIENDLY_PROVIDER_NAMES: Record<OAuthProvider, string> = {
  google: "Google",
  discord: "Discord",
};

/**
 * OAuth provider দিয়ে sign-in শুরু করার আগে provider আসলেই enabled কিনা
 * সেটা server-side ভ্যালিডেট করে নেয় (skipBrowserRedirect ব্যবহার করে,
 * যাতে ব্রাউজার সরাসরি Supabase-এর raw error page এ navigate না করে)।
 *
 * Provider available থাকলে browser কে actual OAuth URL এ পাঠিয়ে দেয়।
 * Provider disabled থাকলে বা অন্য কোনো error হলে friendly message সহ
 * { success: false, error } রিটার্ন করে — caller সেটা inline দেখাতে পারবে।
 */
export async function signInWithOAuthSafely(
  supabase: SupabaseClient,
  provider: OAuthProvider,
  redirectTo: string
): Promise<OAuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    const providerName = FRIENDLY_PROVIDER_NAMES[provider];
    return {
      success: false,
      error: `${providerName} sign-in isn't available right now. Please use your email and password, or try again later.`,
    };
  }

  // Provider valid — এখন সরাসরি ব্রাউজার কে redirect করানো হচ্ছে।
  window.location.href = data.url;
  return { success: true, error: null };
}