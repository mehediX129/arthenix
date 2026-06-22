"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ShoppingBag, Star, Loader2 } from "lucide-react";
import { getUserActivity } from "@/lib/db/activity";
import type { ActivityItem, ActivityType } from "@/lib/db/activity";

interface ActivityFeedProps {
  userId: string;
}

const TYPE_CONFIG: Record<
  ActivityType,
  { icon: typeof MessageSquare; color: string; verb: string }
> = {
  comment: { icon: MessageSquare, color: "#06B6D4", verb: "Commented on" },
  purchase: { icon: ShoppingBag, color: "#7C3AED", verb: "Purchased" },
  review: { icon: Star, color: "#F59E0B", verb: "Reviewed" },
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const PAGE_SIZE = 8;

export default function ActivityFeed({ userId }: ActivityFeedProps) {
  const [allItems, setAllItems] = useState<ActivityItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await getUserActivity(userId, 50);
      setAllItems(data ?? []);
      setLoading(false);
    }
    load();
  }, [userId]);

  const visibleItems = allItems.slice(0, visibleCount);
  const hasMore = visibleCount < allItems.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5">
      <h3 className="font-display font-bold text-text-primary text-sm mb-4">
        Recent Activity
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-text-muted" />
        </div>
      ) : allItems.length === 0 ? (
        <p className="text-text-muted text-xs text-center py-8">
          No activity yet. Start exploring!
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {visibleItems.map((item, i) => {
              const config = TYPE_CONFIG[item.type];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ backgroundColor: `${config.color}1A` }}
                  >
                    <config.icon size={13} style={{ color: config.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      <span className="text-text-primary font-medium">
                        {config.verb}
                      </span>{" "}
                      <span className="truncate">{item.title}</span>
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="w-full mt-5 rounded-lg border border-white/10 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}