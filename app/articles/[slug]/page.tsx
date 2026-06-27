"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Heart, Bookmark, ArrowLeft, Clock, Eye } from "lucide-react";
import { getArticleBySlug, toggleArticleLike, checkArticleLike, incrementArticleView } from "@/lib/db/articles";
import { useUser } from "@/hooks/useUser";
import { worlds } from "@/lib/worlds-data";
import { useXPToastStore } from "@/store/xpToastStore";
import { awardXP } from "@/lib/db/xp";
import type { ArticleWithAuthor } from "@/types/database";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useUser();
  const { addToast } = useXPToastStore();

  const [article, setArticle] = useState<ArticleWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await getArticleBySlug(slug);
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setArticle(data);
      setLikesCount(data.likes ?? 0);
      await incrementArticleView(data.id);

      if (user) {
        const isLiked = await checkArticleLike(data.id, user.id);
        setLiked(isLiked);
      }

      setLoading(false);
    }
    if (slug) load();
  }, [slug, user]);

  async function handleLike() {
    if (!user || !article) return;
    const { liked: newLiked } = await toggleArticleLike(article.id, user.id);
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));
    if (newLiked) {
      addToast(5, "Article liked!", "❤️");
      if (user) await awardXP(user.id, "article_like");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <Loader2 size={28} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary-bg px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">Article not found</h1>
        <p className="text-text-muted text-sm mt-2">This article may have been removed or unpublished.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-yellow-400 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const world = worlds.find((w) => w.id === article.world_id);
  const author = article.author;

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Back button */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      {/* Cover image */}
      {article.cover_image && (
        <div className="max-w-3xl mx-auto px-4 mb-8">
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-64 md:h-80 object-cover rounded-2xl"
          />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 pb-16">
        {/* World tag */}
        {world && (
          <div className="mb-4">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${world.color}20`, color: world.color }}
            >
              {world.emoji} {world.name.split(" ")[0]}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black text-text-primary leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8 pb-6 border-b border-white/5">
          {/* Author */}
          <div className="flex items-center gap-3">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.display_name ?? author.username}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-text-muted">
                {(author?.display_name ?? author?.username ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {author?.display_name ?? author?.username ?? "Unknown"}
              </p>
              {article.published_at && (
                <p className="text-xs text-text-muted">
                  {new Date(article.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {article.read_time_minutes ?? article.read_time ?? 1} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {article.views ?? article.views_count ?? 0}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="text-text-primary leading-relaxed text-base whitespace-pre-wrap font-body">
          {article.content}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            disabled={!user}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              liked
                ? "bg-red-500/15 text-red-400"
                : "bg-white/5 text-text-muted hover:bg-white/10"
            } disabled:opacity-40`}
          >
            <Heart size={15} className={liked ? "fill-red-400" : ""} />
            {likesCount}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-text-muted hover:bg-white/10 transition-colors"
          >
            <Bookmark size={15} />
            Save
          </motion.button>
        </div>
      </article>
    </div>
  );
}