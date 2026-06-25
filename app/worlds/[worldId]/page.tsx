"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, PenSquare } from "lucide-react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getArticlesByWorld } from "@/lib/db/articles";
import { useUser } from "@/hooks/useUser";
import { worlds } from "@/lib/worlds-data";
import type { ArticleWithAuthor } from "@/types/database";

export default function WorldFeedPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.worldId as string;
  const { user } = useUser();

  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const world = worlds.find((w) => w.id === worldId);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await getArticlesByWorld(worldId);
      if (data) setArticles(data);
      setLoading(false);
    }
    if (worldId) load();
  }, [worldId]);

  if (!world) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <p className="text-text-muted text-sm">World not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg px-4 py-8 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{world.emoji}</span>
              <h1
                className="text-3xl font-black"
                style={{ color: world.color }}
              >
                {world.name.split(" ")[0]}
              </h1>
            </div>
            <p className="text-sm text-text-muted max-w-lg">
              {world.tagline ?? `Explore articles from the ${world.name.split(" ")[0]} world.`}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {articles.length} article{articles.length !== 1 ? "s" : ""}
            </p>
          </div>

          {user && (
            <button
              onClick={() => router.push("/write")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-semibold transition-colors shrink-0"
            >
              <PenSquare size={14} />
              Write
            </button>
          )}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-text-muted" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">{world.emoji}</span>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              No articles yet
            </h3>
            <p className="text-sm text-text-muted mb-6">
              Be the first to write in the {world.name.split(" ")[0]} world!
            </p>
            {user && (
              <button
                onClick={() => router.push("/write")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-semibold transition-colors"
              >
                <PenSquare size={14} />
                Write First Article
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}