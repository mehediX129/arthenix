"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Trash2, Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { togglePostLike } from "@/lib/db/posts";
import { useUser } from "@/hooks/useUser";
import { useXPToastStore } from "@/store/xpToastStore";
import { awardXP } from "@/lib/db/xp";
import { worlds } from "@/lib/worlds-data";
import type { PostWithAuthor } from "@/types/database";

interface PostCardProps {
  post: PostWithAuthor;
  index?: number;
  onDelete?: (postId: string) => void;
  initialLiked?: boolean;
}

export function PostCard({ post, index = 0, onDelete, initialLiked = false }: PostCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const { addToast } = useXPToastStore();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const world = worlds.find((w) => w.id === post.world_id);
  const author = post.author;
  const isOwner = user?.id === post.author_id;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  };

  async function handleLike() {
    if (!user) return;
    const { liked: newLiked } = await togglePostLike(post.id, user.id);
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));
    if (newLiked) {
      addToast(2, "Post liked!", "❤️");
      if (user) await awardXP(user.id, "post_like");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all duration-200 p-5"
    >
      {/* Pinned badge */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 text-xs text-yellow-400 mb-3">
          <Pin size={11} />
          <span>Pinned</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.display_name ?? author.username}
              className="w-8 h-8 rounded-full object-cover cursor-pointer"
              onClick={() => router.push(`/profile/${author.username}`)}
            />
          ) : (
            <div
              onClick={() => router.push(`/profile/${author?.username ?? ""}`)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-text-muted cursor-pointer"
            >
              {(author?.display_name ?? author?.username ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p
              className="text-sm font-semibold text-text-primary cursor-pointer hover:text-yellow-400 transition-colors"
              onClick={() => router.push(`/profile/${author?.username ?? ""}`)}
            >
              {author?.display_name ?? author?.username ?? "Unknown"}
            </p>
            <p className="text-xs text-text-muted">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        {/* World tag */}
        {world && (
          <span
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${world.color}20`, color: world.color }}
          >
            {world.emoji} {world.name.split(" ")[0]}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-text-primary mb-2 leading-snug">
        {post.title}
      </h3>

      {/* Content */}
      <p className="text-sm text-text-muted leading-relaxed line-clamp-3">
        {post.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleLike}
            disabled={!user}
            className={`flex items-center gap-1.5 text-xs transition-colors disabled:opacity-40 ${
              liked ? "text-red-400" : "text-text-muted hover:text-red-400"
            }`}
          >
            <Heart size={14} className={liked ? "fill-red-400" : ""} />
            {likesCount}
          </motion.button>

          {/* Comments */}
          <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
            <MessageCircle size={14} />
            {post.comments_count}
          </button>
        </div>

        {/* Delete */}
        {isOwner && onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}