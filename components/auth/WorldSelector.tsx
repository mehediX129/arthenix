"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { worlds } from "@/lib/worlds-data";

interface WorldSelectorProps {
  onComplete: (selectedIds: string[]) => void;
  loading?: boolean;
}

const MIN_SELECTION = 3;

export default function WorldSelector({
  onComplete,
  loading = false,
}: WorldSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleWorld(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  }

  const canContinue = selected.length >= MIN_SELECTION;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-primary-bg px-4 py-16">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-20 blur-[140px]"
        style={{ background: "#7C3AED" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center mb-10 max-w-xl"
      >
        <h1 className="font-display text-4xl md:text-5xl font-black bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#06B6D4] bg-clip-text text-transparent">
          Choose your worlds.
        </h1>
        <p className="text-text-secondary mt-3 text-base">
          Pick at least {MIN_SELECTION} that excite you.
        </p>
      </motion.div>

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl w-full mb-10">
        {worlds.map((world, i) => {
          const isSelected = selected.includes(world.id);
          return (
            <motion.button
              key={world.id}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggleWorld(world.id)}
              className="relative rounded-xl p-4 text-left transition-all border-2 bg-card-bg/60 backdrop-blur-sm"
              style={{
                borderColor: isSelected ? world.color : "rgba(255,255,255,0.08)",
                boxShadow: isSelected
                  ? `0 0 24px -4px ${world.color}80`
                  : "none",
              }}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: world.color }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-3xl mb-2">{world.emoji}</div>
              <div className="font-display font-bold text-sm text-text-primary leading-tight">
                {world.name}
              </div>
              <div className="text-xs text-text-muted mt-1 line-clamp-2">
                {world.tagline}
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 flex flex-col items-center gap-3"
      >
        <span className="text-xs text-text-muted">
          {selected.length} / {MIN_SELECTION}+ selected
        </span>
        <button
          type="button"
          disabled={!canContinue || loading}
          onClick={() => onComplete(selected)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.6)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}