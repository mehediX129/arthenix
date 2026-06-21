"use client";

import React from "react";
import { motion } from "framer-motion";
import { getProgressToNextLevel, getLevelColor } from "@/lib/utils/gamification";

interface LevelProgressBarProps {
  xp: number;
}

export default function LevelProgressBar({ xp }: LevelProgressBarProps) {
  const { percentage, currentLevel, nextLevel, xpNeededForNext } =
    getProgressToNextLevel(xp);

  const currentColor = getLevelColor(currentLevel);
  const nextColor = nextLevel ? getLevelColor(nextLevel) : currentColor;

  return (
    <div className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: currentColor }}
          >
            {currentLevel}
          </span>
          {nextLevel && (
            <>
              <span className="text-text-muted text-xs">→</span>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold border"
                style={{ borderColor: nextColor, color: nextColor }}
              >
                {nextLevel}
              </span>
            </>
          )}
        </div>
        <span className="font-mono text-xs text-text-muted">
          {percentage}%
        </span>
      </div>

      <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${currentColor}, ${nextColor})`,
          }}
        />
      </div>

      <p className="text-text-muted text-xs mt-2.5">
        {nextLevel
          ? `${xpNeededForNext?.toLocaleString()} XP to ${nextLevel}`
          : "তুমি সর্বোচ্চ level-এ পৌঁছে গেছো! 🏆"}
      </p>
    </div>
  );
}