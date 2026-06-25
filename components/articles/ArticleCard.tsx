"use client";

import { motion } from "framer-motion";
import { Heart, Clock, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { worlds } from "@/lib/worlds-data";
import type { ArticleWithAuthor } from "@/types/database";

interface ArticleCardProps {
  article: ArticleWithAuthor;
  index?: number;
}

export function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  const router = useRouter();
  const world = worlds.find((w) => w.id === article.world_id);
  const author = article.author;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => router.push(`/articles/${article.slug}`)}
      className="group cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200 overflow-hidden"
    >
      {/* Cover image */}
      {article.cover_image && (
        <div className="w-full h-44 overflow-hidden">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-5">
        {/* World tag */}
        {world && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mb-3"
            style={{ backgroundColor: `${world.color}20`, color: world.color }}
          >
            {world.emoji} {world.name.split(" ")[0]}
          </span>
        )}

        {/* Title */}
        <h3 className="text-base font-bold text-text-primary leading-snug mb-2 group-hover:text-yellow-400 transition-colors line-clamp-2">
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-sm text-text-muted leading-relaxed line-clamp-2 mb-4">
            {article.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          {/* Author */}
          <div className="flex items-center gap-2">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.display_name ?? author.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-text-muted">
                {(author?.display_name ?? author?.username ?? "?")[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs text-text-muted">
              {author?.display_name ?? author?.username ?? "Unknown"}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {article.read_time_minutes ?? article.read_time ?? 1}m
            </span>
            <span className="flex items-center gap-1">
              <Eye size={11} />
              {article.views ?? article.views_count ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={11} />
              {article.likes ?? article.likes_count ?? 0}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}