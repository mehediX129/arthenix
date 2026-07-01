"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import StatsRow from "@/components/profile/StatsRow";
import WorldAffinityChart from "@/components/profile/WorldAffinityChart";
import BadgesGrid from "@/components/profile/BadgesGrid";
import ActivityFeed from "@/components/profile/ActivityFeed";
import { DailyQuestPanel } from "@/components/gamification/DailyQuestPanel";
import {
  getProfileByUsername,
  getUserBadges,
  getWorldAffinity,
} from "@/lib/db/profiles";
import { getAllBadges } from "@/lib/db/badges";
import { useUser } from "@/hooks/useUser";
import { worlds } from "@/lib/worlds-data";
import { StreakCard } from "@/components/gamification/StreakCard";
import { ActivityHeatmap } from "@/components/gamification/ActivityHeatmap";
import { getArticlesReadCount } from "@/lib/db/articles";

import type {
  Profile,
  Badge,
  UserBadgeWithBadge,
  WorldAffinity,
} from "@/types/database";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useUser();
  const [articlesRead, setArticlesRead] = useState(0);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadgeWithBadge[]>([]);
  const [affinityData, setAffinityData] = useState<WorldAffinity[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const profileResult = await getProfileByUsername(username);

      if (!profileResult.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const p = profileResult.data;
      setProfile(p);

      const [badgesAllResult, earnedResult, affinityResult, readCount] =
        await Promise.all([
          getAllBadges(),
          getUserBadges(p.id),
          getWorldAffinity(p.id),
          getArticlesReadCount(p.id),
        ]);

      if (badgesAllResult.data) setAllBadges(badgesAllResult.data);
      if (earnedResult.data) setEarnedBadges(earnedResult.data);
      if (affinityResult.data) setAffinityData(affinityResult.data);
      setArticlesRead(readCount);

      setLoading(false);
    }

    if (username) load();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <Loader2 size={28} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary-bg px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Profile not found
        </h1>
        <p className="text-text-muted text-sm mt-2">
          This user does not exist or their profile is private.
        </p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  const selectedWorldNames = worlds
    .filter((w) => profile.selected_worlds.includes(w.id))
    .map((w) => `${w.emoji} ${w.name.split(" ")[0]}`);



  return (
    <div className="min-h-screen bg-primary-bg px-4 py-8 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          selectedWorldNames={selectedWorldNames}
        />

        <StatsRow
          xp={profile.xp}
          level={profile.level}
          articlesRead={articlesRead}
          streakDays={profile.streak_days}
          isSeller={profile.is_seller}
        />

        {isOwnProfile && (
          <>
            <DailyQuestPanel
              userId={profile.id}
              onXPAwarded={(newXP) =>
                setProfile((prev) => (prev ? { ...prev, xp: newXP } : prev))
              }
            />
            <StreakCard
              userId={profile.id}
              initialStreakDays={profile.streak_days ?? 0}
              initialFreezeCount={profile.freeze_count ?? 2}
            />
          </>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <WorldAffinityChart affinityData={affinityData} />
          <BadgesGrid allBadges={allBadges} earnedBadges={earnedBadges} />
        </div>
        <ActivityHeatmap userId={profile.id} />

        <ActivityFeed userId={profile.id} />
      </div>
    </div>
  );
}
