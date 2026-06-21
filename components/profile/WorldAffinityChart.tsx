"use client";

import React, { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { worlds } from "@/lib/worlds-data";
import type { WorldAffinity } from "@/types/database";

interface WorldAffinityChartProps {
  affinityData: WorldAffinity[];
}

export default function WorldAffinityChart({
  affinityData,
}: WorldAffinityChartProps) {
  const chartData = useMemo(() => {
    const affinityMap = new Map(
      affinityData.map((a) => [a.world_id, a.affinity_score])
    );

    return worlds.map((world) => ({
      world: world.name.split(" ")[0],
      score: affinityMap.get(world.id) ?? 0,
      fullName: world.name,
    }));
  }, [affinityData]);

  const hasAnyEngagement = affinityData.length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5">
      <h3 className="font-display font-bold text-text-primary text-sm mb-1">
        World Affinity
      </h3>
      <p className="text-text-muted text-xs mb-4">
        কোন world-এ সবচেয়ে বেশি সময় কাটাচ্ছো
      </p>

      {!hasAnyEngagement && (
        <p className="text-text-muted text-xs mb-3 italic">
          এখনো কোনো world bookmark করা হয়নি — explore শুরু করো!
        </p>
      )}

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="75%">
            <defs>
              <linearGradient id="affinityFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis
              dataKey="world"
              tick={{ fill: "#94A3B8", fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={30}
              tick={{ fill: "#475569", fontSize: 9 }}
              axisLine={false}
            />
            <Radar
              dataKey="score"
              stroke="#7C3AED"
              fill="url(#affinityFill)"
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}