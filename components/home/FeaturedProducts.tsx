"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Star, ArrowRight, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FeaturedProduct {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  category: string;
  thumbnail_url: string | null;
  sales_count: number;
  rating_avg: number;
  seller_username: string;
  seller_display_name: string | null;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("get_featured_products", { p_limit: 4 }).then(({ data }) => {
      setProducts((data as FeaturedProduct[]) ?? []);
      setLoading(false);
    });
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section
      className="py-16"
      style={{ background: "rgba(6,182,212,0.03)", borderTop: "1px solid rgba(6,182,212,0.08)", borderBottom: "1px solid rgba(6,182,212,0.08)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag size={16} className="text-cyan-400" />
              <span className="font-mono text-xs text-text-muted">MARKETPLACE</span>
            </div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-text-primary">
              Featured Products
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="hidden md:flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-cyan-400 transition-colors"
          >
            Browse all
            <ArrowRight size={13} />
          </Link>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl h-64 animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)" }}
              />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  href={`/marketplace/${product.id}`}
                  className="block rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {/* Thumbnail */}
                  <div className="h-40 overflow-hidden relative">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: "rgba(6,182,212,0.1)" }}
                      >
                        <Package size={32} className="text-cyan-400 opacity-40" />
                      </div>
                    )}
                    {product.original_price && product.original_price > product.price && (
                      <span
                        className="absolute top-2 right-2 font-mono text-xs font-bold px-2 py-0.5 rounded-lg text-white"
                        style={{ background: "#EF4444" }}
                      >
                        -{Math.round((1 - product.price / product.original_price) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <span className="font-mono text-[11px] text-text-muted capitalize">
                      {product.category}
                    </span>
                    <h3 className="font-display font-bold text-sm text-text-primary mt-1 mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-base font-black text-emerald-400">
                          ৳{product.price}
                        </span>
                        {product.original_price && (
                          <span className="font-mono text-xs text-text-muted line-through ml-1.5">
                            ৳{product.original_price}
                          </span>
                        )}
                      </div>
                      {product.rating_avg > 0 && (
                        <span className="flex items-center gap-0.5 font-mono text-xs text-amber-400">
                          <Star size={11} fill="currentColor" />
                          {product.rating_avg.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}