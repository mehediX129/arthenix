"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, BookOpen, Flame } from "lucide-react";
import { getLevelColor } from "@/lib/utils/gamification";
import type { UserLevel } from "@/types/database";

interface StatsRowProps {
  xp: number;
  level: UserLevel;
  articlesRead: number;
  streakDays: number;
}

function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let startTime: number;
    let frameId: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export default function StatsRow({
  xp,
  level,
  articlesRead,
  streakDays,
}: StatsRowProps) {
  const levelColor = getLevelColor(level);

  const cards = [
    {
      icon: Zap,
      label: "XP Points",
      value: xp,
      color: levelColor,
    },
    {
      icon: BookOpen,
      label: "Articles Read",
      value: articlesRead,
      color: "#06B6D4",
    },
    {
      icon: Flame,
      label: "Day Streak",
      value: streakDays,
      color: "#F59E0B",
      emoji: "🔥",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
          className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-4 md:p-5"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl mb-3"
            style={{ backgroundColor: `${card.color}1A` }}
          >
            <card.icon size={18} style={{ color: card.color }} />
          </div>
          <p
            className="font-display font-black text-2xl md:text-3xl"
            style={{ color: card.color }}
          >
            <AnimatedNumber value={card.value} />
          </p>
          <p className="text-text-muted text-xs mt-1">{card.label}</p>
        </motion.div>
      ))}
    </div>
  );
}