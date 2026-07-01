"use client";

import { useEffect, useState } from "react";
import { Loader2, Swords } from "lucide-react";
import { DailyQuestCard } from "./DailyQuestCard";
import { getTodayQuests, completeQuest } from "@/lib/db/quests";
import { useXPToastStore } from "@/store/xpToastStore";
import { useLevelUpStore } from "@/store/levelUpStore";
import type { UserQuestWithQuest } from "@/types/database";

interface DailyQuestPanelProps {
  userId: string;
  onXPAwarded?: (newXP: number) => void;
}

export function DailyQuestPanel({ userId, onXPAwarded }: DailyQuestPanelProps) {
  const [quests, setQuests] = useState<UserQuestWithQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const { addToast } = useXPToastStore();
  const { show: showLevelUp } = useLevelUpStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await getTodayQuests(userId);
      if (data) setQuests(data);
      setLoading(false);
    }
    load();
  }, [userId]);

  async function handleComplete(
    userQuestId: string,
    xp: number,
    title: string,
    icon: string
  ) {
    setCompleting(userQuestId);
    const { error, xpResult } = await completeQuest(userQuestId, userId, xp);

    if (!error) {
      setQuests((prev) =>
        prev.map((uq) =>
          uq.id === userQuestId
            ? { ...uq, completed: true, progress: uq.quest.target_count }
            : uq
        )
      );

      if (xpResult) {
        addToast(xp, `Quest complete: ${title}`, icon);
        onXPAwarded?.(xpResult.newXP);

        if (xpResult.leveledUp) {
          // Toast টা আগে একটু দেখা যাক, তারপর level-up celebration
          setTimeout(() => showLevelUp(xpResult.newLevel), 1200);
        }
      }
    }

    setCompleting(null);
  }

  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-yellow-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Daily Quests
          </h3>
        </div>
        {!loading && totalCount > 0 && (
          <span className="text-xs text-text-muted">
            {completedCount} / {totalCount} done
          </span>
        )}
      </div>

      {/* All complete banner */}
      {!loading && completedCount === totalCount && totalCount > 0 && (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-center">
          <p className="text-green-400 text-xs font-semibold">
            🎉 All quests complete for today! Come back tomorrow.
          </p>
        </div>
      )}

      {/* Progress bar */}
      {!loading && totalCount > 0 && (
        <div className="mb-4 h-1 rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Quest list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-text-muted" />
        </div>
      ) : (
        <div className="space-y-3">
          {quests.map((uq) => (
            <DailyQuestCard
              key={uq.id}
              userQuest={uq}
              onComplete={handleComplete}
              isCompleting={completing === uq.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}