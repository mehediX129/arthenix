"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Zap, ShoppingBag, Users, Search } from "lucide-react";

interface OnboardingTourProps {
  onComplete: () => void;
}

interface TourSlide {
  icon: React.ElementType;
  badge: string;
  title: string;
  description: string;
  color: string;
}

const SLIDES: TourSlide[] = [
  {
    icon: Sparkles,
    badge: "01 — Worlds",
    title: "Every world, one feed.",
    description:
      "Your selected worlds power a personalized feed of articles, trends, and top contributors — switch worlds anytime from the navbar.",
    color: "#7C3AED",
  },
  {
    icon: Zap,
    badge: "02 — Progress",
    title: "Earn XP, level up.",
    description:
      "Reading, posting, and engaging earns XP. Climb from Novice to Legend, unlock badges, and keep your daily streak alive.",
    color: "#F59E0B",
  },
  {
    icon: Users,
    badge: "03 — Community",
    title: "Follow. Discuss. Grow.",
    description:
      "Follow creators whose work you love, join the conversation in comments, and build your own audience as you publish.",
    color: "#EC4899",
  },
  {
    icon: ShoppingBag,
    badge: "04 — Marketplace",
    title: "Trade knowledge assets.",
    description:
      "Buy and sell guides, templates, and digital goods in the Marketplace — with price history and verified seller reviews.",
    color: "#10B981",
  },
  {
    icon: Search,
    badge: "05 — Search",
    title: "Find anything, instantly.",
    description:
      "Press Ctrl+K anywhere to search articles, products, and people across the entire Arthenix universe.",
    color: "#06B6D4",
  },
];

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const Icon = slide.icon;

  function next() {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((i) => i + 1);
  }

  function skip() {
    onComplete();
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-primary-bg px-4 py-16">
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-20 blur-[140px] transition-colors duration-500"
        style={{ background: slide.color }}
      />

      <button
        type="button"
        onClick={skip}
        className="absolute top-6 right-6 z-20 text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
      >
        Skip tour
      </button>

      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" as const }}
            className="rounded-2xl border border-white/10 bg-card-bg/70 backdrop-blur-xl p-8 text-center"
          >
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: `${slide.color}1A`,
                border: `1.5px solid ${slide.color}50`,
              }}
            >
              <Icon size={26} style={{ color: slide.color }} />
            </div>

            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: slide.color }}
            >
              {slide.badge}
            </span>

            <h2 className="font-display text-2xl md:text-3xl font-black text-text-primary mt-2">
              {slide.title}
            </h2>

            <p className="text-text-secondary text-sm mt-3 leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 mt-8">
          {SLIDES.map((s, i) => (
            <button
              key={s.badge}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 24 : 8,
                backgroundColor: i === index ? slide.color : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.6)]"
          >
            {isLast ? "Finish" : "Next"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}