"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Star, ShoppingBag, Flame } from "lucide-react";
import type { ProductWithSeller } from "@/types/database";

export interface ProductCardProps {
  product: ProductWithSeller;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onBuyNow?: (productId: string) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  course: { label: "Course", color: "#06B6D4", bg: "rgba(6,182,212,0.15)" },
  ebook: { label: "Ebook", color: "#7C3AED", bg: "rgba(124,58,237,0.15)" },
  gaming: { label: "Gaming", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  asset: { label: "Asset", color: "#EC4899", bg: "rgba(236,72,153,0.15)" },
  tool: { label: "Tool", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
};

function getTimeLeft(endTime: string): {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    expired: false,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function ProductCard({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onBuyNow,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [timeLeft, setTimeLeft] = useState(() =>
    product.flash_sale_end ? getTimeLeft(product.flash_sale_end) : null
  );

  useEffect(() => {
    setWishlisted(isWishlisted);
  }, [isWishlisted]);

  useEffect(() => {
    if (!product.flash_sale_end) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(product.flash_sale_end!));
    }, 1000);

    return () => clearInterval(interval);
  }, [product.flash_sale_end]);

  const categoryInfo =
    CATEGORY_CONFIG[product.category] ?? CATEGORY_CONFIG.tool;

  const hasDiscount =
    product.original_price !== null &&
    product.original_price > product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.original_price! - product.price) /
          product.original_price!) *
          100
      )
    : 0;

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((prev) => !prev);
    onToggleWishlist?.(product.id);
  }

  function handleBuyClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onBuyNow?.(product.id);
  }

  const showFlashTimer = timeLeft && !timeLeft.expired;

  return (
    <Link href={`/marketplace/${product.id}`} className="group block">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl p-[1.5px] overflow-hidden"
      >
        {/* Animated gradient border — শুধু hover এ ঘোরে */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "conic-gradient(from 0deg, #7C3AED, #06B6D4, #EC4899, #7C3AED)",
            animation: "spin 3s linear infinite",
          }}
        />
        <div className="absolute inset-0 bg-[#1A1A2E] rounded-2xl group-hover:inset-[1.5px] transition-all" />

        <div className="relative rounded-2xl bg-card-bg overflow-hidden">
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-secondary-bg">
            {product.thumbnail_url ? (
              <Image
                src={product.thumbnail_url}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-muted">
                <ShoppingBag size={32} />
              </div>
            )}

            {/* Category badge */}
            <span
              className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
              style={{
                color: categoryInfo.color,
                backgroundColor: categoryInfo.bg,
                border: `1px solid ${categoryInfo.color}40`,
              }}
            >
              {categoryInfo.label}
            </span>

            {/* Flash sale countdown badge */}
            {showFlashTimer && (
              <motion.span
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-bold text-white"
              >
                <Flame size={12} />
                {pad(timeLeft!.hours)}:{pad(timeLeft!.minutes)}:
                {pad(timeLeft!.seconds)}
              </motion.span>
            )}

            {/* Wishlist heart */}
            <motion.button
              type="button"
              onClick={handleWishlistClick}
              whileTap={{ scale: 1.3 }}
              className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70"
              aria-label="Toggle wishlist"
            >
              <Heart
                size={16}
                className={
                  wishlisted
                    ? "fill-[#EC4899] text-[#EC4899]"
                    : "text-white"
                }
              />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-display font-semibold text-sm text-text-primary line-clamp-2 leading-snug">
              {product.title}
            </h3>

            {/* Seller row */}
            {product.seller && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs text-text-muted">
                  {product.seller.display_name ?? product.seller.username}
                </span>
                {product.rating_avg > 0 && (
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <Star size={9} className="fill-emerald-400" />
                    {product.rating_avg.toFixed(1)}
                  </span>
                )}
              </div>
            )}

            {/* Rating + review count */}
            {product.rating_count > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={11}
                    className={
                      i < Math.round(product.rating_avg)
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/15"
                    }
                  />
                ))}
                <span className="text-[11px] text-text-muted ml-1">
                  ({product.rating_count})
                </span>
              </div>
            )}

            {/* Price section */}
            <div className="flex items-center gap-2 mt-3">
              {hasDiscount && (
                <span className="text-xs text-text-muted line-through">
                  ৳{product.original_price!.toLocaleString()}
                </span>
              )}
              <span className="font-display font-bold text-lg text-text-primary">
                ৳{product.price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Buy Now button */}
            <button
              type="button"
              onClick={handleBuyClick}
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              Buy Now
            </button>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Link>
  );
}