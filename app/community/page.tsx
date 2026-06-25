"use client";

import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { PostCard } from "@/components/community/PostCard";
import { CreatePost } from "@/components/community/CreatePost";
import { getPosts, deletePost } from "@/lib/db/posts";
import { useUser } from "@/hooks/useUser";
import { worlds } from "@/lib/worlds-data";
import type { PostWithAuthor } from "@/types/database";

export default function CommunityPage() {
  // call hook to initialize user state; value isn't needed here
  useUser();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorld, setActiveWorld] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await getPosts(
        activeWorld === "all" ? undefined : activeWorld
      );
      if (data) setPosts(data);
      setLoading(false);
    }
    load();
  }, [activeWorld]);

  async function handleDelete(postId: string) {
    await deletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handlePostCreated(post: PostWithAuthor) {
    setPosts((prev) => [post, ...prev]);
  }

  return (
    <div className="min-h-screen bg-primary-bg px-4 py-8 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Users size={20} className="text-yellow-400" />
          <div>
            <h1 className="text-2xl font-black text-text-primary">Community</h1>
            <p className="text-xs text-text-muted">
              Discuss, share, and connect across all 12 worlds
            </p>
          </div>
        </div>

        {/* World filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => setActiveWorld("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeWorld === "all"
                ? "bg-yellow-400 text-black"
                : "bg-white/5 text-text-muted hover:bg-white/10"
            }`}
          >
            All Worlds
          </button>
          {worlds.map((w) => (
            <button
              key={w.id}
              onClick={() => setActiveWorld(w.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeWorld === w.id
                  ? "text-black"
                  : "bg-white/5 text-text-muted hover:bg-white/10"
              }`}
              style={
                activeWorld === w.id
                  ? { backgroundColor: w.color }
                  : undefined
              }
            >
              {w.emoji} {w.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Create post */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-text-muted" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">💬</span>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              No posts yet
            </h3>
            <p className="text-sm text-text-muted">
              Be the first to start a conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                index={i}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}