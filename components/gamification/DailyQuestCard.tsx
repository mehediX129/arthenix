"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import type { UserQuestWithQuest } from "@/types/database";

interface DailyQuestCardProps {
  userQuest: UserQuestWithQuest;
  onComplete: (userQuestId: string, xp: number, title: string, icon: string) => void;
  isCompleting: boolean;
}

export function DailyQuestCard({ userQuest, onComplete, isCompleting }: DailyQuestCardProps) {
  const { quest, completed, progress, id } = userQuest;
  const percent = Math.min((progress / quest.target_count) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border p-4 transition-colors ${
        completed
          ? "border-green-500/20 bg-green-500/5"
          : "border-white/5 bg-white/[0.02] hover:border-white/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex items-center justify-center w-10 h-10 rounded-full text-xl shrink-0 ${
          completed ? "bg-green-500/15" : "bg-white/5"
        }`}>
          {quest.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold truncate ${
              completed ? "text-green-400" : "text-text-primary"
            }`}>
              {quest.title}
            </p>
            <span className="text-xs font-bold text-yellow-400 shrink-0">
              +{quest.xp_reward} XP
            </span>
          </div>

          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            {quest.description}
          </p>

          {/* Progress Bar */}
          {!completed && quest.target_count > 1 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>{progress} / {quest.target_count}</span>
                <span>{Math.round(percent)}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" as const }}
                  className="h-full rounded-full bg-yellow-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Complete Button / Check */}
        <div className="shrink-0">
          {completed ? (
            <CheckCircle2 size={20} className="text-green-400" />
          ) : (
            <button
              onClick={() => onComplete(id, quest.xp_reward, quest.title, quest.icon)}
              disabled={isCompleting}
              className="text-text-muted hover:text-yellow-400 transition-colors disabled:opacity-40"
            >
              <Circle size={20} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}