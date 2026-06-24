"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Star } from "lucide-react";
import { useLevelUpStore } from "@/store/levelUpStore";

function Confetti() {
  const colors = ["#facc15", "#a78bfa", "#34d399", "#60a5fa", "#f472b6"];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${((i * 37 + 11) % 100)}%`,
    delay: (i * 0.07) % 0.6,
    duration: 1.2 + (i * 0.05) % 1,
    size: 6 + (i * 3) % 8,
    isCircle: i % 2 === 0,
    xOffset: ((i * 23) % 200) - 100,
    rotation: (i * 47) % 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 500, x: p.xOffset, opacity: 0, rotate: p.rotation }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" as const }}
          style={{
            position: "absolute",
            top: 0,
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

export function LevelUpModal() {
  const { isOpen, newLevel, hide } = useLevelUpStore();
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(hide, 6000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hide]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") hide();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hide]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={hide}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden text-center px-8 py-10"
          >
            {mounted && <Confetti />}

            {/* Close button */}
            <button
              ref={closeRef}
              onClick={hide}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>

            {/* Glow ring */}
            <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
                className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl"
              />
              <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-black font-black text-2xl">
                  {isNaN(newLevel) ? "?" : newLevel}
                </span>
              </div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-1">
                Level Up!
              </p>
              <h2 className="text-2xl font-black text-text-primary mb-2">
                You reached Level {isNaN(newLevel) ? "?" : newLevel}
              </h2>
              <p className="text-sm text-text-muted">
                Keep exploring, earning XP, and completing quests to unlock new rewards.
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-6 flex items-center justify-center gap-6"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center">
                  <Zap size={14} className="text-yellow-400" />
                </div>
                <span className="text-xs text-text-muted">More XP</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-purple-400/10 flex items-center justify-center">
                  <Star size={14} className="text-purple-400" />
                </div>
                <span className="text-xs text-text-muted">New Badges</span>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={hide}
              className="mt-6 w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold transition-colors"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}