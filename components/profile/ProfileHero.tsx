"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Edit, Globe } from "lucide-react";
import Image from "next/image";
import FollowButton from "./FollowButton";
import FollowersModal from "./FollowersModal";
import { getInitials, getLevelColor, getProgressToNextLevel } from "@/lib/utils/gamification";
import type { Profile } from "@/types/database";

interface ProfileHeroProps {
  profile: Profile;
  isOwnProfile: boolean;
  selectedWorldNames: string[];
}

const RING_SIZE = 116;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function XIcon() {
  return <span className="text-[13px] font-bold leading-none">𝕏</span>;
}

function GithubIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.08.78 2.17 0 1.56-.02 2.83-.02 3.22 0 .31.21.67.8.56A10.98 10.98 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

export default function ProfileHero({
  profile,
  isOwnProfile,
  selectedWorldNames,
}: ProfileHeroProps) {
  const [modalTab, setModalTab] = useState<"followers" | "following" | null>(null);

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const followersCount = profile.followers_count ?? 0;
  const followingCount = profile.following_count ?? 0;
  const levelColor = getLevelColor(profile.level);
  const { percentage, nextLevel, xpNeededForNext } = getProgressToNextLevel(profile.xp);

  const ringOffset = RING_CIRCUMFERENCE - (percentage / 100) * RING_CIRCUMFERENCE;

  const socialLinks = [
    profile.twitter_url && { href: profile.twitter_url, icon: <XIcon />, label: "X" },
    profile.github_url && { href: profile.github_url, icon: <GithubIcon />, label: "GitHub" },
    profile.linkedin_url && { href: profile.linkedin_url, icon: <LinkedinIcon />, label: "LinkedIn" },
    profile.website_url && { href: profile.website_url, icon: <Globe size={13} />, label: "Website" },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl overflow-hidden border border-white/10"
      >
        {/* Tier-gradient banner background */}
        <div
          className="absolute inset-0 h-28"
          style={{
            background: `linear-gradient(135deg, ${levelColor}35, ${levelColor}08 60%, transparent)`,
          }}
        />
        <div
          className="absolute inset-0 h-28 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)",
          }}
        />

        <div className="relative bg-card-bg/60 backdrop-blur-sm p-6 md:p-8 pt-16 md:pt-16">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
            {/* Avatar + animated XP ring, pulled up to overlap the banner */}
            <div
              className="relative shrink-0 -mt-16 md:-mt-16"
              style={{ width: RING_SIZE, height: RING_SIZE }}
            >
              <svg
                width={RING_SIZE}
                height={RING_SIZE}
                className="absolute inset-0 -rotate-90"
                style={{ filter: `drop-shadow(0 0 6px ${levelColor}70)` }}
              >
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={RING_STROKE}
                />
                <motion.circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  stroke={levelColor}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
                />
              </svg>

              <div
                className="absolute rounded-full overflow-hidden flex items-center justify-center font-display font-black text-2xl text-white bg-gradient-to-br from-[#7C3AED] to-[#06B6D4]"
                style={{
                  inset: RING_STROKE + 4,
                }}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name ?? profile.username}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(profile.display_name ?? profile.username)
                )}
              </div>

              {/* Level tier chip */}
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold whitespace-nowrap"
                style={{
                  background: levelColor,
                  color: "#0A0A12",
                }}
              >
                {String(profile.level ?? "Novice").toUpperCase()}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 sm:pt-2">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display font-black text-2xl md:text-3xl text-text-primary">
                      {profile.display_name ?? profile.username}
                    </h1>
                    {profile.pronouns && (
                      <span className="text-text-muted text-sm font-body">
                        {profile.pronouns}
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted text-sm mt-0.5">
                    @{profile.username}
                  </p>
                </div>

                {isOwnProfile ? (
                  <a
                    href="/profile/edit"
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-secondary-bg px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                  >
                    <Edit size={14} />
                    Edit Profile
                  </a>
                ) : (
                  <FollowButton profileId={profile.id} />
                )}
              </div>

              {profile.bio && (
                <p className="text-text-secondary text-sm mt-3 leading-relaxed max-w-lg">
                  {profile.bio}
                </p>
              )}

              {/* Followers / Following counts */}
              <div className="flex items-center gap-5 mt-4">
                <button
                  onClick={() => setModalTab("followers")}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <span className="font-display font-black text-lg text-text-primary">
                    {followersCount.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs text-text-muted">Followers</span>
                </button>
                <div className="w-px h-4 bg-white/10" />
                <button
                  onClick={() => setModalTab("following")}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <span className="font-display font-black text-lg text-text-primary">
                    {followingCount.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs text-text-muted">Following</span>
                </button>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-text-muted">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Joined {joinedDate}
                </span>
              </div>

              {/* Social links */}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={link.label}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted bg-white/5 hover:bg-white/10 hover:text-text-primary transition-colors"
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              )}

              {/* Selected worlds */}
              {selectedWorldNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {selectedWorldNames.map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] text-text-secondary"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}

              {/* XP progress to next level */}
              <div className="mt-5 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: levelColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <span className="font-mono text-[11px] text-text-muted whitespace-nowrap">
                  {nextLevel
                    ? `${xpNeededForNext} XP to ${nextLevel}`
                    : "Max level reached"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {modalTab && (
        <FollowersModal
          profileId={profile.id}
          initialTab={modalTab}
          followersCount={followersCount}
          followingCount={followingCount}
          onClose={() => setModalTab(null)}
        />
      )}
    </>
  );
}