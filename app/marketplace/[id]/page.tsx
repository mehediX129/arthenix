"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react";
import ProductGallery from "@/components/marketplace/ProductGallery";
import SellerCard from "@/components/marketplace/SellerCard";
import PriceHistory from "@/components/marketplace/PriceHistory";
import ReviewSection from "@/components/marketplace/ReviewSection";
import {
  getProductById,
  getPriceHistory,
  getLowestPrice30Days,
} from "@/lib/db/products";
import type {
  ProductWithSeller,
  PriceHistoryPoint,
} from "@/types/database";

const CATEGORY_LABELS: Record<string, string> = {
  course: "Course",
  ebook: "Ebook",
  asset: "Asset",
  gaming: "Gaming",
  tool: "Tool",
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [lowestPrice30d, setLowestPrice30d] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const productResult = await getProductById(productId);

      if (!productResult.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(productResult.data);

      const [historyResult, lowestResult] = await Promise.all([
        getPriceHistory(productId),
        getLowestPrice30Days(productId),
      ]);

      if (historyResult.data) setPriceHistory(historyResult.data);
      if (lowestResult.data !== null) setLowestPrice30d(lowestResult.data);

      setLoading(false);
    }

    if (productId) load();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <Loader2 size={28} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary-bg px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Product paowa jayni
        </h1>
        <p className="text-text-muted text-sm mt-2">
          Eta delete hoye gechhe athoba link ta vul.
        </p>
        <button
          type="button"
          onClick={() => router.push("/marketplace")}
          className="mt-6 flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-5 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft size={15} />
          Marketplace e ferot jao
        </button>
      </div>
    );
  }

  const images = product.thumbnail_url ? [product.thumbnail_url] : [];
  const hasDiscount =
    product.original_price !== null && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.original_price! - product.price) / product.original_price!) *
          100
      )
    : 0;

  function handleBuyNow() {
    // Phase 4D (Stripe) e checkout flow eikhane start hobe.
    alert("Checkout system shiggrhi ashche! (Phase 4D)");
  }

  return (
    <div className="min-h-screen bg-primary-bg px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push("/marketplace")}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to Marketplace
        </button>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Left column */}
          <div className="space-y-6">
            <ProductGallery images={images} productTitle={product.title} />

            <div>
              <span className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wide">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </span>
              <h1 className="font-display text-2xl md:text-3xl font-black text-text-primary mt-1.5">
                {product.title}
              </h1>

              {product.description && (
                <p className="text-text-secondary text-sm leading-relaxed mt-4 whitespace-pre-line">
                  {product.description}
                </p>
              )}
            </div>

            {priceHistory.length >= 2 && (
              <PriceHistory
                history={priceHistory}
                currentPrice={product.price}
                lowestPrice30d={lowestPrice30d}
              />
            )}

            <ReviewSection
              productId={product.id}
              ratingAvg={product.rating_avg}
              ratingCount={product.rating_count}
            />
          </div>

          {/* Right column — sticky purchase panel */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-24 rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5"
            >
              <div className="flex items-center gap-2.5">
                {hasDiscount && (
                  <span className="text-sm text-text-muted line-through">
                    Tk {product.original_price!.toLocaleString()}
                  </span>
                )}
                <span className="font-display font-black text-3xl text-text-primary">
                  Tk {product.price.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full mt-5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Buy Now
              </button>

              <div className="flex items-center gap-2 mt-4 text-xs text-text-muted">
                <ShieldCheck size={14} className="text-[#06B6D4] shrink-0" />
                Secure checkout, instant access
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                <RefreshCw size={14} className="text-[#06B6D4] shrink-0" />
                {product.sales_count} sales so far
              </div>
            </motion.div>

            {product.seller && (
              <SellerCard seller={product.seller} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}