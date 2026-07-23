"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { PriceHistoryPoint } from "@/types/database";

interface PriceHistoryProps {
  history: PriceHistoryPoint[];
  currentPrice: number;
  lowestPrice30d: number | null;
}

export default function PriceHistory({
  history,
  currentPrice,
  lowestPrice30d,
}: PriceHistoryProps) {
  if (history.length < 2) {
    return null;
  }

  const prices = history.map((h) => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;
  const trend =
    lastPrice < firstPrice ? "down" : lastPrice > firstPrice ? "up" : "flat";

  const isAtLowest =
    lowestPrice30d !== null && currentPrice <= lowestPrice30d;

  const chartWidth = 100;
  const chartHeight = 56;
  const padding = 4;

  const points = history.map((point, i) => {
    const x = (i / (history.length - 1)) * chartWidth;
    const normalizedPrice = (point.price - minPrice) / priceRange;
    const y =
      chartHeight - padding - normalizedPrice * (chartHeight - padding * 2);
    return { x, y, price: point.price, date: point.date };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display font-bold text-text-primary text-sm">
          Price History
        </h3>
        <div className="flex items-center gap-1 text-xs">
          {trend === "down" && (
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingDown size={13} />
              Dropping
            </span>
          )}
          {trend === "up" && (
            <span className="flex items-center gap-1 text-red-400">
              <TrendingUp size={13} />
              Rising
            </span>
          )}
          {trend === "flat" && (
            <span className="flex items-center gap-1 text-text-muted">
              <Minus size={13} />
              Stable
            </span>
          )}
        </div>
      </div>

      {isAtLowest && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 mb-3"
        >
          🔥 Lowest price in 30 days
        </motion.div>
      )}

      {/* Chart */}
      <div className="mt-3">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-16"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </linearGradient>
          </defs>

          <motion.path
            d={areaPath}
            fill="url(#priceGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          <motion.path
            d={linePath}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />

          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="2"
              fill="#06B6D4"
            />
          )}
        </svg>
      </div>

      {/* Min/Max labels */}
      <div className="flex items-center justify-between mt-2 text-[11px] text-text-muted">
        <span>Lowest: Tk {minPrice.toLocaleString()}</span>
        <span>Highest: Tk {maxPrice.toLocaleString()}</span>
      </div>
    </div>
  );
}