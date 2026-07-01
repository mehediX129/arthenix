import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Google/Discord OAuth login সফল হওয়ার পর Supabase এই route-এ
 * একটা temporary `code` সহ redirect করে। এখানে সেই code টা session
 * এ exchange করা হয়, তারপর profile আছে কিনা চেক করে সেই অনুযায়ী
 * onboarding flow এ পাঠানো হয় অথবা সরাসরি home এ পাঠানো হয়।
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(loginUrl);
  }

  // Profile আগে থেকে আছে কিনা চেক করা — নতুন হলে এখানেই তৈরি করে
  // onboarding flow (world selection → tour → achievement → article)
  // trigger করার সিগন্যাল পাঠানো হয়।
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existingProfile) {
    const metadata = data.user.user_metadata as {
      full_name?: string;
      name?: string;
      username?: string;
      email?: string;
    };
    const name =
      metadata.full_name ?? metadata.name ?? data.user.email?.split("@")[0] ?? "Explorer";
    const username =
      metadata.username ?? data.user.email?.split("@")[0] ?? `user_${data.user.id.slice(0, 8)}`;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      display_name: name,
      username,
      onboarding_complete: false,
    });

    if (profileError) {
      console.error("OAuth profile creation failed:", profileError.message);
    }

    const onboardingUrl = new URL("/login", requestUrl.origin);
    onboardingUrl.searchParams.set("onboarding", "1");
    onboardingUrl.searchParams.set("name", name.split(" ")[0]);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.redirect(`${requestUrl.origin}/`);
}