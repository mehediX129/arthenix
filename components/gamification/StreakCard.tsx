"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Snowflake, Shield } from "lucide-react";
import { applyStreakFreeze } from "@/lib/db/streak";
import { useXPToastStore } from "@/store/xpToastStore";

interface StreakCardProps {
  userId: string;
  initialStreakDays: number;
  initialFreezeCount: number;
}

export function StreakCard({ userId, initialStreakDays, initialFreezeCount }: StreakCardProps) {
  const [freezeCount, setFreezeCount] = useState(initialFreezeCount);
  const [freezing, setFreezing] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const { addToast } = useXPToastStore();

  async function handleFreeze() {
    if (freezeCount <= 0 || frozen) return;
    setFreezing(true);

    const { success, remainingFreezes } = await applyStreakFreeze(userId);

    if (success) {
      setFreezeCount(remainingFreezes);
      setFrozen(true);
      addToast(0, "Streak freeze activated!", "🧊");
    }

    setFreezing(false);
  }

  const streakLevel =
    initialStreakDays >= 30 ? "legendary" :
    initialStreakDays >= 14 ? "epic" :
    initialStreakDays >= 7  ? "rare" : "common";

  const flameColor =
    streakLevel === "legendary" ? "text-purple-400" :
    streakLevel === "epic"      ? "text-blue-400" :
    streakLevel === "rare"      ? "text-orange-400" : "text-yellow-400";

  const glowColor =
    streakLevel === "legendary" ? "bg-purple-400/20" :
    streakLevel === "epic"      ? "bg-blue-400/20" :
    streakLevel === "rare"      ? "bg-orange-400/20" : "bg-yellow-400/20";

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <h3 className="text-sm font-semibold text-text-primary">Daily Streak</h3>
        </div>
        {streakLevel !== "common" && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            streakLevel === "legendary" ? "bg-purple-400/10 text-purple-400" :
            streakLevel === "epic"      ? "bg-blue-400/10 text-blue-400" :
                                          "bg-orange-400/10 text-orange-400"
          }`}>
            {streakLevel.toUpperCase()}
          </span>
        )}
      </div>

      {/* Streak count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
              className={`absolute inset-0 rounded-full blur-xl ${glowColor}`}
            />
            <div className="relative flex items-center gap-2">
              <Flame size={36} className={flameColor} />
              <span className="text-4xl font-black text-text-primary">
                {initialStreakDays}
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">
              {initialStreakDays === 1 ? "day" : "days"}
            </span>
            <span className="text-xs text-text-muted">current streak</span>
          </div>
        </div>

        {/* Freeze button */}
        <div className="flex flex-col items-end gap-1">
          <AnimatePresence mode="wait">
            {frozen ? (
              <motion.div
                key="frozen"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20"
              >
                <Snowflake size={13} className="text-cyan-400" />
                <span className="text-cyan-400 text-xs font-semibold">Frozen!</span>
              </motion.div>
            ) : (
              <motion.button
                key="freeze-btn"
                onClick={handleFreeze}
                disabled={freezeCount <= 0 || freezing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Shield size={13} />
                {freezing ? "Freezing..." : "Use Freeze"}
              </motion.button>
            )}
          </AnimatePresence>
          <span className="text-xs text-text-muted">
            {freezeCount} freeze{freezeCount !== 1 ? "s" : ""} left
          </span>
        </div>
      </div>

      {/* Milestone hints */}
      <div className="mt-4 pt-4 border-t border-white/5">
        {initialStreakDays < 7 && (
          <p className="text-xs text-text-muted">
            🔥 {7 - initialStreakDays} more days to reach <span className="text-orange-400 font-semibold">Rare</span> streak
          </p>
        )}
        {initialStreakDays >= 7 && initialStreakDays < 14 && (
          <p className="text-xs text-text-muted">
            ⚡ {14 - initialStreakDays} more days to reach <span className="text-blue-400 font-semibold">Epic</span> streak
          </p>
        )}
        {initialStreakDays >= 14 && initialStreakDays < 30 && (
          <p className="text-xs text-text-muted">
            ✨ {30 - initialStreakDays} more days to reach <span className="text-purple-400 font-semibold">Legendary</span> streak
          </p>
        )}
        {initialStreakDays >= 30 && (
          <p className="text-xs text-text-muted">
            👑 You have achieved <span className="text-purple-400 font-semibold">Legendary</span> status!
          </p>
        )}
      </div>
    </div>
  );
}