"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { worlds } from "@/lib/worlds-data";

interface WelcomeScreenProps {
  userName: string;
  selectedWorldIds: string[];
  onStart: () => void;
}

export default function WelcomeScreen({
  userName,
  selectedWorldIds,
  onStart,
}: WelcomeScreenProps) {
  const selectedWorlds = worlds.filter((w) => selectedWorldIds.includes(w.id));

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-primary-bg px-4">
      {/* Celebratory ambient glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full opacity-25 blur-[160px]"
        style={{ background: "#7C3AED" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="font-display text-4xl md:text-6xl font-black text-text-primary"
        >
          You&apos;re in,{" "}
          <span className="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] bg-clip-text text-transparent">
            {userName}
          </span>
          .
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-text-secondary mt-4 text-lg"
        >
          Your {selectedWorlds.length} worlds are ready to explore.
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-10 max-w-md mx-auto">
          {selectedWorlds.map((world, i) => (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, scale: 0, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                delay: 0.5 + i * 0.08,
                duration: 0.4,
                type: "spring",
                stiffness: 200,
              }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
              style={{
                backgroundColor: `${world.color}1A`,
                border: `1.5px solid ${world.color}50`,
              }}
            >
              {world.emoji}
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + selectedWorlds.length * 0.08 + 0.2 }}
          onClick={onStart}
          className="mt-12 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_30px_-6px_rgba(124,58,237,0.7)]"
        >
          Start Exploring
          <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
}