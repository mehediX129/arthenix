"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, Loader2 } from "lucide-react";
import { getFollowers, getFollowing } from "@/lib/db/follows";

type Tab = "followers" | "following";

interface UserItem {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: string;
}

interface Props {
  profileId: string;
  initialTab: Tab;
  followersCount: number;
  followingCount: number;
  onClose: () => void;
}

export default function FollowersModal({
  profileId,
  initialTab,
  followersCount,
  followingCount,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [f1, f2] = await Promise.all([
        getFollowers(profileId),
        getFollowing(profileId),
      ]);
      setFollowers(f1.data);
      setFollowing(f2.data);
      setLoading(false);
    }
    load();
  }, [profileId]);

  const list = tab === "followers" ? followers : following;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "rgba(15,15,25,0.98)",
            border: "1px solid rgba(124,58,237,0.25)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex gap-1">
              <button
                onClick={() => setTab("followers")}
                className="px-4 py-1.5 rounded-lg font-display font-bold text-sm transition-colors"
                style={{
                  background: tab === "followers" ? "rgba(124,58,237,0.2)" : "transparent",
                  color: tab === "followers" ? "#A78BFA" : "var(--text-muted)",
                }}
              >
                Followers
                <span className="ml-1.5 font-mono text-xs opacity-70">
                  {followersCount}
                </span>
              </button>
              <button
                onClick={() => setTab("following")}
                className="px-4 py-1.5 rounded-lg font-display font-bold text-sm transition-colors"
                style={{
                  background: tab === "following" ? "rgba(124,58,237,0.2)" : "transparent",
                  color: tab === "following" ? "#A78BFA" : "var(--text-muted)",
                }}
              >
                Following
                <span className="ml-1.5 font-mono text-xs opacity-70">
                  {followingCount}
                </span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-violet-400" />
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-text-muted text-sm">
                  {tab === "followers" ? "No followers yet" : "Not following anyone yet"}
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {list.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm text-violet-300"
                      style={{
                        background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))",
                        border: "1px solid rgba(124,58,237,0.3)",
                      }}
                    >
                      {(u.display_name ?? u.username).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary group-hover:text-violet-300 transition-colors truncate">
                        {u.display_name ?? u.username}
                      </p>
                      <p className="text-xs text-text-muted">
                        @{u.username} &middot; {u.level}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}