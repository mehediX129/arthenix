"use client";

import { useEffect, useState } from "react";
import { Loader2, Swords } from "lucide-react";
import { DailyQuestCard } from "./DailyQuestCard";
import { getTodayQuests, recalculateQuestProgress } from "@/lib/db/quests";
import type { CompletedQuestInfo } from "@/lib/db/quests";
import { useXPToastStore } from "@/store/xpToastStore";
import { useLevelUpStore } from "@/store/levelUpStore";
import type { UserQuestWithQuest, UserLevel } from "@/types/database";

interface DailyQuestPanelProps {
  userId: string;
  onXPAwarded?: (newXP: number) => void;
}

export function DailyQuestPanel({ userId, onXPAwarded }: DailyQuestPanelProps) {
  const [quests, setQuests] = useState<UserQuestWithQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useXPToastStore();
  const { show: showLevelUp } = useLevelUpStore();

  useEffect(() => {
    async function load() {
      setLoading(true);

      // ১. আজকের quest assignment fetch/create করা
      const { data: assigned } = await getTodayQuests(userId);

      // ২. Real action data (like/read/publish/visit) থেকে progress
      //    server-side recalculate করা — এখানেই আসল automation ঘটে,
      //    কোনো manual click লাগে না
      const { data: newlyCompleted } = await recalculateQuestProgress(userId);

      // ৩. আপডেট হওয়া quest list আবার fetch করা, যাতে UI তে সঠিক
      //    progress/completed state দেখা যায়
      const { data: fresh } = await getTodayQuests(userId);
      if (fresh) setQuests(fresh);
      else if (assigned) setQuests(assigned);

      // ৪. নতুন completed quest থাকলে toast + level-up celebration দেখানো
      if (newlyCompleted.length > 0) {
        let lastLevel: string | null = null;
        let lastXP: number | null = null;

        newlyCompleted.forEach((cq: CompletedQuestInfo, i: number) => {
          setTimeout(() => {
            addToast(cq.xpReward, `Quest complete: ${cq.title}`, cq.icon);
          }, i * 500);
          lastLevel = cq.newLevel;
          lastXP = cq.newTotalXP;
        });

        if (lastXP !== null) {
          onXPAwarded?.(lastXP);
        }

        // Level bদলে গেলে (কোনো quest এর কারণে) celebration দেখানো
        // — শেষ quest এর নতুন level ব্যবহার করা হচ্ছে
        if (lastLevel) {
          setTimeout(() => {
            showLevelUp(lastLevel as UserLevel);
          }, newlyCompleted.length * 500 + 700);
        }
      }

      setLoading(false);
    }

    load();
  }, [userId, addToast, showLevelUp, onXPAwarded]);

  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
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

      {!loading && completedCount === totalCount && totalCount > 0 && (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-center">
          <p className="text-green-400 text-xs font-semibold">
            🎉 All quests complete for today! Come back tomorrow.
          </p>
        </div>
      )}

      {!loading && totalCount > 0 && (
        <div className="mb-4 h-1 rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-text-muted" />
        </div>
      ) : (
        <div className="space-y-3">
          {quests.map((uq) => (
            <DailyQuestCard key={uq.id} userQuest={uq} />
          ))}
        </div>
      )}
    </div>
  );
}