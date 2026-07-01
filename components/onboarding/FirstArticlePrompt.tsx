"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { getOnboardingArticleSuggestions } from "@/lib/db/onboarding";
import { worlds } from "@/lib/worlds-data";
import type { ArticleWithAuthor } from "@/types/database";

interface FirstArticlePromptProps {
  selectedWorldIds: string[];
  onContinue: () => void;
}

export default function FirstArticlePrompt({
  selectedWorldIds,
  onContinue,
}: FirstArticlePromptProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOnboardingArticleSuggestions(selectedWorldIds).then((data) => {
      if (active) {
        setArticles(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function readArticle(slug: string) {
    router.push(`/articles/${slug}`);
  }

  function worldColor(worldId: string | null) {
    return worlds.find((w) => w.id === worldId)?.color ?? "#7C3AED";
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-primary-bg px-4 py-16">
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-20 blur-[140px]"
        style={{ background: "#06B6D4" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center mb-10 max-w-xl"
      >
        <h1 className="font-display text-3xl md:text-4xl font-black text-text-primary">
          Pick your first read.
        </h1>
        <p className="text-text-secondary mt-3 text-base">
          Hand-picked from the worlds you just joined — finishing one earns
          you bonus XP.
        </p>
      </motion.div>

      <div className="relative z-10 w-full max-w-3xl mb-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-white/10 bg-card-bg/40 animate-pulse"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-card-bg/40 p-8 text-center text-text-muted text-sm">
            No articles yet in your worlds — be the first to publish one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articles.map((article, i) => (
              <motion.button
                key={article.id}
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => readArticle(article.slug)}
                className="group text-left rounded-xl p-4 border border-white/10 bg-card-bg/60 backdrop-blur-sm transition-all hover:border-white/20"
                style={{
                  boxShadow: `0 0 0px transparent`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: worldColor(article.world_id) }}
                  />
                  <span className="text-[10px] uppercase tracking-wide text-text-muted">
                    {article.complexity_level}
                  </span>
                </div>

                <h3 className="font-display font-bold text-sm text-text-primary leading-snug line-clamp-2 group-hover:text-[#06B6D4] transition-colors">
                  {article.title}
                </h3>

                <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {article.read_time_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={11} />
                    {article.views_count} reads
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        type="button"
        onClick={onContinue}
        className="relative z-10 flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-[0_0_24px_-4px_rgba(124,58,237,0.6)]"
      >
        Maybe later
        <ArrowRight size={16} />
      </motion.button>
    </div>
  );
}