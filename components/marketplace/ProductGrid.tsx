"use client";

import React from "react";
import { motion } from "framer-motion";
import { PackageSearch } from "lucide-react";
import ProductCard from "./ProductCard";
import type { ProductWithSeller } from "@/types/database";

interface ProductGridProps {
  products: ProductWithSeller[];
  loading?: boolean;
  wishlistedIds?: Set<string>;
  onToggleWishlist?: (productId: string) => void;
  onBuyNow?: (productId: string) => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-card-bg overflow-hidden animate-pulse">
      <div className="aspect-video bg-secondary-bg" />
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 w-3/4 rounded bg-secondary-bg" />
        <div className="h-3 w-1/2 rounded bg-secondary-bg" />
        <div className="h-5 w-1/3 rounded bg-secondary-bg mt-1" />
        <div className="h-8 w-full rounded-lg bg-secondary-bg mt-2" />
      </div>
    </div>
  );
}

export default function ProductGrid({
  products,
  loading = false,
  wishlistedIds,
  onToggleWishlist,
  onBuyNow,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
          <PackageSearch size={28} className="text-text-muted" />
        </div>
        <h3 className="font-display font-semibold text-text-primary text-base">
          Kono product paowa jayni
        </h3>
        <p className="text-text-muted text-sm mt-1.5 max-w-xs">
          Filter change kore abar cheshta koro, athoba shob filter shoriye dao.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
      {products.map((product, i) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
        >
          <ProductCard
            product={product}
            isWishlisted={wishlistedIds?.has(product.id) ?? false}
            onToggleWishlist={onToggleWishlist}
            onBuyNow={onBuyNow}
          />
        </motion.div>
      ))}
    </div>
  );
}