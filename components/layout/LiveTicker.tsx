"use client";

import React, { useState } from "react";

const tickerItems = [
  "🔥 Trending: The Simulation Hypothesis explained",
  "⚡ New Drop: Cyberpunk UI Kit — 40% off",
  "🎮 Gaming: Most broken builds in 2025",
  "🧠 Daily Challenge: The Monty Hall Problem",
  "⚔️ Anime: One Piece chapter 1120 breakdown",
  "🔭 Science: James Webb's latest discovery",
  "💻 Tech: GPT-5 architecture leaked",
  "🧬 Psychology: Why you self-sabotage",
  "➗ Math: The unsolved Riemann Hypothesis",
  "📚 Novels: Dostoevsky's hidden message",
];

export default function LiveTicker() {
  const [paused, setPaused] = useState(false);

  const tickerText = tickerItems.join("   |   ");

  return (
    <>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker 40s linear infinite;
        }
        .ticker-track.paused {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className="sticky top-16 z-40 flex items-center overflow-hidden"
        style={{
          background: "#12121F",
          borderBottom: "1px solid rgba(124,58,237,0.25)",
          height: "36px",
        }}
      >
        {/* LIVE badge */}
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 h-full"
          style={{
            borderRight: "1px solid rgba(124,58,237,0.25)",
            background: "rgba(124,58,237,0.1)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#EC4899" }}
          />
          <span
            className="font-mono font-bold text-xs tracking-widest"
            style={{ color: "#EC4899" }}
          >
            LIVE
          </span>
        </div>

        {/* Scrolling text */}
        <div
          className="flex-1 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className={`ticker-track${paused ? " paused" : ""} flex whitespace-nowrap`}
          >
            {/* Duplicate for seamless loop */}
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="font-mono text-xs px-8"
                style={{ color: "#94A3B8" }}
              >
                {tickerText}
              </span>
            ))}
          </div>
        </div>

        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
          style={{
            background: "linear-gradient(to left, #12121F, transparent)",
          }}
        />
      </div>
    </>
  );
}