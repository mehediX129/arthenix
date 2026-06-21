"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { worlds } from "@/lib/worlds-data";
import { TrendingUp, Users } from "lucide-react";

function WorldCard({
  world,
  large = false,
  index,
}: {
  world: (typeof worlds)[0];
  large?: boolean;
  index: number;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 15;
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 15;
    setTilt({ x, y });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className={large ? "col-span-2 row-span-2" : ""}
    >
      <Link href={`/worlds/${world.id}`}>
        <div
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setTilt({ x: 0, y: 0 });
          }}
          style={{
            background: `linear-gradient(145deg, ${world.color}18, #1A1A2E)`,
            border: hovered
              ? `1px solid ${world.color}60`
              : "1px solid rgba(255,255,255,0.05)",
            boxShadow: hovered ? `0 0 30px ${world.color}30` : "none",
            transform: hovered
              ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
              : "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
            borderRadius: "1rem",
            padding: large ? "2rem" : "1.5rem",
            height: large ? "100%" : "auto",
            minHeight: large ? "280px" : "160px",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top gradient bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: `linear-gradient(90deg, ${world.color}, transparent)`,
              opacity: hovered ? 1 : 0.5,
              transition: "opacity 0.3s",
            }}
          />

          {/* Glow orb */}
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: world.color,
              opacity: hovered ? 0.08 : 0.04,
              transition: "opacity 0.3s",
              filter: "blur(30px)",
            }}
          />

          {/* Emoji icon */}
          <div
            style={{
              fontSize: large ? "3rem" : "2rem",
              marginBottom: "0.75rem",
              filter: hovered ? "drop-shadow(0 0 8px " + world.color + ")" : "none",
              transition: "filter 0.3s",
            }}
          >
            {world.emoji}
          </div>

          {/* Name */}
          <h3
            className="font-display font-bold"
            style={{
              fontSize: large ? "1.5rem" : "1.1rem",
              color: "#F8FAFC",
              marginBottom: "0.4rem",
            }}
          >
            {world.name}
          </h3>

          {/* Tagline */}
          <p
            className="font-body"
            style={{
              fontSize: large ? "0.95rem" : "0.8rem",
              color: "#94A3B8",
              marginBottom: "1rem",
              lineHeight: 1.5,
            }}
          >
            {world.tagline}
          </p>

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            {/* Count */}
            <div className="flex items-center gap-1.5">
              <Users
                size={12}
                style={{ color: world.color }}
              />
              <span
                className="font-mono font-bold"
                style={{
                  fontSize: "0.75rem",
                  color: world.color,
                }}
              >
                {world.count}
              </span>
            </div>

            {/* Trending */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{
                background: `${world.color}15`,
                border: `1px solid ${world.color}30`,
                maxWidth: large ? "none" : "120px",
              }}
            >
              <TrendingUp size={10} style={{ color: world.color }} />
              <span
                className="font-mono truncate"
                style={{
                  fontSize: "0.65rem",
                  color: world.color,
                }}
              >
                {world.trending}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function WorldsGrid() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <p
          className="font-mono text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: "#06B6D4" }}
        >
          CHOOSE YOUR WORLD
        </p>
        <h2
          className="font-display font-black"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            background: "linear-gradient(135deg, #F8FAFC, #94A3B8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          12 Universes of Knowledge
        </h2>
        <p
          className="font-body mt-3 max-w-xl mx-auto"
          style={{ color: "#94A3B8" }}
        >
          Each world is a deep rabbit hole. Pick your obsession.
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gridAutoRows: "160px",
        }}
      >
        {/* Large cards — index 0 and 3 */}
        {worlds.map((world, index) => (
          <WorldCard
            key={world.id}
            world={world}
            large={index === 0 || index === 5}
            index={index}
          />
        ))}
      </div>

      {/* Mobile grid override */}
      <style>{`
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: 1fr !important;
            grid-auto-rows: auto !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1024px) {
          .grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}