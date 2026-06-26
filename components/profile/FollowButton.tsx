"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toggleFollow, getFollowState } from "@/lib/db/follows";

interface Props {
  profileId: string;
  initialFollowing?: boolean;
  onToggle?: (following: boolean) => void;
}

export default function FollowButton({ profileId, initialFollowing, onToggle }: Props) {
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [loading, setLoading] = useState(initialFollowing === undefined);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (initialFollowing !== undefined) return;
    getFollowState(profileId).then((state) => {
      setFollowing(state);
      setLoading(false);
    });
  }, [profileId, initialFollowing]);

  async function handleClick() {
    setLoading(true);
    const { following: newState } = await toggleFollow(profileId);
    setFollowing(newState);
    onToggle?.(newState);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-28 h-9 rounded-xl border border-white/10">
        <Loader2 size={14} className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileTap={{ scale: 0.96 }}
      className="flex items-center gap-2 px-5 py-2 rounded-xl font-display font-bold text-sm transition-all duration-200"
      style={
        following
          ? {
              background: hover ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
              border: hover ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)",
              color: hover ? "#F87171" : "var(--text-secondary)",
            }
          : {
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
              border: "1px solid transparent",
              color: "#ffffff",
            }
      }
    >
      {following ? (
        <>
          {hover ? <UserMinus size={14} /> : <UserMinus size={14} className="opacity-60" />}
          {hover ? "Unfollow" : "Following"}
        </>
      ) : (
        <>
          <UserPlus size={14} />
          Follow
        </>
      )}
    </motion.button>
  );
}