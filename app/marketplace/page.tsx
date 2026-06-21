"use client";

import React, { useEffect, useState, useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";
import FilterSidebar from "@/components/marketplace/FilterSidebar";
import SearchBar from "@/components/marketplace/SearchBar";
import ProductGrid from "@/components/marketplace/ProductGrid";
import { getProducts, searchProducts } from "@/lib/db/products";
import { createClient } from "@/lib/supabase/client";
import type { ProductFilters, ProductWithSeller } from "@/types/database";

export default function MarketplacePage() {
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);

    if (searchQuery.trim().length > 0) {
      const { data } = await searchProducts(searchQuery);
      setProducts(
        (data ?? []).map((p) => ({ ...p, seller: null })) as ProductWithSeller[]
      );
    } else {
      const { data } = await getProducts(filters, 1, 24);
      setProducts(data?.data ?? []);
    }

    setLoading(false);
  }, [filters, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function handleToggleWishlist(productId: string) {
    if (!currentUserId) {
      return;
    }

    const supabase = createClient();
    const isCurrentlyWishlisted = wishlistedIds.has(productId);

    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyWishlisted) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    if (isCurrentlyWishlisted) {
      await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", currentUserId)
        .eq("product_id", productId);
    } else {
      await supabase
        .from("wishlists")
        .insert({ user_id: currentUserId, product_id: productId });
    }
  }

  function handleBuyNow(productId: string) {
    window.location.href = `/marketplace/${productId}`;
  }

  return (
    <div className="min-h-screen bg-primary-bg px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-black text-text-primary">
            Marketplace
          </h1>
          <p className="text-text-secondary mt-1.5 text-sm">
            Course, ebook, gaming asset ar tools - shob ek jaygay.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-secondary-bg text-text-secondary lg:hidden"
            aria-label="Open filters"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="flex gap-8">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({})}
            isOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
          />

          <div className="flex-1 min-w-0">
            <ProductGrid
              products={products}
              loading={loading}
              wishlistedIds={wishlistedIds}
              onToggleWishlist={handleToggleWishlist}
              onBuyNow={handleBuyNow}
            />
          </div>
        </div>
      </div>
    </div>
  );
}