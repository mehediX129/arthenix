"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, FileText, ShoppingBag, Users,
  Loader2, ArrowRight, Eye, Heart, Star, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { worlds } from "@/lib/worlds-data";
import { useCurrencyStore } from "@/store/currencyStore";

// ─── Types ───────────────────────────────────────────────────

interface SearchArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  world_id: string;
  views_count: number;
  likes_count: number;
  published_at: string | null;
  author: { username: string; display_name: string | null; avatar_url: string | null }[] | null;
}

interface SearchProduct {
  id: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  thumbnail_url: string | null;
  sales_count: number;
  rating_avg: number;
  seller: { username: string; display_name: string | null }[] | null;
}

interface SearchUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: string;
  xp: number;
}

interface SearchResults {
  articles: SearchArticle[];
  products: SearchProduct[];
  users: SearchUser[];
}

type Tab = "all" | "articles" | "products" | "people";

// ─── Helpers ─────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Article Result Card ─────────────────────────────────────

function ArticleCard({ article }: { article: SearchArticle }) {
  const world = worlds.find((w) => w.id === article.world_id);
  const author = article.author?.[0];

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="flex gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-colors group"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {article.cover_image ? (
        <img
          src={article.cover_image}
          alt={article.title}
          className="w-20 h-16 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div
          className="w-20 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: world ? `${world.color}15` : "rgba(124,58,237,0.1)" }}
        >
          {world?.emoji ?? "📄"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {world && (
            <span
              className="font-mono text-[11px] font-bold"
              style={{ color: world.color }}
            >
              {world.emoji} {world.name.split(" ")[0]}
            </span>
          )}
          {article.published_at && (
            <span className="font-mono text-[11px] text-text-muted">
              {timeAgo(article.published_at)}
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-text-primary group-hover:text-violet-300 transition-colors line-clamp-1">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-text-muted">
          {author && (
            <span className="font-mono text-[11px]">
              {author.display_name ?? author.username}
            </span>
          )}
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Eye size={10} />
            {article.views_count}
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Heart size={10} />
            {article.likes_count}
          </span>
        </div>
      </div>
      <ArrowRight size={14} className="text-text-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// ─── Product Result Card ─────────────────────────────────────

function ProductCard({ product }: { product: SearchProduct }) {
  const { format } = useCurrencyStore();
  const seller = product.seller?.[0];

  return (
    <Link
      href={`/marketplace/${product.id}`}
      className="flex gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-colors group"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {product.thumbnail_url ? (
        <img
          src={product.thumbnail_url}
          alt={product.title}
          className="w-20 h-16 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div
          className="w-20 h-16 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(6,182,212,0.1)" }}
        >
          <ShoppingBag size={20} className="text-cyan-400 opacity-40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="font-mono text-[11px] text-text-muted capitalize">
          {product.category}
        </span>
        <h3 className="text-sm font-bold text-text-primary group-hover:text-cyan-300 transition-colors line-clamp-1 mt-0.5">
          {product.title}
        </h3>
        {product.description && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-mono text-sm font-black text-emerald-400">
            {format(product.price)}
          </span>
          {product.rating_avg > 0 && (
            <span className="flex items-center gap-0.5 font-mono text-[11px] text-amber-400">
              <Star size={10} fill="currentColor" />
              {product.rating_avg.toFixed(1)}
            </span>
          )}
          {seller && (
            <span className="font-mono text-[11px] text-text-muted">
              by {seller.display_name ?? seller.username}
            </span>
          )}
        </div>
      </div>
      <ArrowRight size={14} className="text-text-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// ─── User Result Card ────────────────────────────────────────

function UserCard({ user }: { user: SearchUser }) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-colors group"
      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.display_name ?? user.username}
          className="w-12 h-12 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-display font-black text-lg text-violet-300 shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))",
            border: "1px solid rgba(124,58,237,0.3)",
          }}
        >
          {(user.display_name ?? user.username).charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-primary group-hover:text-violet-300 transition-colors">
          {user.display_name ?? user.username}
        </p>
        <p className="font-mono text-xs text-text-muted">
          @{user.username} &middot; {user.level}
        </p>
        {user.bio && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{user.bio}</p>
        )}
      </div>
      <ArrowRight size={14} className="text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// ─── Main Search Page ────────────────────────────────────────

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const term = q.trim();

    const [articlesRes, productsRes, usersRes] = await Promise.all([
      supabase
        .from("articles")
        .select("id, title, slug, excerpt, cover_image, world_id, views_count, likes_count, published_at, author:profiles!articles_author_id_fkey(username, display_name, avatar_url)")
        .eq("is_published", true)
        .or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`)
        .order("views_count", { ascending: false })
        .limit(10),

      supabase
        .from("products")
        .select("id, title, description, price, original_price, category, thumbnail_url, sales_count, rating_avg, seller:profiles!products_seller_id_fkey(username, display_name)")
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(8),

      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, level, xp")
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(6),
    ]);

    setResults({
      articles: (articlesRes.data ?? []) as unknown as SearchArticle[],
      products: (productsRes.data ?? []) as unknown as SearchProduct[],
      users: (usersRes.data ?? []) as SearchUser[],
    });
    setLoading(false);
  }, []);

  // Search on mount if query exists
  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, [initialQuery, doSearch]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    doSearch(query.trim());
  }

  const totalCount =
    (results?.articles.length ?? 0) +
    (results?.products.length ?? 0) +
    (results?.users.length ?? 0);

  const tabs: { key: Tab; label: string; count: number; icon: React.ElementType }[] = [
    { key: "all", label: "All", count: totalCount, icon: Search },
    { key: "articles", label: "Articles", count: results?.articles.length ?? 0, icon: FileText },
    { key: "products", label: "Products", count: results?.products.length ?? 0, icon: ShoppingBag },
    { key: "people", label: "People", count: results?.users.length ?? 0, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Search size={16} className="text-violet-400" />
            <span className="font-mono text-xs text-text-muted">SEARCH</span>
          </div>
          <h1 className="font-display font-black text-3xl text-text-primary mb-6">
            Discover Arthenix
          </h1>

          {/* Search input */}
          <form onSubmit={handleSearch}>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(124,58,237,0.3)",
                boxShadow: "0 0 0 1px rgba(124,58,237,0.1)",
              }}
            >
              {loading ? (
                <Loader2 size={18} className="text-violet-400 animate-spin shrink-0" />
              ) : (
                <Search size={18} className="text-text-muted shrink-0" />
              )}
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, products, people..."
                className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted text-base outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setResults(null); }}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                disabled={!query.trim()}
                className="px-4 py-1.5 rounded-xl font-mono text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}
              >
                Search
              </button>
            </div>
          </form>
        </motion.div>

        {/* Results */}
        {results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Result count */}
            <p className="font-mono text-xs text-text-muted mb-4">
              {totalCount > 0
                ? `${totalCount} results for "${initialQuery || query}"`
                : `No results for "${initialQuery || query}"`}
            </p>

            {/* Tabs */}
            {totalCount > 0 && (
              <div
                className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors"
                      style={
                        activeTab === tab.key
                          ? { background: "#7C3AED", color: "#fff" }
                          : { color: "var(--text-muted)" }
                      }
                    >
                      <Icon size={12} />
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          className="ml-0.5 px-1.5 py-0.5 rounded-md text-[10px]"
                          style={{
                            background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {totalCount === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <Search size={24} className="text-violet-400" />
                </div>
                <p className="text-text-secondary font-body">
                  No results found
                </p>
                <p className="font-mono text-xs text-text-muted">
                  Try different keywords or check spelling
                </p>
              </div>
            )}

            {/* Articles */}
            {(activeTab === "all" || activeTab === "articles") && results.articles.length > 0 && (
              <div className="mb-8">
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-violet-400" />
                      <span className="font-mono text-xs font-bold text-text-muted">ARTICLES</span>
                    </div>
                    {results.articles.length >= 5 && (
                      <button
                        onClick={() => setActiveTab("articles")}
                        className="font-mono text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        See all →
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  {(activeTab === "all" ? results.articles.slice(0, 3) : results.articles).map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {(activeTab === "all" || activeTab === "products") && results.products.length > 0 && (
              <div className="mb-8">
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-cyan-400" />
                      <span className="font-mono text-xs font-bold text-text-muted">PRODUCTS</span>
                    </div>
                    {results.products.length >= 4 && (
                      <button
                        onClick={() => setActiveTab("products")}
                        className="font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        See all →
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  {(activeTab === "all" ? results.products.slice(0, 2) : results.products).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}

            {/* People */}
            {(activeTab === "all" || activeTab === "people") && results.users.length > 0 && (
              <div className="mb-8">
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-emerald-400" />
                      <span className="font-mono text-xs font-bold text-text-muted">PEOPLE</span>
                    </div>
                    {results.users.length >= 4 && (
                      <button
                        onClick={() => setActiveTab("people")}
                        className="font-mono text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        See all →
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  {(activeTab === "all" ? results.users.slice(0, 3) : results.users).map((u) => (
                    <UserCard key={u.id} user={u} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty state — no query */}
        {!results && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <Search size={24} className="text-violet-400" />
            </div>
            <div>
              <p className="font-display font-bold text-text-primary">
                Search across Arthenix
              </p>
              <p className="font-mono text-xs text-text-muted mt-1">
                Articles &middot; Products &middot; People
              </p>
            </div>

            {/* Popular worlds */}
            <div className="mt-4">
              <p className="font-mono text-xs text-text-muted mb-3">EXPLORE WORLDS</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {worlds.slice(0, 8).map((w) => (
                  <Link
                    key={w.id}
                    href={`/worlds/${w.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs transition-all hover:scale-105"
                    style={{
                      background: `${w.color}12`,
                      border: `1px solid ${w.color}25`,
                      color: w.color,
                    }}
                  >
                    {w.emoji} {w.name.split(" ")[0]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <Loader2 size={24} className="animate-spin text-violet-400" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}