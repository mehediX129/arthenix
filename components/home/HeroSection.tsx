"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const particles = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  size: Math.random() * 5 + 2,
  left: Math.random() * 100,
  top: Math.random() * 100,
  color: ["#7C3AED", "#06B6D4", "#EC4899", "#F59E0B", "#10B981"][
    Math.floor(Math.random() * 5)
  ],
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 4,
  moveX: (Math.random() - 0.5) * 80,
  moveY: (Math.random() - 0.5) * 80,
}));

function CountUp({ end, duration = 2 }: { end: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const numeric = parseFloat(end.replace(/[^0-9.]/g, ""));
  const suffix = end.replace(/[0-9.]/g, "");

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numeric * 10) / 10);
      if (progress < 1) requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => requestAnimationFrame(animate), 800);
    return () => clearTimeout(timer);
  }, [numeric, duration]);

  return (
    <span>
      {count % 1 === 0 ? count.toFixed(0) : count.toFixed(1)}
      {suffix}
    </span>
  );
}

const stats = [
  { value: "2.4M+", label: "Articles" },
  { value: "847K", label: "Gamers" },
  { value: "1.2M+", label: "Learners" },
  { value: "156K", label: "Products" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeInOut" as const },
  },
};

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ paddingTop: "64px" }}
    >
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full opacity-40"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              backgroundColor: p.color,
            }}
            animate={{
              x: [0, p.moveX, 0],
              y: [0, p.moveY, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          />
        ))}
      </div>

      {/* Gradient blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(236,72,153,0.08) 0%, transparent 50%)",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow */}
        <motion.p
          variants={itemVariants}
          className="font-mono text-xs tracking-[0.4em] uppercase mb-6"
          style={{ color: "#06B6D4" }}
        >
          THE UNIVERSE OF HUMAN KNOWLEDGE
        </motion.p>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="font-display font-black leading-[1.05] mb-8"
          style={{ fontSize: "clamp(2.8rem, 8vw, 7rem)" }}
        >
          <span
            style={{
              background:
                "linear-gradient(135deg, #7C3AED 0%, #06B6D4 50%, #EC4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Explore. Learn.
            <br />
            Create. Trade.
            <br />
            Evolve.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="font-body text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          12 worlds. Infinite depth. Zero limits.{" "}
          <span style={{ color: "#F8FAFC" }}>
            Arthenix is where Gen Z gets serious.
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-xl font-display font-bold text-white text-lg"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
              boxShadow: "0 0 30px rgba(124,58,237,0.3)",
            }}
          >
            🚀 Enter the Universe
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgba(124,58,237,0.15)",
            }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-xl font-display font-bold text-lg transition-colors"
            style={{
              border: "2px solid #7C3AED",
              color: "#F8FAFC",
              background: "transparent",
            }}
          >
            🎯 Browse Marketplace
          </motion.button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="mb-8">
          <div
            className="h-px max-w-sm mx-auto"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)",
            }}
          />
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-10"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p
                className="font-mono font-bold text-2xl md:text-3xl"
                style={{ color: "#06B6D4" }}
              >
                <CountUp end={stat.value} duration={2} />
              </p>
              <p
                className="font-body text-sm mt-1"
                style={{ color: "#475569" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #0A0A12, transparent)",
        }}
      />
    </section>
  );
}