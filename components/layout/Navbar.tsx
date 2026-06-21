"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Menu, X, ChevronDown } from "lucide-react";
import { worlds } from "@/lib/worlds-data";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [worldsOpen, setWorldsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: "rgba(10, 10, 18, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled
            ? "1px solid rgba(124, 58, 237, 0.3)"
            : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span
                className="font-display font-black text-2xl"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ARTHENIX
              </span>
            </Link>

            {/* Center — Worlds button */}
            <div className="hidden md:flex items-center gap-8">
              <div className="relative">
                <button
                  onMouseEnter={() => setWorldsOpen(true)}
                  onMouseLeave={() => setWorldsOpen(false)}
                  className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors duration-200 font-body font-medium"
                >
                  Worlds
                  <motion.div
                    animate={{ rotate: worldsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </button>

                {/* Mega Dropdown */}
                <AnimatePresence>
                  {worldsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setWorldsOpen(true)}
                      onMouseLeave={() => setWorldsOpen(false)}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] rounded-2xl p-4 z-50"
                      style={{
                        background: "rgba(18, 18, 31, 0.98)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(124, 58, 237, 0.2)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                      }}
                    >
                      <p className="font-mono text-xs text-text-muted mb-3 px-2">
                        EXPLORE WORLDS
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {worlds.map((world) => (
                          <Link
                            key={world.id}
                            href={`/worlds/${world.id}`}
                            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group hover:scale-[1.02]"
                            style={{
                              background: `${world.color}10`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${world.color}25`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = `${world.color}10`;
                            }}
                          >
                            <span className="text-xl">{world.emoji}</span>
                            <div>
                              <p
                                className="font-display font-bold text-sm text-text-primary"
                              >
                                {world.name}
                              </p>
                              <p className="font-mono text-xs text-text-muted">
                                {world.count}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/marketplace"
                className="text-text-secondary hover:text-text-primary transition-colors duration-200 font-body font-medium"
              >
                Marketplace
              </Link>
              <Link
                href="/community"
                className="text-text-secondary hover:text-text-primary transition-colors duration-200 font-body font-medium"
              >
                Community
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <button className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white hover:bg-opacity-5 transition-all duration-200">
                <Search size={18} />
              </button>

              {/* Bell */}
              <button className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white hover:bg-opacity-5 transition-all duration-200 relative">
                <Bell size={18} />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: "#EC4899" }}
                />
              </button>

              {/* Login Button */}
              <Link
                href="/login"
                className="hidden md:flex items-center px-4 py-2 rounded-lg font-display font-bold text-sm text-white transition-all duration-200 hover:scale-105 hover:shadow-glow-violet"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                }}
              >
                Sign In
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.7)" }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-80 overflow-y-auto"
              style={{
                background: "#12121F",
                borderRight: "1px solid rgba(124, 58, 237, 0.2)",
              }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-white border-opacity-5">
                <span
                  className="font-display font-black text-xl"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  ARTHENIX
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Worlds */}
              <div className="p-4">
                <p className="font-mono text-xs text-text-muted mb-3 px-2">
                  WORLDS
                </p>
                <div className="flex flex-col gap-1">
                  {worlds.map((world) => (
                    <Link
                      key={world.id}
                      href={`/worlds/${world.id}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                      style={{ background: `${world.color}10` }}
                    >
                      <span className="text-xl">{world.emoji}</span>
                      <div>
                        <p className="font-display font-bold text-sm text-text-primary">
                          {world.name}
                        </p>
                        <p className="font-mono text-xs text-text-muted">
                          {world.count}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Mobile Links */}
                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href="/marketplace"
                    onClick={() => setMobileOpen(false)}
                    className="p-3 rounded-xl text-text-secondary font-body font-medium hover:text-text-primary hover:bg-white hover:bg-opacity-5 transition-all"
                  >
                    🛒 Marketplace
                  </Link>
                  <Link
                    href="/community"
                    onClick={() => setMobileOpen(false)}
                    className="p-3 rounded-xl text-text-secondary font-body font-medium hover:text-text-primary hover:bg-white hover:bg-opacity-5 transition-all"
                  >
                    💬 Community
                  </Link>
                </div>

                {/* Mobile Sign In */}
                <div className="mt-6">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center w-full py-3 rounded-xl font-display font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                    }}
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}