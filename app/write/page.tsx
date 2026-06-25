"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Send, Save, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { createArticle, updateArticle, publishArticle } from "@/lib/db/articles";
import { worlds } from "@/lib/worlds-data";
import { useXPToastStore } from "@/store/xpToastStore";

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) +
    "-" +
    Math.floor(1000 + Math.random() * 9000)
  );
}

export default function WritePage() {
  const router = useRouter();
  const { user } = useUser();
  const { addToast } = useXPToastStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedWorld, setSelectedWorld] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [worldDropdown, setWorldDropdown] = useState(false);

  const handleSave = useCallback(
    async (silent = false) => {
      if (!user || !title.trim()) return;
      if (!silent) setSaving(true);

      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (articleId) {
        await updateArticle(articleId, {
          title,
          content,
          world_id: selectedWorld || null,
          tags: tagArray,
          cover_image: coverImage || null,
        });
      } else {
        const { data } = await createArticle({
          title,
          slug: generateSlug(title),
          content,
          world_id: selectedWorld || null,
          tags: tagArray,
          cover_image: coverImage || null,
          author_id: user.id,
          is_published: false,
        });
        if (data) setArticleId(data.id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (!silent) setSaving(false);
    },
    [user, title, content, selectedWorld, tags, coverImage, articleId]
  );

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!title && !content) return;
    const timer = setTimeout(() => handleSave(true), 30000);
    return () => clearTimeout(timer);
  }, [title, content, handleSave]);

  async function handlePublish() {
    if (!user || !title.trim() || !content.trim() || !selectedWorld) return;
    setPublishing(true);

    let id = articleId;

    if (!id) {
      const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const { data } = await createArticle({
        title,
        slug: generateSlug(title),
        content,
        world_id: selectedWorld,
        tags: tagArray,
        cover_image: coverImage || null,
        author_id: user.id,
        is_published: false,
      });
      if (data) id = data.id;
    }

    if (id) {
      const { error } = await publishArticle(id);
      if (!error) {
        addToast(50, "Article published!", "✍️");
        router.push(user.username ? `/profile/${user.username}` : "/");
      }
    }

    setPublishing(false);
  }

  const selectedWorldData = worlds.find((w) => w.id === selectedWorld);
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));
  const canPublish = title.trim() && content.trim() && selectedWorld;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <p className="text-text-muted text-sm">Please sign in to write articles.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-primary-bg/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">
              {wordCount} words · {readTime} min read
            </span>
            {saved && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-green-400"
              >
                Saved
              </motion.span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              {preview ? <EyeOff size={13} /> : <Eye size={13} />}
              {preview ? "Edit" : "Preview"}
            </button>

            <button
              onClick={() => handleSave()}
              disabled={saving || !title.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              Save Draft
            </button>

            <button
              onClick={handlePublish}
              disabled={publishing || !canPublish}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-yellow-400 hover:bg-yellow-300 text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {publishing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              Publish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!preview ? (
          <div className="space-y-6">
            {/* Cover image URL */}
            <input
              type="text"
              placeholder="Cover image URL (optional)"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full bg-transparent text-sm text-text-muted placeholder:text-text-muted/40 border border-white/5 rounded-xl px-4 py-2.5 focus:outline-none focus:border-white/15 transition-colors"
            />

            {/* Cover image preview */}
            {coverImage && (
              <div className="w-full h-48 rounded-xl overflow-hidden">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title */}
            <textarea
              placeholder="Article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              className="w-full bg-transparent text-3xl md:text-4xl font-black text-text-primary placeholder:text-text-muted/30 resize-none focus:outline-none leading-tight"
            />

            {/* World selector */}
            <div className="relative">
              <button
                onClick={() => setWorldDropdown(!worldDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 text-sm transition-colors"
              >
                {selectedWorldData ? (
                  <>
                    <span>{selectedWorldData.emoji}</span>
                    <span className="text-text-primary">
                      {selectedWorldData.name.split(" ")[0]}
                    </span>
                  </>
                ) : (
                  <span className="text-text-muted">Select a world</span>
                )}
                <ChevronDown size={14} className="text-text-muted ml-1" />
              </button>

              {worldDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-1 left-0 z-50 bg-[#0f0f0f] border border-white/10 rounded-xl p-2 min-w-[200px] shadow-2xl"
                >
                  {worlds.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedWorld(w.id);
                        setWorldDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-text-primary transition-colors text-left"
                    >
                      <span>{w.emoji}</span>
                      <span>{w.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Tags */}
            <input
              type="text"
              placeholder="Tags (comma separated): javascript, react, tutorial"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-transparent text-sm text-text-muted placeholder:text-text-muted/40 border-b border-white/5 pb-2 focus:outline-none focus:border-white/15 transition-colors"
            />

            {/* Content */}
            <textarea
              placeholder="Write your article here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={24}
              className="w-full bg-transparent text-base text-text-primary placeholder:text-text-muted/30 resize-none focus:outline-none leading-relaxed font-body"
            />
          </div>
        ) : (
          /* Preview Mode */
          <div className="prose prose-invert max-w-none">
            {coverImage && (
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-64 object-cover rounded-xl mb-8"
              />
            )}
            <h1 className="text-4xl font-black text-text-primary mb-4">
              {title || "Untitled"}
            </h1>
            {selectedWorldData && (
              <span className="text-xs text-text-muted">
                {selectedWorldData.emoji} {selectedWorldData.name.split(" ")[0]}
              </span>
            )}
            <div className="mt-6 text-text-primary whitespace-pre-wrap leading-relaxed">
              {content || "Nothing to preview yet."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}