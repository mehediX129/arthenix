"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Trash2, Pin, Send } from "lucide-react";
import Link from "next/link";
import { togglePostLike, getPostComments, addPostComment } from "@/lib/db/posts";
import { useUser } from "@/hooks/useUser";
import { useXPToastStore } from "@/store/xpToastStore";
import { awardXP } from "@/lib/db/xp";
import { worlds } from "@/lib/worlds-data";
import type { PostWithAuthor, PostCommentWithAuthor } from "@/types/database";

interface PostCardProps {
  post: PostWithAuthor;
  index?: number;
  onDelete?: (postId: string) => void;
  initialLiked?: boolean;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

export function PostCard({ post, index = 0, onDelete, initialLiked = false }: PostCardProps) {
  const { user } = useUser();
  const { addToast } = useXPToastStore();

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostCommentWithAuthor[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const world = worlds.find((w) => w.id === post.world_id);
  const author = post.author;
  const isOwner = user?.id === post.author_id;

  async function handleLike() {
    if (!user) return;
    const { liked: newLiked } = await togglePostLike(post.id, user.id);
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));
    if (newLiked) {
      addToast(2, "Post liked!", "❤️");
      await awardXP(user.id, "post_like");
    }
  }

  async function handleToggleComments() {
    if (!commentsOpen && !commentsLoaded) {
      const { data } = await getPostComments(post.id);
      setComments(data ?? []);
      setCommentsLoaded(true);
    }
    setCommentsOpen(!commentsOpen);
  }

  async function handleSubmitComment() {
    if (!user || !commentInput.trim()) return;
    setSubmitting(true);
    const { data } = await addPostComment({
      post_id: post.id,
      author_id: user.id,
      content: commentInput.trim(),
    });
    if (data) {
      const newComment: PostCommentWithAuthor = {
        ...data,
        author: {
          id: user.id,
          username: user.username,
          display_name: user.username,
          avatar_url: user.avatar_url,
        },
      };
      setComments((prev) => [...prev, newComment]);
      setCommentsCount((prev) => prev + 1);
      setCommentInput("");
      addToast(5, "Comment added!", "💬");
    }
    setSubmitting(false);
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
          <Link href={`/profile/${author?.username ?? ""}`}>
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.display_name ?? author.username}
                className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-violet-500 transition-all"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-text-muted hover:bg-violet-500/20 transition-colors">
                {(author?.display_name ?? author?.username ?? "?")[0].toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/profile/${author?.username ?? ""}`}
              className="text-sm font-semibold text-text-primary hover:text-violet-300 transition-colors"
            >
              {author?.display_name ?? author?.username ?? "Unknown"}
            </Link>
            <p className="text-xs text-text-muted">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        {world && (
          <Link
            href={`/worlds/${world.id}`}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
            style={{ backgroundColor: `${world.color}20`, color: world.color }}
          >
            {world.emoji} {world.name.split(" ")[0]}
          </Link>
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

          <button
            onClick={handleToggleComments}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              commentsOpen ? "text-violet-400" : "text-text-muted hover:text-violet-400"
            }`}
          >
            <MessageCircle size={14} />
            {commentsCount}
          </button>
        </div>

        {isOwner && onDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">

              {/* Comment list */}
              {comments.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-2">
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <Link href={`/profile/${comment.author?.username ?? ""}`}>
                      {comment.author?.avatar_url ? (
                        <img
                          src={comment.author.avatar_url}
                          alt={comment.author.display_name ?? comment.author.username}
                          className="w-7 h-7 rounded-full object-cover shrink-0 hover:ring-2 hover:ring-violet-500 transition-all"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                          {(comment.author?.display_name ?? comment.author?.username ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div
                      className="flex-1 rounded-xl px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link
                          href={`/profile/${comment.author?.username ?? ""}`}
                          className="text-xs font-semibold text-text-primary hover:text-violet-300 transition-colors"
                        >
                          {comment.author?.display_name ?? comment.author?.username}
                        </Link>
                        <span className="text-[11px] text-text-muted">
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Comment input */}
              {user ? (
                <div className="flex gap-2 mt-2">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-white/[0.04] border border-white/8 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentInput.trim() || submitting}
                    className="flex items-center justify-center w-9 h-9 rounded-xl transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
                  >
                    <Send size={13} className="text-white" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-1">
                  <Link href="/login" className="text-violet-400 hover:underline">Sign in</Link> to comment
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}