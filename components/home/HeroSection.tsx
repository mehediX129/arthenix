"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getPlatformStats, type PlatformStats } from "@/lib/db/platform-stats";

const colors = ["#7C3AED", "#06B6D4", "#EC4899", "#F59E0B", "#10B981"];
const particles = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  size: 2 + (i * 3) % 5,
  left: (i * 17 + 5) % 100,
  top: (i * 31 + 7) % 100,
  color: colors[i % colors.length],
  duration: 6 + (i * 0.4) % 8,
  delay: (i * 0.3) % 4,
  moveX: (((i * 23) % 80) - 40),
  moveY: (((i * 19) % 80) - 40),
}));

function CountUp({ end, duration = 1.4 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let frameId: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [end, duration]);

  return <>{count.toLocaleString()}</>;
}

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
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    getPlatformStats().then(setStats);
  }, []);

  const statItems = stats
    ? [
        { value: stats.articles, label: "Articles Published" },
        { value: stats.members, label: "Members" },
        { value: stats.worlds, label: "Worlds to Explore" },
      ]
    : [];

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ paddingTop: "64px" }}
    >
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

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(236,72,153,0.08) 0%, transparent 50%)",
        }}
      />

      <motion.div
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          variants={itemVariants}
          className="font-mono text-xs tracking-[0.4em] uppercase mb-6"
          style={{ color: "#06B6D4" }}
        >
          A HOME FOR CURIOUS MINDS
        </motion.p>

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
            Create. Evolve.
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="font-body text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          Read and write articles across 10 knowledge worlds, join the
          community, and{" "}
          <span style={{ color: "#F8FAFC" }}>
            level up as you learn.
          </span>
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl font-display font-bold text-white text-lg w-full"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                boxShadow: "0 0 30px rgba(124,58,237,0.3)",
              }}
            >
              🚀 Join Arthenix
            </motion.button>
          </Link>

          <Link href="/worlds/gaming">
            <motion.button
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(124,58,237,0.15)",
              }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl font-display font-bold text-lg transition-colors w-full"
              style={{
                border: "2px solid #7C3AED",
                color: "#F8FAFC",
                background: "transparent",
              }}
            >
              🧭 Explore Worlds
            </motion.button>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <div
            className="h-px max-w-sm mx-auto"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)",
            }}
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-10"
        >
          {statItems.map((stat, i) => (
            <div key={i} className="text-center">
              <p
                className="font-mono font-bold text-2xl md:text-3xl"
                style={{ color: "#06B6D4" }}
              >
                <CountUp end={stat.value} />
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