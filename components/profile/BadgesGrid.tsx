"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Lock } from "lucide-react";
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

export default function BadgesGrid({
  allBadges,
  earnedBadges,
}: BadgesGridProps) {
  const [filter, setFilter] = useState<BadgeTier | "all">("all");

  const earnedIds = useMemo(
    () => new Set(earnedBadges.map((eb) => eb.badge_id)),
    [earnedBadges]
  );

  const filteredBadges = useMemo(() => {
    if (filter === "all") return allBadges;
    return allBadges.filter((b) => b.tier === filter);
  }, [allBadges, filter]);

  const earnedCount = earnedBadges.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-text-primary text-sm">
            Achievements
          </h3>
          <p className="text-text-muted text-xs mt-0.5">
            {earnedCount} / {allBadges.length} earned
          </p>
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

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
        {filteredBadges.map((badge, i) => {
          const isEarned = earnedIds.has(badge.id);

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
              className="group relative flex flex-col items-center"
            >
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all overflow-hidden ${
                  isEarned ? "" : "grayscale opacity-40"
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
                {badge.icon_url ? (
                  <Image
                    src={badge.icon_url}
                    alt={badge.name}
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                ) : isEarned ? (
                  <span className="text-xl">🏆</span>
                ) : (
                  <Lock size={16} className="text-text-muted" />
                )}
              </div>

              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-2 hidden w-36 rounded-lg bg-[#0A0A12] border border-white/10 p-2.5 text-center shadow-xl group-hover:block z-10">
                <p className="text-xs font-semibold text-text-primary">
                  {isEarned ? badge.name : "???"}
                </p>
                {isEarned && badge.description && (
                  <p className="text-[10px] text-text-muted mt-1 leading-snug">
                    {badge.description}
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

      {filteredBadges.length === 0 && (
        <p className="text-text-muted text-xs text-center py-6">
          No badges in this category.
        </p>
      )}
    </div>
  );
}