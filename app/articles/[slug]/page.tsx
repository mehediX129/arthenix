"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Heart, Bookmark, ArrowLeft, Clock, Eye,
  Share2, Copy, Check, List, X,
} from "lucide-react";
import {
  getArticleBySlug,
  toggleArticleLike,
  checkArticleLike,
  getArticlesByWorld,
} from "@/lib/db/articles";
import { useUser } from "@/hooks/useUser";
import { worlds } from "@/lib/worlds-data";
import { useXPToastStore } from "@/store/xpToastStore";
import { awardXP } from "@/lib/db/xp";
import FollowButton from "@/components/profile/FollowButton";
import type { ArticleWithAuthor } from "@/types/database";
import {
  incrementArticleView,
  recordArticleRead,
} from "@/lib/db/articles";

// ─── Markdown Parser ─────────────────────────────────────────

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="article-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="article-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="article-h1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="article-code">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="article-quote">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="article-li">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="article-link">$1</a>')
    .replace(/\n\n/g, '</p><p class="article-p">')
    .replace(/^(?!<[hlbcap])(.+)$/gm, '<p class="article-p">$1</p>');
}

// ─── TOC Generator ───────────────────────────────────────────

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function generateToc(content: string): TocItem[] {
  const headings = content.match(/^#{1,3} .+$/gm) ?? [];
  return headings.map((h) => {
    const level = h.match(/^#+/)?.[0].length ?? 1;
    const text = h.replace(/^#+\s/, "");
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return { id, text, level };
  });
}

// ─── Reading Progress Bar ────────────────────────────────────

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    }
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[3px] bg-white/5">
      <div
        className="h-full transition-all duration-100"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #7C3AED, #06B6D4)",
        }}
      />
    </div>
  );
}

// ─── Share Menu ──────────────────────────────────────────────

function ShareMenu({ title, slug }: { title: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/articles/${slug}`
    : "";

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  }

  const shareLinks = [
    {
      label: "Share on X",
      icon: "𝕏",
      color: "#1DA1F2",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "Share on Facebook",
      icon: "f",
      color: "#1877F2",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "Share on Discord",
      icon: "⌘",
      color: "#5865F2",
      href: `https://discord.com/channels/@me`,
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-text-muted hover:bg-white/10 transition-colors"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Share2 size={15} />
        Share
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 right-0 rounded-xl overflow-hidden w-52 z-50"
              style={{
                background: "rgba(15,15,25,0.98)",
                border: "1px solid rgba(124,58,237,0.25)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {shareLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-black"
                    style={{ background: `${s.color}20`, color: s.color }}
                  >
                    {s.icon}
                  </span>
                  {s.label}
                </a>
              ))}
              <div className="h-px bg-white/5 mx-3" />
              <button
                onClick={copyLink}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Copied!" : "Copy link"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Related Article Card ────────────────────────────────────

function RelatedCard({ article }: { article: ArticleWithAuthor }) {
  const world = worlds.find((w) => w.id === article.world_id);
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="block p-4 rounded-xl hover:bg-white/5 transition-colors group"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {world && (
        <span
          className="font-mono text-[11px] font-bold"
          style={{ color: world.color }}
        >
          {world.emoji} {world.name.split(" ")[0]}
        </span>
      )}
      <p className="text-sm font-semibold text-text-primary mt-1 line-clamp-2 group-hover:text-violet-300 transition-colors">
        {article.title}
      </p>
      <p className="font-mono text-xs text-text-muted mt-1.5">
        {article.read_time_minutes ?? 1} min read
      </p>
    </Link>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useUser();
  const { addToast } = useXPToastStore();

  const [article, setArticle] = useState<ArticleWithAuthor | null>(null);
  const [related, setRelated] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await getArticleBySlug(slug);
      if (!data) { setNotFound(true); setLoading(false); return; }
      setArticle(data);
      setLikesCount(data.likes_count ?? data.likes ?? 0);
      await incrementArticleView(data.id);
      
      // Logged-in user হলে personal reading history-তে record করা হয়
      // (anonymous/logged-out visit শুধু global views_count বাড়ায়,
      //  per-user stat-এ যোগ হয় না)।
      if (user) {
        await recordArticleRead(user.id, data.id);
      }

      if (user) {
        const isLiked = await checkArticleLike(data.id, user.id);
        setLiked(isLiked);
      }

      if (data.world_id) {
        const { data: relatedData } = await getArticlesByWorld(data.world_id, 4);
        if (relatedData) {
          setRelated(relatedData.filter((a) => a.id !== data.id).slice(0, 3));
        }
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
      await awardXP(user.id, "article_like");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary-bg px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">Article not found</h1>
        <p className="text-text-muted text-sm mt-2">This article may have been removed.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-violet-400 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const world = worlds.find((w) => w.id === article.world_id);
  const author = article.author;
  const toc = generateToc(article.content);
  const readingTime = article.read_time_minutes ?? article.read_time ?? 1;
  const viewCount = article.views_count ?? article.views ?? 0;

  return (
    <div className="min-h-screen bg-primary-bg">
      <ReadingProgress />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-10">

          {/* ── Main Column ── */}
          <div className="flex-1 min-w-0 max-w-3xl">

            {/* Back */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
            >
              <ArrowLeft size={15} />
              Back
            </button>

            {/* Cover */}
            {article.cover_image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
              >
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="w-full h-64 md:h-80 object-cover rounded-2xl"
                />
              </motion.div>
            )}

            <motion.article
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* World tag */}
              {world && (
                <div className="mb-4">
                  <Link
                    href={`/worlds/${world.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-opacity hover:opacity-80"
                    style={{ backgroundColor: `${world.color}20`, color: world.color }}
                  >
                    {world.emoji} {world.name.split(" ")[0]}
                  </Link>
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-black text-text-primary leading-tight mb-5">
                {article.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {author?.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt={author.display_name ?? author.username}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-violet-300"
                      style={{
                        background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))",
                        border: "1px solid rgba(124,58,237,0.3)",
                      }}
                    >
                      {(author?.display_name ?? author?.username ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/profile/${author?.username}`}
                      className="text-sm font-semibold text-text-primary hover:text-violet-300 transition-colors"
                    >
                      {author?.display_name ?? author?.username ?? "Unknown"}
                    </Link>
                    {article.published_at && (
                      <p className="text-xs text-text-muted">
                        {new Date(article.published_at).toLocaleDateString("en-US", {
                          month: "long", day: "numeric", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {readingTime} min read
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={13} />
                    {viewCount.toLocaleString()} views
                  </span>
                </div>
              </div>

              {/* Content */}
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(article.content) }}
              />

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-white/5">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 rounded-lg font-mono text-violet-300"
                      style={{
                        background: "rgba(124,58,237,0.1)",
                        border: "1px solid rgba(124,58,237,0.15)",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/5 flex-wrap">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleLike}
                  disabled={!user}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                  style={{
                    background: liked ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
                    color: liked ? "#F87171" : "var(--text-muted)",
                    border: liked ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Heart size={15} className={liked ? "fill-red-400 text-red-400" : ""} />
                  {likesCount}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setBookmarked(!bookmarked)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: bookmarked ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.05)",
                    color: bookmarked ? "#A78BFA" : "var(--text-muted)",
                    border: bookmarked ? "1px solid rgba(124,58,237,0.2)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Bookmark size={15} className={bookmarked ? "fill-violet-400" : ""} />
                  {bookmarked ? "Saved" : "Save"}
                </motion.button>

                <ShareMenu title={article.title} slug={article.slug} />

                {toc.length > 0 && (
                  <button
                    onClick={() => setTocOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-text-muted hover:bg-white/10 transition-colors ml-auto"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <List size={15} />
                    Contents
                  </button>
                )}
              </div>

              {/* Author card */}
              {author && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-10 p-6 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      {author.avatar_url ? (
                        <img
                          src={author.avatar_url}
                          alt={author.display_name ?? author.username}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-violet-300"
                          style={{
                            background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))",
                            border: "1px solid rgba(124,58,237,0.3)",
                          }}
                        >
                          {(author.display_name ?? author.username)[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-display font-bold text-text-primary">
                          {author.display_name ?? author.username}
                        </p>
                        <p className="text-xs text-text-muted">@{author.username}</p>
                      </div>
                    </div>
                    {user && user.id !== author.id && (
                      <FollowButton profileId={author.id} />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Related articles */}
              {related.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-display font-bold text-lg text-text-primary mb-4">
                    Related Articles
                  </h2>
                  <div className="space-y-3">
                    {related.map((a) => (
                      <RelatedCard key={a.id} article={a} />
                    ))}
                  </div>
                </div>
              )}
            </motion.article>
          </div>

          {/* ── TOC Sidebar ── */}
          {toc.length > 0 && (
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-28">
                <p className="font-mono text-xs font-bold text-text-muted mb-3">
                  ON THIS PAGE
                </p>
                <nav className="space-y-1">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-text-muted hover:text-violet-300 transition-colors py-1 leading-snug"
                      style={{
                        paddingLeft: item.level === 1 ? "0" : item.level === 2 ? "0.75rem" : "1.5rem",
                        fontSize: item.level === 3 ? "0.75rem" : "0.875rem",
                      }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile TOC Drawer */}
      <AnimatePresence>
        {tocOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTocOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 z-[101] w-72 p-6 overflow-y-auto"
              style={{
                background: "rgba(12,12,22,0.98)",
                borderLeft: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-xs font-bold text-text-muted">ON THIS PAGE</p>
                <button
                  onClick={() => setTocOpen(false)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setTocOpen(false)}
                    className="block text-sm text-text-muted hover:text-violet-300 transition-colors py-1.5"
                    style={{
                      paddingLeft: item.level === 1 ? "0" : item.level === 2 ? "0.75rem" : "1.5rem",
                    }}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Typography styles */}
      <style>{`
        .article-body { color: var(--text-secondary); line-height: 1.85; font-size: 1.0625rem; }
        .article-h1 { font-size: 1.875rem; font-weight: 900; color: var(--text-primary); margin: 2rem 0 1rem; line-height: 1.2; }
        .article-h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 1.75rem 0 0.875rem; line-height: 1.3; }
        .article-h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 1.5rem 0 0.75rem; }
        .article-p { margin: 1rem 0; }
        .article-body strong { color: var(--text-primary); font-weight: 700; }
        .article-body em { font-style: italic; }
        .article-code { background: rgba(124,58,237,0.15); color: #A78BFA; padding: 2px 7px; border-radius: 5px; font-size: 0.875em; font-family: monospace; }
        .article-quote { border-left: 3px solid #7C3AED; padding: 0.75rem 1rem; margin: 1.25rem 0; background: rgba(124,58,237,0.06); border-radius: 0 8px 8px 0; color: var(--text-muted); font-style: italic; }
        .article-li { padding-left: 1.25rem; position: relative; margin: 0.375rem 0; }
        .article-li::before { content: "\\2192"; position: absolute; left: 0; color: #7C3AED; }
        .article-link { color: #7C3AED; text-decoration: underline; text-underline-offset: 3px; }
        .article-link:hover { color: #A78BFA; }
      `}</style>
    </div>
  );
}