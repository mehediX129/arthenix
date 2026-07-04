"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  X,
  Clock,
  ArrowRight,
  FileText,
  Loader2,
} from "lucide-react";
import { useSearchStore } from "@/store/searchStore";
import { globalSearch, SearchResults } from "@/lib/db/search";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchModal() {
  const {
    isOpen,
    query,
    recentSearches,
    open,
    close,
    setQuery,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearchStore();

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) { close(); } else { open(); }
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, open, close]);

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    globalSearch(debouncedQuery).then(({ data }) => {
      setResults(data);
      setLoading(false);
    });
  }, [debouncedQuery]);

  const handleSelectResult = useCallback(
    (label: string) => {
      addRecentSearch(label);
      close();
    },
    [addRecentSearch, close]
  );

  const hasResults =
    results &&
    (results.articles.length > 0 || results.users.length > 0);

  const showEmpty =
    !loading &&
    debouncedQuery.trim().length >= 2 &&
    results !== null &&
    !hasResults;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 z-[101] w-full max-w-2xl px-4"
          >
            <div
              className="w-full rounded-2xl overflow-hidden"
              style={{
                background: "rgba(15, 15, 25, 0.98)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                boxShadow:
                  "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)",
              }}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                {loading ? (
                  <Loader2
                    size={18}
                    className="text-violet-400 animate-spin shrink-0"
                  />
                ) : (
                  <Search size={18} className="text-text-muted shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles, people..."
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted font-body text-base outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                <kbd className="hidden sm:flex items-center px-2 py-1 rounded-md font-mono text-xs text-text-muted border border-white/10">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {!query && recentSearches.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-text-muted">
                        RECENT SEARCHES
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="font-mono text-xs text-text-muted hover:text-violet-400 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <div key={term} className="flex items-center gap-1">
                          <button
                            onClick={() => setQuery(term)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                            style={{
                              background: "rgba(124,58,237,0.1)",
                              border: "1px solid rgba(124,58,237,0.15)",
                            }}
                          >
                            <Clock size={12} />
                            {term}
                          </button>
                          <button
                            onClick={() => removeRecentSearch(term)}
                            className="text-text-muted hover:text-text-primary transition-colors p-1"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!query && recentSearches.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(124,58,237,0.1)",
                        border: "1px solid rgba(124,58,237,0.2)",
                      }}
                    >
                      <Search size={20} className="text-violet-400" />
                    </div>
                    <p className="text-text-muted font-body text-sm">
                      Search across Arthenix
                    </p>
                    <p className="text-text-muted font-mono text-xs opacity-60">
                      Articles &middot; People
                    </p>
                  </div>
                )}

                {showEmpty && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <p className="text-text-secondary font-body text-sm">
                      No results for &ldquo;{debouncedQuery}&rdquo;
                    </p>
                    <p className="text-text-muted font-mono text-xs">
                      Try a different keyword
                    </p>
                  </div>
                )}

                {hasResults && (
                  <div className="p-3 space-y-1">
                    {results.articles.length > 0 && (
                      <div>
                        <p className="font-mono text-xs text-text-muted px-3 py-2">
                          ARTICLES
                        </p>
                        {results.articles.map((article) => (
                          <Link
                            key={article.id}
                            href={`/articles/${article.slug}`}
                            onClick={() => handleSelectResult(article.title)}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: "rgba(124,58,237,0.15)" }}
                            >
                              <FileText size={14} className="text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate group-hover:text-violet-300 transition-colors">
                                {article.title}
                              </p>
                              {article.excerpt && (
                                <p className="text-xs text-text-muted truncate mt-0.5">
                                  {article.excerpt}
                                </p>
                              )}
                            </div>
                            <ArrowRight
                              size={14}
                              className="text-text-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </Link>
                        ))}
                      </div>
                    )}

                    {results.users.length > 0 && (
                      <div>
                        <p className="font-mono text-xs text-text-muted px-3 py-2">
                          PEOPLE
                        </p>
                        {results.users.map((u) => (
                          <Link
                            key={u.id}
                            href={`/profile/${u.username}`}
                            onClick={() => handleSelectResult(u.username)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm text-violet-300"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))",
                                border: "1px solid rgba(124,58,237,0.3)",
                              }}
                            >
                              {(u.display_name ?? u.username)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate group-hover:text-violet-300 transition-colors">
                                {u.display_name ?? u.username}
                              </p>
                              <p className="text-xs text-text-muted">
                                @{u.username} &middot; {u.level}
                              </p>
                            </div>
                            <ArrowRight
                              size={14}
                              className="text-text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                      ↵
                    </kbd>
                    to select
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                      ESC
                    </kbd>
                    to close
                  </span>
                </div>
                <Link
                  href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
                  onClick={close}
                  className="font-mono text-xs text-text-muted opacity-40 hover:opacity-100 hover:text-violet-400 transition-all"
                >
                  See all results →
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}