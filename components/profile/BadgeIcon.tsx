"use client";

import React from "react";
import type { BadgeTier } from "@/types/database";

interface BadgeIconProps {
  tier: BadgeTier;
  size?: number;
}

export default function BadgeIcon({ tier, size = 32 }: BadgeIconProps) {
  switch (tier) {
    case "legendary":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="legendGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect
              key={i}
              x="23"
              y="1"
              width="2"
              height="7"
              rx="1"
              fill="#FCD34D"
              opacity="0.8"
              transform={`rotate(${i * 45} 24 24)`}
            />
          ))}
          <path
            d="M24 8 L36 12 V22 C36 31 31 36 24 40 C17 36 12 31 12 22 V12 Z"
            fill="url(#legendGold)"
            stroke="#B45309"
            strokeWidth="1.5"
          />
          <path
            d="M17 12 L19 6 L24 10 L29 6 L31 12 Z"
            fill="#FDE68A"
            stroke="#B45309"
            strokeWidth="1"
          />
          <circle cx="24" cy="23" r="6" fill="#B45309" opacity="0.3" />
          <path d="M24 18 L28 23 L24 28 L20 23 Z" fill="#FFFBEB" />
        </svg>
      );

    case "epic":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="epicViolet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <path d="M12 20 C6 20 4 16 4 13 C8 13 12 15 12 20Z" fill="#A78BFA" opacity="0.7" />
          <path d="M36 20 C42 20 44 16 44 13 C40 13 36 15 36 20Z" fill="#A78BFA" opacity="0.7" />
          <path
            d="M24 7 L37 12 V23 C37 32 31 37 24 41 C17 37 11 32 11 23 V12 Z"
            fill="url(#epicViolet)"
            stroke="#5B21B6"
            strokeWidth="1.5"
          />
          <circle cx="24" cy="23" r="7" fill="#5B21B6" opacity="0.35" />
          <path d="M24 17 L29 23 L24 29 L19 23 Z" fill="#EDE9FE" />
          <path d="M24 17 L29 23 L24 23 Z" fill="#DDD6FE" />
        </svg>
      );

    case "rare":
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="rareCyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A5F3FC" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <path
            d="M24 6 L38 14 V30 L24 42 L10 30 V14 Z"
            fill="url(#rareCyan)"
            stroke="#0E7490"
            strokeWidth="1.5"
          />
          <path d="M24 18 L30 24 L24 30 L18 24 Z" fill="#ECFEFF" />
        </svg>
      );

    case "common":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="commonGrey" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="22" r="16" fill="url(#commonGrey)" stroke="#64748B" strokeWidth="1.5" />
          <path d="M24 34 L18 42 L24 38 L30 42 Z" fill="#94A3B8" stroke="#64748B" strokeWidth="1" />
          <path
            d="M24 14 L26 19.5 L32 19.5 L27 23 L29 28.5 L24 25 L19 28.5 L21 23 L16 19.5 L22 19.5 Z"
            fill="#F1F5F9"
          />
        </svg>
      );
  }
}