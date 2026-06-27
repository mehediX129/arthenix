"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronDown, X } from "lucide-react";
import { createPost } from "@/lib/db/posts";
import { useUser } from "@/hooks/useUser";
import { worlds } from "@/lib/worlds-data";
import { useXPToastStore } from "@/store/xpToastStore";
import { awardXP } from "@/lib/db/xp";
import type { PostWithAuthor } from "@/types/database";

interface CreatePostProps {
  onPostCreated: (post: PostWithAuthor) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useUser();
  const { addToast } = useXPToastStore();

  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedWorld, setSelectedWorld] = useState("");
  const [worldDropdown, setWorldDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedWorldData = worlds.find((w) => w.id === selectedWorld);

  async function handleSubmit() {
    if (!user || !title.trim() || !content.trim()) return;
    setSubmitting(true);

    const { data } = await createPost({
      author_id: user.id,
      title: title.trim(),
      content: content.trim(),
      world_id: selectedWorld || undefined,
    });

    if (data) {
      const postWithAuthor: PostWithAuthor = {
        ...data,
        author: {
          id: user.id,
          username: user.username,
          display_name: null,
          avatar_url: user.avatar_url,
          level: user.level,
        },
      };
      onPostCreated(postWithAuthor);
      addToast(15, "Post created!", "💬");
      if (user) await awardXP(user.id, "post_create");
      setTitle("");
      setContent("");
      setSelectedWorld("");
      setExpanded(false);
    }

    setSubmitting(false);
  }

  if (!user) return null;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 mb-6">
      {/* Collapsed state */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
              {user.username[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm text-text-muted">
            Share something with the community...
          </span>
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">
                Create Post
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Title */}
            <input
              type="text"
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
            />

            {/* Content */}
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all resize-none"
            />

            {/* Footer */}
            <div className="flex items-center justify-between">
              {/* World selector */}
              <div className="relative">
                <button
                  onClick={() => setWorldDropdown(!worldDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 text-xs transition-colors"
                >
                  {selectedWorldData ? (
                    <>
                      <span>{selectedWorldData.emoji}</span>
                      <span className="text-text-primary">
                        {selectedWorldData.name.split(" ")[0]}
                      </span>
                    </>
                  ) : (
                    <span className="text-text-muted">Choose world</span>
                  )}
                  <ChevronDown size={12} className="text-text-muted" />
                </button>

                {worldDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full mb-1 left-0 z-50 bg-[#0f0f0f] border border-white/10 rounded-xl p-2 min-w-[180px] shadow-2xl"
                  >
                    <button
                      onClick={() => { setSelectedWorld(""); setWorldDropdown(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-text-muted transition-colors text-left"
                    >
                      All worlds
                    </button>
                    {worlds.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => { setSelectedWorld(w.id); setWorldDropdown(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-text-primary transition-colors text-left"
                      >
                        <span>{w.emoji}</span>
                        <span>{w.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !content.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={12} />
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}