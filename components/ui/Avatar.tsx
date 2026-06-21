"use client";

import React from "react";
import Image from "next/image";
import { getInitials, getLevelColor, type UserLevel } from "@/lib/utils/gamification";

interface AvatarProps {
  src?: string | null;
  name: string;
  level?: UserLevel;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  showLevelBadge?: boolean;
}

const SIZE_CONFIG = {
  sm: { box: 32, text: "text-xs", dot: 8, badge: 14, badgeText: "text-[8px]" },
  md: { box: 44, text: "text-sm", dot: 10, badge: 18, badgeText: "text-[9px]" },
  lg: { box: 72, text: "text-xl", dot: 16, badge: 26, badgeText: "text-xs" },
} as const;

export default function Avatar({
  src,
  name,
  level,
  size = "md",
  online = false,
  showLevelBadge = false,
}: AvatarProps) {
  const config = SIZE_CONFIG[size];
  const initials = getInitials(name);
  const levelColor = level ? getLevelColor(level) : "#7C3AED";

  return (
    <div
      className="relative inline-flex shrink-0"
      style={{ width: config.box, height: config.box }}
    >
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] font-display font-bold text-white"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            width={config.box}
            height={config.box}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className={config.text}>{initials}</span>
        )}
      </div>

      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-primary-bg bg-emerald-500"
          style={{ width: config.dot, height: config.dot }}
        />
      )}

      {showLevelBadge && level && (
        <span
          className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-primary-bg font-bold text-white ${config.badgeText}`}
          style={{
            width: config.badge,
            height: config.badge,
            backgroundColor: levelColor,
          }}
          title={level}
        >
          {level === "Legend" ? "★" : level[0]}
        </span>
      )}
    </div>
  );
}