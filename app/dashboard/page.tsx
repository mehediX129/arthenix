"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  Heart,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  PenSquare,
  ArrowRight,
  Globe,
  Loader2,
  BarChart2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { worlds } from "@/lib/worlds-data";

// ─── Types ───────────────────────────────────────────────────

interface DashboardStats {
  total_views: number;
  total_likes: number;
  total_articles: number;
  published: number;
  drafts: number;
  followers: number;
  this_week_views: number;
  last_week_views: number;
}

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  view_count: number;
  likes_count: number;
  world_id: string | null;
  published_at: string | null;
  created_at: string;
}

interface ViewsPoint {
  day: string;
  views: number;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function weekGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Stat Card ───────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  trend?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded-lg"
            style={{
              background: trend >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
              color: trend >= 0 ? "#10B981" : "#EF4444",
            }}
          >
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="font-display font-black text-2xl text-text-primary">
        {value}
      </p>
      <p className="font-mono text-xs text-text-muted mt-0.5">{label}</p>
      {sub && (
        <p className="font-mono text-xs text-text-muted opacity-60 mt-1">
          {sub}
        </p>
      )}
    </motion.div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: "rgba(15,15,25,0.95)",
        border: "1px solid rgba(124,58,237,0.3)",
      }}
    >
      <p className="font-mono text-xs text-text-muted">{label}</p>
      <p className="font-display font-bold text-sm text-violet-300">
        {payload[0].value} views
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [chartData, setChartData] = useState<ViewsPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) router.push("/login");
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const supabase = createClient();
      if (!user) return;
      const [statsRes, articlesRes, chartRes] = await Promise.all([
        supabase.rpc("get_dashboard_stats", { p_user_id: user.id }),
        supabase.rpc("get_my_articles_analytics", { p_user_id: user.id }),
        supabase.rpc("get_views_over_time", { p_user_id: user.id }),
      ]);
      if (statsRes.data) setStats(statsRes.data as DashboardStats);
      if (articlesRes.data) setArticles(articlesRes.data as ArticleRow[]);
      if (chartRes.data) {
        setChartData(
          (chartRes.data as { day: string; views: number }[]).map((d) => ({
            day: formatDay(d.day),
            views: Number(d.views),
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <Loader2 size={24} className="animate-spin text-violet-400" />
      </div>
    );
  }

  const viewsTrend = stats
    ? weekGrowth(stats.this_week_views, stats.last_week_views)
    : undefined;

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={18} className="text-violet-400" />
              <span className="font-mono text-xs text-text-muted">DASHBOARD</span>
            </div>
            <h1 className="font-display font-black text-3xl text-text-primary">
              Creator Studio
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Track your content performance and growth
            </p>
          </div>
          <Link
            href="/write"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm text-white transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
              boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
            }}
          >
            <PenSquare size={14} />
            New Article
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={28} className="animate-spin text-violet-400" />
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Eye}
                label="TOTAL VIEWS"
                value={formatCount(stats?.total_views ?? 0)}
                color="#7C3AED"
                trend={viewsTrend}
                sub="vs last week"
                delay={0}
              />
              <StatCard
                icon={Heart}
                label="TOTAL LIKES"
                value={formatCount(stats?.total_likes ?? 0)}
                color="#EC4899"
                delay={0.05}
              />
              <StatCard
                icon={FileText}
                label="ARTICLES"
                value={String(stats?.total_articles ?? 0)}
                sub={`${stats?.published ?? 0} published · ${stats?.drafts ?? 0} drafts`}
                color="#06B6D4"
                delay={0.1}
              />
              <StatCard
                icon={Users}
                label="FOLLOWERS"
                value={formatCount(stats?.followers ?? 0)}
                color="#10B981"
                delay={0.15}
              />
            </div>

            {/* ── Views Chart ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6 mb-8"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display font-bold text-text-primary">
                    Views Over Time
                  </h2>
                  <p className="font-mono text-xs text-text-muted mt-0.5">
                    Last 30 days
                  </p>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                  <TrendingUp size={13} className="text-violet-400" />
                  {viewsTrend !== undefined && (
                    <span
                      style={{
                        color: viewsTrend >= 0 ? "#10B981" : "#EF4444",
                      }}
                    >
                      {viewsTrend >= 0 ? "+" : ""}
                      {viewsTrend}% this week
                    </span>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fill="url(#viewsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* ── Articles Table ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="font-display font-bold text-text-primary">
                  Your Articles
                </h2>
                <span className="font-mono text-xs text-text-muted">
                  {articles.length} total
                </span>
              </div>

              {articles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    <PenSquare size={20} className="text-violet-400" />
                  </div>
                  <p className="text-text-muted text-sm">No articles yet</p>
                  <Link
                    href="/write"
                    className="font-mono text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Write your first article →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04] overflow-x-auto">
                  {articles.map((article) => {
                    const world = worlds.find((w) => w.id === article.world_id);
                    return (
                      <div
                        key={article.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Status dot */}
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background: article.is_published ? "#10B981" : "#F59E0B",
                          }}
                          title={article.is_published ? "Published" : "Draft"}
                        />

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate group-hover:text-violet-300 transition-colors">
                            {article.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {world && (
                              <span
                                className="font-mono text-[11px]"
                                style={{ color: world.color }}
                              >
                                {world.emoji} {world.name.split(" ")[0]}
                              </span>
                            )}
                            <span className="font-mono text-[11px] text-text-muted">
                              {article.is_published ? "Published" : "Draft"}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-6 shrink-0">
                          <div className="flex items-center gap-1.5 text-text-muted">
                            <Eye size={13} />
                            <span className="font-mono text-xs">
                              {formatCount(article.view_count)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-text-muted">
                            <Heart size={13} />
                            <span className="font-mono text-xs">
                              {formatCount(article.likes_count)}
                            </span>
                          </div>
                          {article.world_id && (
                            <div className="flex items-center gap-1.5 text-text-muted">
                              <Globe size={13} />
                              <span className="font-mono text-xs">
                                {article.world_id}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <Link
                          href={
                            article.is_published
                              ? `/articles/${article.slug}`
                              : `/write`
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-violet-400"
                        >
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}