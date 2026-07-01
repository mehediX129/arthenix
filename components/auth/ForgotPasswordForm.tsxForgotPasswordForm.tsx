"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MailCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    // Email enumeration এড়াতে — error হোক বা না হোক, একই success
    // স্ক্রিন দেখানো হয় (attacker যাতে বুঝতে না পারে কোন email
    // আসলে exist করে)।
    if (resetError) {
      console.error("Password reset request failed:", resetError.message);
    }
    setSent(true);
  }

  if (sent) {
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
          If an account exists for{" "}
          <span className="text-text-primary font-medium">{email}</span>,
          we&apos;ve sent a password reset link. It may take a minute to arrive.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium text-[#06B6D4] hover:text-[#7C3AED] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
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
        Forgot your password?
      </h1>
      <p className="text-text-secondary text-sm text-center mt-1 mb-7">
        Enter your email and we&apos;ll send you a reset link.
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

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending link...
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-text-secondary">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-[#06B6D4] hover:text-[#7C3AED] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </p>
    </motion.div>
  );
}