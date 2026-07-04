"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Edit } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import LevelProgressBar from "./LevelProgressBar";
import FollowButton from "./FollowButton";
import FollowersModal from "./FollowersModal";
import type { Profile } from "@/types/database";

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  selectedWorldNames: string[];
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  selectedWorldNames,
}: ProfileHeaderProps) {
  const [modalTab, setModalTab] = useState<"followers" | "following" | null>(null);

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const followersCount = profile.followers_count ?? 0;
  const followingCount = profile.following_count ?? 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-6 md:p-8"
      >
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
          {/* Avatar */}
          <div className="shrink-0">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name ?? profile.username}
              level={profile.level}
              size="lg"
              showLevelBadge
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-black text-2xl md:text-3xl text-text-primary">
                    {profile.display_name ?? profile.username}
                  </h1>
                </div>
                <p className="text-text-muted text-sm mt-0.5">
                  @{profile.username}
                </p>
              </div>

              {/* Action button */}
              {isOwnProfile ? (
                <a href="/profile/edit"
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-secondary-bg px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <Edit size={14} />
                  Edit Profile
                </a>
              ) : (
                <FollowButton profileId={profile.id} />
              )}
            </div>

            {/* Bio */}
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
          </div>
        </div>

        {/* Level progress */}
        <div className="mt-6">
          <LevelProgressBar xp={profile.xp} />
        </div>
      </motion.div>

      {/* Followers/Following modal */}
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