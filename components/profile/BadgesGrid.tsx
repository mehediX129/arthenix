"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy } from "lucide-react";
import type { Badge, UserBadgeWithBadge, BadgeTier } from "@/types/database";

interface BadgesGridProps {
  allBadges: Badge[];
  earnedBadges: UserBadgeWithBadge[];
}

const TIER_FILTERS: { value: BadgeTier | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "rare", label: "Rare" },
  { value: "epic", label: "Epic" },
  { value: "legendary", label: "Legendary" },
];

const TIER_GLOW: Record<BadgeTier, string> = {
  common: "rgba(148,163,184,0.3)",
  rare: "rgba(6,182,212,0.4)",
  epic: "rgba(124,58,237,0.5)",
  legendary: "rgba(245,158,11,0.6)",
};

const TIER_SOLID: Record<BadgeTier, string> = {
  common: "#94A3B8",
  rare: "#06B6D4",
  epic: "#7C3AED",
  legendary: "#F59E0B",
};

const NEW_BADGE_WINDOW_DAYS = 7;

function isRecentlyEarned(earnedAt: string | undefined): boolean {
  if (!earnedAt) return false;
  const diffDays =
    (Date.now() - new Date(earnedAt).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_BADGE_WINDOW_DAYS;
}

interface BadgeIconProps {
  tier: BadgeTier;
  size: number;
}

function BadgeIcon({ tier, size }: BadgeIconProps) {
  return (
    <Trophy
      size={size}
      style={{ color: TIER_SOLID[tier] }}
      className="relative z-[1]"
    />
  );
}

export default function BadgesGrid({
  allBadges,
  earnedBadges,
}: BadgesGridProps) {
  const [filter, setFilter] = useState<BadgeTier | "all">("all");

  const earnedMap = useMemo(
    () => new Map(earnedBadges.map((eb) => [eb.badge_id, eb])),
    [earnedBadges]
  );

  const sortedAndFilteredBadges = useMemo(() => {
    const filtered =
      filter === "all" ? allBadges : allBadges.filter((b) => b.tier === filter);

    return [...filtered].sort((a, b) => {
      const aEarned = earnedMap.has(a.id) ? 1 : 0;
      const bEarned = earnedMap.has(b.id) ? 1 : 0;
      return bEarned - aEarned;
    });
  }, [allBadges, filter, earnedMap]);

  const earnedCount = earnedBadges.length;
  const completionPercent =
    allBadges.length > 0 ? (earnedCount / allBadges.length) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5">
      <style>{`
        @keyframes legendary-shimmer {
          0% { transform: translateX(-150%) rotate(20deg); }
          100% { transform: translateX(150%) rotate(20deg); }
        }
        @keyframes epic-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(124,58,237,0.35); }
          50% { box-shadow: 0 0 18px rgba(124,58,237,0.65); }
        }
        .badge-legendary-shine::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -20%;
          width: 40%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.35),
            transparent
          );
          animation: legendary-shimmer 2.8s ease-in-out infinite;
        }
        .badge-epic-pulse {
          animation: epic-pulse 2.4s ease-in-out infinite;
        }
      `}</style>

      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <div>
            <h3 className="font-display font-bold text-text-primary text-sm">
              Trophy Case
            </h3>
            <p className="text-text-muted text-xs mt-0.5">
              {earnedCount} / {allBadges.length} unlocked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {TIER_FILTERS.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setFilter(tf.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === tf.value
                  ? "bg-[#7C3AED] text-white"
                  : "bg-white/5 text-text-muted hover:text-text-secondary"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #F59E0B, #7C3AED)" }}
          initial={{ width: 0 }}
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
        {sortedAndFilteredBadges.map((badge, i) => {
          const earnedRecord = earnedMap.get(badge.id);
          const isEarned = !!earnedRecord;
          const isNew = isEarned && isRecentlyEarned(earnedRecord?.earned_at);

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
              className="group relative flex flex-col items-center"
            >
              {isNew && (
                <span
                  className="absolute -top-1.5 -right-1.5 z-10 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold text-white"
                  style={{ background: "#EC4899" }}
                >
                  NEW
                </span>
              )}

              <div
                className={`relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all overflow-hidden ${
                  isEarned ? "" : "grayscale opacity-40"
                } ${isEarned && badge.tier === "legendary" ? "badge-legendary-shine" : ""} ${
                  isEarned && badge.tier === "epic" ? "badge-epic-pulse" : ""
                }`}
                style={{
                  background: isEarned
                    ? `radial-gradient(circle, ${TIER_GLOW[badge.tier]}, transparent 70%)`
                    : "rgba(255,255,255,0.03)",
                  border: isEarned
                    ? `1.5px solid ${TIER_GLOW[badge.tier]}`
                    : "1.5px solid rgba(255,255,255,0.08)",
                }}
              >
                {isEarned ? (
                  <BadgeIcon tier={badge.tier} size={36} />
                ) : (
                  <Lock size={17} className="text-text-muted relative z-[1]" />
                )}
              </div>

              {isEarned && (
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: TIER_SOLID[badge.tier] }}
                />
              )}

              <div className="pointer-events-none absolute bottom-full mb-2 hidden w-36 rounded-lg bg-[#0A0A12] border border-white/10 p-2.5 text-center shadow-xl group-hover:block z-20">
                <p className="text-xs font-semibold text-text-primary">
                  {isEarned ? badge.name : "???"}
                </p>
                {isEarned && badge.description && (
                  <p className="text-[10px] text-text-muted mt-1 leading-snug">
                    {badge.description}
                  </p>
                )}
                {isEarned && (
                  <p
                    className="text-[9px] font-mono uppercase mt-1 font-bold"
                    style={{ color: TIER_SOLID[badge.tier] }}
                  >
                    {badge.tier}
                  </p>
                )}
                {!isEarned && (
                  <p className="text-[10px] text-text-muted mt-1">
                    Not unlocked yet
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {sortedAndFilteredBadges.length === 0 && (
        <p className="text-text-muted text-xs text-center py-6">
          No badges in this category.
        </p>
      )}

      {allBadges.length > 0 && earnedCount === 0 && filter === "all" && (
        <p className="text-text-muted text-xs text-center mt-4 italic">
          Your Trophy Case is empty — start reading, writing, and engaging to earn your first badge!
        </p>
      )}
    </div>
  );
}