"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, Eye, Heart, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { worlds } from "@/lib/worlds-data";

interface TrendingArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  world_id: string;
  view_count: number;
  likes_count: number;
  published_at: string | null;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
}

export default function TrendingSection() {
  const [articles, setArticles] = useState<TrendingArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, cover_image, world_id, views_count, likes_count, published_at, author:profiles!articles_author_id_fkey(username, display_name, avatar_url)")
        .eq("is_published", true)
        .order("views_count", { ascending: false })
        .limit(6);

      if (data && data.length > 0) {
        const mapped = (data as unknown as {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          cover_image: string | null;
          world_id: string;
          views_count: number;
          likes_count: number;
          published_at: string | null;
          author: { username: string; display_name: string | null; avatar_url: string | null }[];
        }[]).map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          cover_image: a.cover_image,
          world_id: a.world_id,
          view_count: a.views_count,
          likes_count: a.likes_count,
          published_at: a.published_at,
          author_username: a.author?.[0]?.username ?? "",
          author_display_name: a.author?.[0]?.display_name ?? null,
          author_avatar_url: a.author?.[0]?.avatar_url ?? null,
        }));
        setArticles(mapped);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (!loading && articles.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-violet-400" />
            <span className="font-mono text-xs text-text-muted">TRENDING NOW</span>
          </div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-text-primary">
            What Everyone&apos;s Reading
          </h2>
        </div>
        <Link
          href="/community"
          className="hidden md:flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-violet-400 transition-colors"
        >
          Browse all
          <ArrowRight size={13} />
        </Link>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-52 animate-pulse"
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article, i) => {
            const world = worlds.find((w) => w.id === article.world_id);
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={`/articles/${article.slug}`}
                  className="block rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {article.cover_image ? (
                    <div className="h-36 overflow-hidden">
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div
                      className="h-36 flex items-center justify-center text-4xl"
                      style={{
                        background: world
                          ? `linear-gradient(135deg, ${world.color}15, transparent)`
                          : "rgba(124,58,237,0.1)",
                      }}
                    >
                      {world?.emoji ?? "📄"}
                    </div>
                  )}

                  <div className="p-4">
                    {world && (
                      <span
                        className="font-mono text-[11px] font-bold"
                        style={{ color: world.color }}
                      >
                        {world.emoji} {world.name.split(" ")[0]}
                      </span>
                    )}
                    <h3 className="font-display font-bold text-sm text-text-primary mt-1 mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-text-muted">
                        {article.author_display_name ?? article.author_username}
                      </span>
                      <div className="flex items-center gap-3 text-text-muted">
                        <span className="flex items-center gap-1 font-mono text-xs">
                          <Eye size={11} />
                          {article.view_count}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-xs">
                          <Heart size={11} />
                          {article.likes_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}