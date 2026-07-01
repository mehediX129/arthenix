"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";

interface AchievementUnlockModalProps {
  isOpen: boolean;
  badgeName: string;
  badgeDescription: string;
  onContinue: () => void;
}

function Confetti() {
  const colors = ["#7C3AED", "#06B6D4", "#F59E0B", "#EC4899", "#10B981"];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${(i * 37 + 11) % 100}%`,
    delay: (i * 0.07) % 0.6,
    duration: 1.2 + ((i * 0.05) % 1),
    size: 6 + ((i * 3) % 8),
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

export default function AchievementUnlockModal({
  isOpen,
  badgeName,
  badgeDescription,
  onContinue,
}: AchievementUnlockModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden text-center px-8 py-10"
          >
            {mounted && <Confetti />}

            <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
                className="absolute inset-0 rounded-full bg-[#F59E0B]/20 blur-xl"
              />
              <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#EC4899] flex items-center justify-center shadow-lg">
                <Trophy size={32} className="text-black" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-1">
                Achievement Unlocked
              </p>
              <h2 className="text-2xl font-black text-text-primary mb-2">
                {badgeName}
              </h2>
              <p className="text-sm text-text-muted">{badgeDescription}</p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onContinue}
              className="mt-8 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-bold text-white transition-all hover:opacity-90"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}