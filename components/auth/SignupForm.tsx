"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Check, X, MailCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type StrengthLevel = "weak" | "medium" | "strong" | null;

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

const STRENGTH_CONFIG: Record<
  Exclude<StrengthLevel, null>,
  { label: string; color: string; width: string }
> = {
  weak: { label: "Weak", color: "#EF4444", width: "33%" },
  medium: { label: "Medium", color: "#F59E0B", width: "66%" },
  strong: { label: "Strong", color: "#10B981", width: "100%" },
};

export default function SignupForm() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // signup সফল হলে email confirmation screen দেখানোর জন্য
  const [emailSent, setEmailSent] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    name.trim().length >= 2 &&
    email.length > 0 &&
    password.length >= 8 &&
    passwordsMatch &&
    agreedToTerms &&
    !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
      } else if (!passwordsMatch) {
        setError("Passwords do not match.");
      } else if (!agreedToTerms) {
        setError("You must agree to the Terms of Service.");
      }
      return;
    }

    setLoading(true);

    // username + display_name signup এর সময়েই auth metadata তে পাঠিয়ে দিচ্ছি।
    // profile row তৈরি হবে email confirm করার পর প্রথম login এ
    // (তখনই auth.uid() সঠিকভাবে কাজ করে, RLS policy পাশ হয়)।
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          username: email.split("@")[0],
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message === "User already registered"
          ? "An account with this email already exists."
          : "Failed to create account. Please try again."
      );
      return;
    }

    setEmailSent(true);
  }

  async function handleOAuth(provider: "google" | "discord") {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  // ----------------------------------------------------------
  // Email confirmation pending screen
  // ----------------------------------------------------------
  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative rounded-2xl border border-[#7C3AED]/20 bg-card-bg/80 backdrop-blur-xl p-8 text-center shadow-[0_0_60px_-15px_rgba(124,58,237,0.3)]"
      >
        <div className="flex justify-center mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#06B6D4]/15">
            <MailCheck size={28} className="text-[#06B6D4]" />
          </div>
        </div>

        <h1 className="font-display text-xl font-bold text-text-primary">
          Check your inbox
        </h1>
        <p className="text-text-secondary text-sm mt-2.5 leading-relaxed">
          We sent a confirmation link to{" "}
          <span className="text-text-primary font-medium">{email}</span>.
          Click the link to activate your account.
        </p>

        <p className="text-text-muted text-xs mt-5">
          Check your inbox for the confirmation email.
        </p>

        <Link
          href="/login"
          className="inline-block mt-6 text-sm font-medium text-[#06B6D4] hover:text-[#7C3AED] transition-colors"
        >
          Sign in to your account
        </Link>
      </motion.div>
    );
  }

  // ----------------------------------------------------------
  // Signup form
  // ----------------------------------------------------------
  return (
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
        Join the universe.
      </h1>
      <p className="text-text-secondary text-sm text-center mt-1 mb-7">
        Create your account in seconds.
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
            Full name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg bg-secondary-bg border border-white/10 px-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
          />
        </div>

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
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Password
          </label>
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

          {strength && (
            <div className="mt-2">
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: STRENGTH_CONFIG[strength].width }}
                  transition={{ duration: 0.3 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: STRENGTH_CONFIG[strength].color }}
                />
              </div>
              <span
                className="text-xs mt-1 inline-block"
                style={{ color: STRENGTH_CONFIG[strength].color }}
              >
                Password: {STRENGTH_CONFIG[strength].label}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-lg bg-secondary-bg border px-4 py-2.5 pr-11 text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:ring-2 ${
                passwordsMismatch
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                  : passwordsMatch
                  ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                  : "border-white/10 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {confirmPassword.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {passwordsMatch ? (
                  <Check size={16} className="text-emerald-500" />
                ) : (
                  <X size={16} className="text-red-500" />
                )}
              </span>
            )}
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-secondary-bg accent-[#7C3AED]"
          />
          <span className="text-xs text-text-secondary">
            আমি{" "}
            <Link href="/terms" className="text-[#06B6D4] hover:underline">
              Terms of Service
            </Link>{" "}
            ও{" "}
            <Link href="/privacy" className="text-[#06B6D4] hover:underline">
              Privacy Policy
            </Link>
            -এ সম্মত
          </span>
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
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
          onClick={() => handleOAuth("google")}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-secondary-bg py-2.5 text-sm text-text-primary transition-colors hover:bg-white/5"
        >
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
          Google
        </button>
        <button
          onClick={() => handleOAuth("discord")}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-secondary-bg py-2.5 text-sm text-text-primary transition-colors hover:bg-[#5865F2]/10 hover:border-[#5865F2]/40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2">
            <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.106c.36.698.772 1.362 1.225 1.994a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          Discord
        </button>
      </div>

      <p className="mt-7 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[#06B6D4] hover:text-[#7C3AED] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}