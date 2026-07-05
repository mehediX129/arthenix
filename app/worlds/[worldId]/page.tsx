"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  PenSquare,
  TrendingUp,
  Eye,
  Heart,
  Users,
  FileText,
  Crown,
  Flame,
  ArrowRight,
} from "lucide-react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getArticlesByWorld } from "@/lib/db/articles";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { worlds } from "@/lib/worlds-data";
import { recordWorldVisit } from "@/lib/db/quests";
import type { ArticleWithAuthor } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────

interface WorldStats {
  article_count: number;
  total_views: number;
  total_likes: number;
  writer_count: number;
}

interface Contributor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: string;
  xp: number;
  article_count: number;
}

interface TrendingArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  view_count: number;
  likes_count: number;
  published_at: string | null;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Stat Card ───────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="font-display font-black text-xl text-text-primary">
          {value}
        </p>
        <p className="font-mono text-xs text-text-muted">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Tab type ────────────────────────────────────────────────

type Tab = "latest" | "trending" | "top";

// ─── Page ────────────────────────────────────────────────────

export default function WorldPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.worldId as string;
  const { user } = useUser();

  const world = worlds.find((w) => w.id === worldId);

  const [tab, setTab] = useState<Tab>("latest");
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [trending, setTrending] = useState<TrendingArticle[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [stats, setStats] = useState<WorldStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!worldId) return;

    async function load() {
      setLoading(true);
      const supabase = createClient();

      const [articlesRes, statsRes, contributorsRes, trendingRes] =
        await Promise.all([
          getArticlesByWorld(worldId, 20),
          supabase.rpc("get_world_stats", { p_world_id: worldId }),
          supabase.rpc("get_world_top_contributors", {
            p_world_id: worldId,
            p_limit: 6,
          }),
          supabase.rpc("get_world_trending", {
            p_world_id: worldId,
            p_limit: 3,
          }),
        ]);

      if (articlesRes.data) setArticles(articlesRes.data);
      if (statsRes.data) setStats(statsRes.data as WorldStats);
      if (contributorsRes.data)
        setContributors(contributorsRes.data as Contributor[]);
      if (trendingRes.data)
        setTrending(trendingRes.data as TrendingArticle[]);

      setLoading(false);
    }

    load();
  }, [worldId]);
  // "Explorer" quest (visit 2 different worlds) এর জন্য — এই world
  // visit হয়েছে বলে log করা, শুধু logged-in user এর জন্য
  useEffect(() => {
    if (!worldId || !user) return;
    recordWorldVisit(user.id, worldId);
  }, [worldId, user]);

  if (!world) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <p className="text-text-muted text-sm">World not found.</p>
      </div>
    );
  }

  const sortedArticles =
    tab === "top"
      ? [...articles].sort((a, b) => b.likes_count - a.likes_count)
      : articles;

  return (
    <div className="min-h-screen bg-primary-bg">

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${world.color}18 0%, transparent 60%)`,
          borderBottom: `1px solid ${world.color}20`,
        }}
      >
        {/* Glow orb */}
        <div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: world.color }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4 mb-4"
              >
                <span className="text-6xl">{world.emoji}</span>
                <div>
                  <p
                    className="font-mono text-xs font-bold tracking-widest mb-1"
                    style={{ color: world.color }}
                  >
                    WORLD
                  </p>
                  <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary">
                    {world.name.split(" ")[0]}
                  </h1>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-text-secondary text-lg max-w-xl"
              >
                {world.tagline}
              </motion.p>

              {/* Trending pill */}
              {world.trending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mt-4"
                >
                  <Flame size={13} style={{ color: world.color }} />
                  <span className="font-mono text-xs text-text-muted">
                    Trending:
                  </span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: world.color }}
                  >
                    {world.trending}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Write CTA */}
            {user && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => router.push("/write")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-sm text-white transition-all hover:scale-105 shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${world.color}, ${world.color}99)`,
                  boxShadow: `0 8px 24px ${world.color}30`,
                }}
              >
                <PenSquare size={15} />
                Write in this World
              </motion.button>
            )}
          </div>

          {/* Stats row */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10"
            >
              <StatCard
                icon={FileText}
                label="ARTICLES"
                value={formatCount(stats.article_count)}
                color={world.color}
              />
              <StatCard
                icon={Eye}
                label="TOTAL VIEWS"
                value={formatCount(stats.total_views)}
                color={world.color}
              />
              <StatCard
                icon={Heart}
                label="TOTAL LIKES"
                value={formatCount(stats.total_likes)}
                color={world.color}
              />
              <StatCard
                icon={Users}
                label="WRITERS"
                value={formatCount(stats.writer_count)}
                color={world.color}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left: Articles ── */}
          <div className="flex-1 min-w-0">

            {/* Tab bar */}
            <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {(["latest", "trending", "top"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-1.5 rounded-lg font-mono text-xs font-bold capitalize transition-colors"
                  style={
                    tab === t
                      ? { background: world.color, color: "#fff" }
                      : { color: "var(--text-muted)" }
                  }
                >
                  {t === "latest" && "Latest"}
                  {t === "trending" && "🔥 Trending"}
                  {t === "top" && "⭐ Top"}
                </button>
              ))}
            </div>

            {/* Article grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={24} className="animate-spin text-text-muted" />
              </div>
            ) : sortedArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">{world.emoji}</span>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  No articles yet
                </h3>
                <p className="text-sm text-text-muted mb-6">
                  Be the first to write in the {world.name.split(" ")[0]} world!
                </p>
                {user && (
                  <button
                    onClick={() => router.push("/write")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm text-white transition-all hover:scale-105"
                    style={{ background: world.color }}
                  >
                    <PenSquare size={14} />
                    Write First Article
                  </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {sortedArticles.map((article, i) => (
                  <ArticleCard key={article.id} article={article} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="lg:w-72 shrink-0 space-y-6 w-full">

            {/* Trending this week */}
            {trending.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} style={{ color: world.color }} />
                  <span className="font-mono text-xs font-bold text-text-muted">
                    TRENDING THIS WEEK
                  </span>
                </div>
                <div className="space-y-3">
                  {trending.map((article, i) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="flex items-start gap-3 group"
                    >
                      <span
                        className="font-display font-black text-2xl leading-none opacity-20 shrink-0 mt-0.5"
                        style={{ color: world.color }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary group-hover:text-violet-300 transition-colors line-clamp-2">
                          {article.title}
                        </p>
                        <p className="font-mono text-xs text-text-muted mt-0.5">
                          {formatCount(article.view_count)} views
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Top contributors */}
            {contributors.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Crown size={14} style={{ color: world.color }} />
                  <span className="font-mono text-xs font-bold text-text-muted">
                    TOP CONTRIBUTORS
                  </span>
                </div>
                <div className="space-y-3">
                  {contributors.map((c, i) => (
                    <Link
                      key={c.id}
                      href={`/profile/${c.username}`}
                      className="flex items-center gap-3 group"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm"
                        style={{
                          background: `${world.color}25`,
                          border: `1px solid ${world.color}40`,
                          color: world.color,
                        }}
                      >
                        {i === 0 ? (
                          "👑"
                        ) : (
                          (c.display_name ?? c.username).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary group-hover:text-violet-300 transition-colors truncate">
                          {c.display_name ?? c.username}
                        </p>
                        <p className="font-mono text-xs text-text-muted">
                          {c.article_count} articles
                        </p>
                      </div>
                      <ArrowRight
                        size={12}
                        className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Join CTA for non-logged in */}
            {!user && (
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  background: `${world.color}10`,
                  border: `1px solid ${world.color}25`,
                }}
              >
                <span className="text-3xl">{world.emoji}</span>
                <p className="font-display font-bold text-text-primary mt-2 mb-1">
                  Join this World
                </p>
                <p className="font-mono text-xs text-text-muted mb-4">
                  Write, learn, and connect.
                </p>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-display font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background: world.color }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}