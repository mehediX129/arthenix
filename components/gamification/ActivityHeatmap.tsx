"use client";

import { useEffect, useState } from "react";
import { getUserActivity } from "@/lib/db/activity";
import type { UserActivity } from "@/types/database";

interface ActivityHeatmapProps {
  userId: string;
}

function getColor(count: number): string {
  if (count === 0) return "bg-white/5";
  if (count === 1) return "bg-green-900/60";
  if (count === 2) return "bg-green-700/70";
  if (count <= 4) return "bg-green-500/80";
  return "bg-green-400";
}

function buildGrid(activities: UserActivity[]) {
  const map = new Map<string, number>();
  activities.forEach((a) => map.set(a.activity_date, a.activity_count));

  const today = new Date();
  const days: { date: string; count: number }[] = [];

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, count: map.get(key) ?? 0 });
  }

  return days;
}

function getMonthLabels() {
  const labels: { label: string; col: number }[] = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const daysFromStart = Math.floor(
      (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    const col = Math.floor((364 - daysFromStart) / 7);
    if (col >= 0) {
      labels.push({
        label: d.toLocaleString("default", { month: "short" }),
        col,
      });
    }
  }
  return labels;
}

export function ActivityHeatmap({ userId }: ActivityHeatmapProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await getUserActivity(userId);
      if (data) setActivities(data);
      setLoading(false);
    }
    load();
  }, [userId]);

  const days = buildGrid(activities);
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const totalContributions = activities.reduce((sum, a) => sum + a.activity_count, 0);
  const monthLabels = getMonthLabels();

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Activity</h3>
        {!loading && (
          <span className="text-xs text-text-muted">
            {totalContributions} contributions in the last year
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-[120px] flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-green-400 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Month labels */}
            <div className="flex mb-1 ml-6">
              {monthLabels.map((m, i) => (
                <div
                  key={i}
                  className="text-[10px] text-text-muted"
                  style={{ marginLeft: i === 0 ? `${m.col * 14}px` : `${(m.col - (monthLabels[i - 1]?.col ?? 0)) * 14 - 18}px` }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[3px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] mr-1">
                {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                  <div key={i} className="text-[10px] text-text-muted h-[11px] flex items-center">
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={`w-[11px] h-[11px] rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-white/30 ${getColor(day.count)}`}
                      onMouseEnter={() => setTooltip(day)}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-3 justify-end">
              <span className="text-[10px] text-text-muted">Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-[11px] h-[11px] rounded-sm ${getColor(level === 0 ? 0 : level === 1 ? 1 : level === 2 ? 2 : level === 3 ? 3 : 5)}`}
                />
              ))}
              <span className="text-[10px] text-text-muted">More</span>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 text-xs text-text-muted text-center">
          <span className="text-text-primary font-medium">{tooltip.count} contributions</span> on {tooltip.date}
        </div>
      )}
    </div>
  );
}