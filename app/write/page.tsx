"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Send,
  Save,
  Eye,
  EyeOff,
  ChevronDown,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link,
  List,
  ImagePlus,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { createArticle, updateArticle, publishArticle } from "@/lib/db/articles";
import { worlds } from "@/lib/worlds-data";
import { useXPToastStore } from "@/store/xpToastStore";

import { createClient } from "@/lib/supabase/client";
import { awardXP } from "@/lib/db/xp";
// ─── Helpers ────────────────────────────────────────────────

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

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/!\[(.*?)\]\((.+?)\)/g, '<img src="$2" alt="$1" loading="lazy" class="prose-img" />')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hlbcapi])(.+)$/gm, "<p>$1</p>");
}

type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

// ─── Toolbar Button ──────────────────────────────────────────

function ToolbarBtn({
  icon: Icon,
  label,
  onClick,
  shortcut,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/8 transition-colors"
    >
      <Icon size={15} />
    </button>
  );
}

// ─── Tag chip input ──────────────────────────────────────────

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs text-violet-300"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-text-muted hover:text-text-primary transition-colors ml-0.5"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      {tags.length < 8 && (
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(input);
            }
            if (e.key === "Backspace" && !input && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          placeholder={tags.length === 0 ? "Add tags (press Enter)..." : "Add tag..."}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-text-muted placeholder:text-text-muted/40 focus:outline-none"
        />
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function WritePage() {
  const router = useRouter();
  const { user } = useUser();
  const { addToast } = useXPToastStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedWorld, setSelectedWorld] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [worldDropdown, setWorldDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contentImageUploading, setContentImageUploading] = useState(false);
  const contentImageInputRef = useRef<HTMLInputElement>(null);

  // ── Toolbar insertion ──────────────────────────────────────

  function insertAtCursor(before: string, after = "", placeholder = "") {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const newContent =
      content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      const cursor = start + before.length + selected.length + after.length;
      el.setSelectionRange(cursor, cursor);
    }, 0);
  }

  function insertLinePrefix(prefix: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const newContent = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(newContent);
    setTimeout(() => el.focus(), 0);
  }

  function insertImageMarkdown(url: string, alt = "image") {
    const el = textareaRef.current;
    const markdown = `\n\n![${alt}](${url})\n\n`;
    if (!el) {
      setContent((prev) => prev + markdown);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newContent = content.slice(0, start) + markdown + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      const cursor = start + markdown.length;
      el.setSelectionRange(cursor, cursor);
    }, 0);
  }

  const toolbarActions = [
    { icon: Bold,     label: "Bold",       shortcut: "Ctrl+B", action: () => insertAtCursor("**", "**", "bold text") },
    { icon: Italic,   label: "Italic",     shortcut: "Ctrl+I", action: () => insertAtCursor("*", "*", "italic text") },
    { icon: Heading2, label: "Heading 2",  shortcut: "",       action: () => insertLinePrefix("## ") },
    { icon: Heading3, label: "Heading 3",  shortcut: "",       action: () => insertLinePrefix("### ") },
    { icon: Quote,    label: "Blockquote", shortcut: "",       action: () => insertLinePrefix("> ") },
    { icon: Code,     label: "Inline code",shortcut: "",       action: () => insertAtCursor("`", "`", "code") },
    { icon: List,     label: "List item",  shortcut: "",       action: () => insertLinePrefix("- ") },
    { icon: Link,     label: "Link",       shortcut: "",       action: () => insertAtCursor("[", "](url)", "link text") },
    { icon: ImageIcon,label: "Insert image", shortcut: "",     action: () => contentImageInputRef.current?.click() },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "b") { e.preventDefault(); insertAtCursor("**", "**", "bold text"); }
      if (e.key === "i") { e.preventDefault(); insertAtCursor("*", "*", "italic text"); }
      if (e.key === "s") { e.preventDefault(); handleSave(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // ── Auto-save ──────────────────────────────────────────────

  const handleSave = useCallback(
    async (silent = false) => {
      if (!user || !title.trim()) return;
      if (!silent) setSaveStatus("saving");
      else setSaveStatus("saving");

      if (articleId) {
        await updateArticle(articleId, {
          title,
          content,
          world_id: selectedWorld || null,
          tags,
          cover_image: coverImage || null,
        });
      } else {
        const { data } = await createArticle({
          title,
          slug: generateSlug(title),
          content,
          world_id: selectedWorld || null,
          tags,
          cover_image: coverImage || null,
          author_id: user.id,
          is_published: false,
        });
        if (data) setArticleId(data.id);
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    [user, title, content, selectedWorld, tags, coverImage, articleId]
  );

  // Mark unsaved when content changes
  useEffect(() => {
    if (title || content) setSaveStatus("unsaved");
  }, [title, content, tags, selectedWorld]);

  // Auto-save every 30s
  useEffect(() => {
    if (!title && !content) return;
    const timer = setTimeout(() => handleSave(true), 30000);
    return () => clearTimeout(timer);
  }, [title, content, handleSave]);

  // ── Cover image upload ─────────────────────────────────────

  async function handleImageUpload(file: File) {
    if (!user) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `covers/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("article-covers")
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("article-covers")
        .getPublicUrl(path);
      setCoverImage(urlData.publicUrl);
    }
    setUploading(false);
  }

  // ── Inline content image upload ─────────────────────────────
  // Same bucket as covers, different top-level folder (content/ vs
  // covers/), so a single storage.foldername(name)[2] = auth.uid()
  // RLS policy protects both use cases.

  async function handleContentImageUpload(file: File) {
    if (!user) return;
    setContentImageUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `content/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("article-covers")
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("article-covers")
        .getPublicUrl(path);
      insertImageMarkdown(urlData.publicUrl);
    }
    setContentImageUploading(false);
  }

  function handleContentImageDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleContentImageUpload(file);
  }

  function handleContentImagePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleContentImageUpload(file);
        }
        return;
      }
    }
  }

  // ── Publish ────────────────────────────────────────────────

  async function handlePublish() {
    if (!user || !title.trim() || !content.trim() || !selectedWorld) return;
    setPublishing(true);

    let id = articleId;
    if (!id) {
      const { data } = await createArticle({
        title,
        slug: generateSlug(title),
        content,
        world_id: selectedWorld,
        tags,
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
        await awardXP(user.id, "article_publish");
        router.push(user.username ? `/profile/${user.username}` : "/");
      }
    }
    setPublishing(false);
  }

  // ── Derived ────────────────────────────────────────────────

  const selectedWorldData = worlds.find((w) => w.id === selectedWorld);
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));
  const canPublish = title.trim() && content.trim() && selectedWorld;
  const charCount = content.length;

  // ── Auth guard ─────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <p className="text-text-muted text-sm">Please sign in to write articles.</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-primary-bg">

      {/* ── Top Bar ── */}
      <div
        className="sticky top-16 z-40 border-b border-white/5"
        style={{ background: "rgba(10,10,18,0.9)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">

          {/* Left — stats + save status */}
          <div className="flex items-center gap-4 min-w-0">
            <span className="font-mono text-xs text-text-muted whitespace-nowrap">
              {wordCount} words &middot; {readTime} min read &middot; {charCount} chars
            </span>

            <AnimatePresence mode="wait">
              {saveStatus === "saving" && (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 font-mono text-xs text-text-muted"
                >
                  <Loader2 size={11} className="animate-spin" />
                  Saving...
                </motion.span>
              )}
              {saveStatus === "saved" && (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-xs text-emerald-400"
                >
                  ✓ Saved
                </motion.span>
              )}
              {saveStatus === "unsaved" && articleId && (
                <motion.span
                  key="unsaved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-xs text-amber-400"
                >
                  Unsaved changes
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              {preview ? <EyeOff size={13} /> : <Eye size={13} />}
              {preview ? "Edit" : "Preview"}
            </button>

            <button
              onClick={() => handleSave()}
              disabled={saveStatus === "saving" || !title.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              <Save size={13} />
              Save
            </button>

            <button
              onClick={handlePublish}
              disabled={publishing || !canPublish}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-mono text-xs font-bold text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
            >
              {publishing ? <Loader2 size={13} className="animate-spin text-white" /> : <Send size={13} />}
              <span className="text-white">Publish</span>
            </button>
          </div>
        </div>

        {/* Toolbar — only in edit mode */}
        {!preview && (
          <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center gap-0.5 border-t border-white/[0.04] overflow-x-auto scrollbar-none">
            {toolbarActions.map((t, i) => (
              <ToolbarBtn
                key={i}
                icon={t.icon}
                label={t.label}
                shortcut={t.shortcut}
                onClick={t.action}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Editor / Preview ── */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {!preview ? (
          <div className="space-y-6">

            {/* Cover image */}
            <div>
              {coverImage ? (
                <div className="relative w-full h-52 rounded-2xl overflow-hidden group">
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-xs text-white transition-colors"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => setCoverImage("")}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-mono text-xs text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-32 rounded-2xl border-2 border-dashed border-white/10 hover:border-violet-500/40 flex flex-col items-center justify-center gap-2 transition-colors group"
                >
                  {uploading ? (
                    <Loader2 size={20} className="text-violet-400 animate-spin" />
                  ) : (
                    <>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ background: "rgba(124,58,237,0.15)" }}
                      >
                        <ImagePlus size={18} className="text-violet-400" />
                      </div>
                      <span className="font-mono text-xs text-text-muted">
                        Upload cover image
                      </span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </div>

            {/* Title */}
            <textarea
              placeholder="Article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              maxLength={120}
              className="w-full bg-transparent text-3xl md:text-4xl font-black text-text-primary placeholder:text-text-muted/25 resize-none focus:outline-none leading-tight"
            />

            {/* World selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <button
                  onClick={() => setWorldDropdown(!worldDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
                  style={{
                    background: selectedWorldData
                      ? `${selectedWorldData.color}15`
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selectedWorldData ? `${selectedWorldData.color}30` : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {selectedWorldData ? (
                    <>
                      <span>{selectedWorldData.emoji}</span>
                      <span className="text-text-primary font-medium">
                        {selectedWorldData.name.split(" ")[0]}
                      </span>
                    </>
                  ) : (
                    <span className="text-text-muted">Select a world</span>
                  )}
                  <ChevronDown size={13} className="text-text-muted ml-1" />
                </button>

                <AnimatePresence>
                  {worldDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute top-full mt-1 left-0 z-50 rounded-xl p-2 min-w-[200px] shadow-2xl"
                      style={{
                        background: "rgba(15,15,25,0.98)",
                        border: "1px solid rgba(124,58,237,0.2)",
                      }}
                    >
                      {worlds.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => { setSelectedWorld(w.id); setWorldDropdown(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-text-primary transition-colors text-left"
                        >
                          <span>{w.emoji}</span>
                          <span>{w.name.split(" ")[0]}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!canPublish && (
                <span className="font-mono text-xs text-text-muted opacity-50">
                  {!selectedWorld && "← select a world to publish"}
                </span>
              )}
            </div>

            {/* Tags */}
            <TagInput tags={tags} onChange={setTags} />

            {/* Content textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                placeholder={`Write your article here...\n\nTips:\n## Heading 2\n### Heading 3\n**bold**  *italic*  \`code\`\n> blockquote\n- list item\n\nDrag & drop or paste an image anywhere in here to insert it.`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handleContentImagePaste}
                onDrop={handleContentImageDrop}
                onDragOver={(e) => e.preventDefault()}
                rows={28}
                className="w-full bg-transparent text-base text-text-primary placeholder:text-text-muted/25 resize-none focus:outline-none leading-relaxed font-body"
              />
              {contentImageUploading && (
                <div
                  className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs text-violet-300"
                  style={{ background: "rgba(15,15,25,0.9)", border: "1px solid rgba(124,58,237,0.3)" }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  Uploading image...
                </div>
              )}
            </div>
            <input
              ref={contentImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleContentImageUpload(file);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          /* ── Preview Mode ── */
          <div>
            {coverImage && (
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-64 object-cover rounded-2xl mb-10"
              />
            )}
            <h1 className="text-4xl font-black text-text-primary mb-3 leading-tight">
              {title || "Untitled"}
            </h1>
            <div className="flex items-center gap-3 mb-8">
              {selectedWorldData && (
                <span
                  className="px-2.5 py-1 rounded-lg font-mono text-xs"
                  style={{
                    background: `${selectedWorldData.color}15`,
                    color: selectedWorldData.color,
                    border: `1px solid ${selectedWorldData.color}30`,
                  }}
                >
                  {selectedWorldData.emoji} {selectedWorldData.name.split(" ")[0]}
                </span>
              )}
              <span className="font-mono text-xs text-text-muted">
                {wordCount} words &middot; {readTime} min read
              </span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg font-mono text-xs text-violet-300"
                    style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div
              className="prose-arthenix text-text-primary leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: content
                  ? parseMarkdown(content)
                  : "<p class='text-text-muted'>Nothing to preview yet.</p>",
              }}
            />
          </div>
        )}
      </div>

      {/* Prose styles */}
      <style>{`
        .prose-arthenix h1 { font-size: 2rem; font-weight: 900; margin: 1.5rem 0 0.75rem; color: var(--text-primary); }
        .prose-arthenix h2 { font-size: 1.5rem; font-weight: 800; margin: 1.5rem 0 0.75rem; color: var(--text-primary); }
        .prose-arthenix h3 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: var(--text-primary); }
        .prose-arthenix p  { margin: 0.75rem 0; color: var(--text-secondary); line-height: 1.8; }
        .prose-arthenix strong { color: var(--text-primary); font-weight: 700; }
        .prose-arthenix em { color: var(--text-secondary); font-style: italic; }
        .prose-arthenix code { background: rgba(124,58,237,0.15); color: #A78BFA; padding: 2px 6px; border-radius: 4px; font-size: 0.875em; }
        .prose-arthenix blockquote { border-left: 3px solid #7C3AED; padding-left: 1rem; margin: 1rem 0; color: var(--text-muted); font-style: italic; }
        .prose-arthenix li { margin: 0.25rem 0; padding-left: 1rem; position: relative; color: var(--text-secondary); }
        .prose-arthenix li::before { content: "→"; position: absolute; left: 0; color: #7C3AED; }
        .prose-arthenix a { color: #7C3AED; text-decoration: underline; }
        .prose-arthenix img { width: 100%; border-radius: 1rem; margin: 1.5rem 0; display: block; }
      `}</style>
    </div>
  );
}