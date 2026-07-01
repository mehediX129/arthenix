"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WorldSelector from "./WorldSelector";
import WelcomeScreen from "./WelcomeScreen";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import AchievementUnlockModal from "@/components/onboarding/AchievementUnlockModal";
import FirstArticlePrompt from "@/components/onboarding/FirstArticlePrompt";
import { awardOnboardingBadge } from "@/lib/db/onboarding";
import { signInWithOAuthSafely, type OAuthProvider } from "@/lib/auth/oauth";

type Step = "login" | "worlds" | "tour" | "achievement" | "article" | "welcome";

const DEFAULT_BADGE_NAME = "Pioneer";
const DEFAULT_BADGE_DESC =
  "Completed onboarding and chose your first worlds on Arthenix.";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("login");
  const [firstName, setFirstName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedWorldIds, setSelectedWorldIds] = useState<string[]>([]);
  const [savingWorlds, setSavingWorlds] = useState(false);
  const [checkingOAuthSession, setCheckingOAuthSession] = useState(true);

  const [achievementBadgeName, setAchievementBadgeName] =
    useState(DEFAULT_BADGE_NAME);
  const [achievementBadgeDesc, setAchievementBadgeDesc] =
    useState(DEFAULT_BADGE_DESC);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  // /auth/callback থেকে ?onboarding=1 সহ redirect এলে (Google/Discord
  // দিয়ে প্রথমবার লগইন করা নতুন user), সরাসরি world selection step এ
  // নিয়ে যাওয়া হয় — password login form স্কিপ করে।
  useEffect(() => {
    const isOnboarding = searchParams.get("onboarding") === "1";
    const oauthError = searchParams.get("error");

    if (oauthError === "oauth_failed") {
      setError("Google sign-in failed. Please try again or use email/password.");
      setCheckingOAuthSession(false);
      return;
    }

    if (!isOnboarding) {
      setCheckingOAuthSession(false);
      return;
    }

    const nameParam = searchParams.get("name");

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setFirstName(nameParam ?? data.user.email?.split("@")[0] ?? "Explorer");
        setStep("worlds");
      }
      setCheckingOAuthSession(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(
        signInError.message === "Invalid login credentials"
          ? "Incorrect email or password. Please verify that your email has been confirmed."
          : "Something went wrong. Please try again."
      );
      return;
    }

    if (!data.user) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    // Check whether a profile row already exists for this user.
    // If not, this is their first login (after email confirmation),
    // so we create the profile now and kick off the onboarding flow.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!existingProfile) {
      const metadata = data.user.user_metadata as {
        full_name?: string;
        username?: string;
      };
      const name = metadata.full_name ?? email.split("@")[0];

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: name,
        username: metadata.username ?? email.split("@")[0],
        onboarding_complete: false,
      });

      if (profileError) {
        console.error("Profile creation failed:", profileError.message);
      }

      setLoading(false);
      setUserId(data.user.id);
      setFirstName(name.split(" ")[0]);
      setStep("worlds");
      return;
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  async function handleWorldsSelected(worldIds: string[]) {
    setSavingWorlds(true);
    setSelectedWorldIds(worldIds);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);
      await supabase
        .from("profiles")
        .update({
          selected_worlds: worldIds,
          onboarding_complete: true,
        })
        .eq("id", user.id);
    }

    setSavingWorlds(false);
    setStep("tour");
  }

  async function handleTourComplete() {
    if (userId) {
      const { badge, alreadyEarned } = await awardOnboardingBadge(userId);
      if (badge && !alreadyEarned) {
        setAchievementBadgeName(badge.name);
        setAchievementBadgeDesc(badge.description ?? DEFAULT_BADGE_DESC);
      }
    }
    setStep("achievement");
  }

  function handleAchievementContinue() {
    setStep("article");
  }

  function handleArticleStepContinue() {
    setStep("welcome");
  }

  function handleStartExploring() {
    router.push("/");
    router.refresh();
  }

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setOauthLoading(provider);

    const result = await signInWithOAuthSafely(
      supabase,
      provider,
      `${window.location.origin}/auth/callback`
    );

    if (!result.success) {
      setOauthLoading(null);
      setError(result.error);
    }
    // success হলে ব্রাউজার ইতিমধ্যে redirect হয়ে যাচ্ছে, তাই loading state
    // আনসেট করার দরকার নেই — page navigate করে যাবে।
  }

  // OAuth redirect থেকে ফেরার পর user/profile চেক হওয়া পর্যন্ত একটা
  // হালকা loading state দেখানো হয়, যাতে স্ক্রিনে flash না করে।
  if (checkingOAuthSession) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  if (step === "worlds") {
    return (
      <WorldSelector onComplete={handleWorldsSelected} loading={savingWorlds} />
    );
  }

  if (step === "tour") {
    return <OnboardingTour onComplete={handleTourComplete} />;
  }

  if (step === "article") {
    return (
      <FirstArticlePrompt
        selectedWorldIds={selectedWorldIds}
        onContinue={handleArticleStepContinue}
      />
    );
  }

  if (step === "welcome") {
    return (
      <WelcomeScreen
        userName={firstName}
        selectedWorldIds={selectedWorldIds}
        onStart={handleStartExploring}
      />
    );
  }

  return (
    <>
      <AchievementUnlockModal
        isOpen={step === "achievement"}
        badgeName={achievementBadgeName}
        badgeDescription={achievementBadgeDesc}
        onContinue={handleAchievementContinue}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative rounded-2xl border border-[#7C3AED]/20 bg-card-bg/80 backdrop-blur-xl p-8 shadow-[0_0_60px_-15px_rgba(124,58,237,0.3)]"
      >
        <div className="flex justify-center mb-6">
          <span className="font-display text-2xl font-black bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">
            ARTHENIX
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold text-text-primary text-center">
          Welcome back.
        </h1>
        <p className="text-text-secondary text-sm text-center mt-1 mb-7">
          Your universe awaits.
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-secondary-bg border border-white/10 px-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-text-secondary">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#06B6D4] hover:text-[#7C3AED] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-secondary-bg border border-white/10 px-4 py-2.5 pr-11 text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-secondary-bg accent-[#7C3AED]"
            />
            <span className="text-xs text-text-secondary">Remember me</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-text-muted">or continue with</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-secondary-bg py-2.5 text-sm text-text-primary transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading === "google" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("discord")}
            disabled={oauthLoading !== null}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-secondary-bg py-2.5 text-sm text-text-primary transition-colors hover:bg-[#5865F2]/10 hover:border-[#5865F2]/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading === "discord" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.106c.36.698.772 1.362 1.225 1.994a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            )}
            Discord
          </button>
        </div>

        <p className="mt-7 text-center text-sm text-text-secondary">
          New to Arthenix?{" "}
          <Link
            href="/signup"
            className="font-medium text-[#06B6D4] hover:text-[#7C3AED] transition-colors"
          >
            Create account
          </Link>
        </p>
      </motion.div>
    </>
  );
}