"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset link থেকে আসা recovery session আছে কিনা চেক করা — না থাকলে
  // user সরাসরি এই পেজে এসে গেলে বুঝতে পারবে link টা invalid/expired।
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasValidSession(!!data.session);
      setCheckingSession(false);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      setError("Could not update password. Please request a new reset link.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/login");
    }, 2500);
  }

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative rounded-2xl border border-red-500/20 bg-card-bg/80 backdrop-blur-xl p-8 text-center shadow-[0_0_60px_-15px_rgba(239,68,68,0.2)]"
      >
        <h1 className="font-display text-xl font-bold text-text-primary">
          Link expired or invalid
        </h1>
        <p className="text-text-secondary text-sm mt-2.5 leading-relaxed">
          This password reset link is no longer valid. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block mt-6 text-sm font-medium text-[#06B6D4] hover:text-[#7C3AED] transition-colors"
        >
          Request a new link
        </Link>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative rounded-2xl border border-emerald-500/20 bg-card-bg/80 backdrop-blur-xl p-8 text-center shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)]"
      >
        <div className="flex justify-center mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
        </div>
        <h1 className="font-display text-xl font-bold text-text-primary">
          Password updated
        </h1>
        <p className="text-text-secondary text-sm mt-2.5">
          Redirecting you to sign in...
        </p>
      </motion.div>
    );
  }

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
        Set a new password
      </h1>
      <p className="text-text-secondary text-sm text-center mt-1 mb-7">
        Make it strong — at least 8 characters.
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
            New password
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
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Confirm new password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg bg-secondary-bg border border-white/10 px-4 py-2.5 text-text-primary text-sm placeholder:text-text-muted outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Updating...
            </>
          ) : (
            "Update password"
          )}
        </button>
      </form>
    </motion.div>
  );
}