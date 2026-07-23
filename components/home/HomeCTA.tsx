"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { PenSquare, ShoppingBag, Zap } from "lucide-react";

export default function HomeCTA() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.1) 100%)",
          border: "1px solid rgba(124,58,237,0.25)",
        }}
      >
        {/* Glow orbs */}
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "#7C3AED" }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "#06B6D4" }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap size={16} className="text-amber-400" />
            <span className="font-mono text-xs text-text-muted">JOIN THE UNIVERSE</span>
          </div>

          <h2 className="font-display font-black text-3xl md:text-5xl text-text-primary mb-4 leading-tight">
            Ready to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Evolve?
            </span>
          </h2>

          <p className="text-text-secondary text-lg max-w-xl mx-auto mb-10">
            Write articles, join community discussions, and level up across
            10 knowledge worlds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/write"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-display font-bold text-white transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                boxShadow: "0 8px 32px rgba(124,58,237,0.3)",
              }}
            >
              <PenSquare size={16} />
              Start Writing
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-display font-bold transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-primary)",
              }}
            >
              <ShoppingBag size={16} />
              Browse Marketplace
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}