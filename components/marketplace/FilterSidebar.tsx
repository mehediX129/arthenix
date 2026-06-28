"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import type { ProductCategory, ProductFilters } from "@/types/database";

interface FilterSidebarProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "course", label: "Courses" },
  { value: "ebook", label: "Ebooks" },
  { value: "asset", label: "Assets" },
  { value: "gaming", label: "Gaming" },
  { value: "tool", label: "Tools" },
];

const USD_RANGES = [
  { label: "Under $5",    min: 0,  max: 5        },
  { label: "$5 – $20",   min: 5,  max: 20       },
  { label: "$20 – $50",  min: 20, max: 50       },
  { label: "$50+",        min: 50, max: undefined },
];

const BDT_RANGES = [
  { label: "Under ৳500",        min: 0,    max: 500       },
  { label: "৳500 – ৳2,000",    min: 500,  max: 2000      },
  { label: "৳2,000 – ৳5,000",  min: 2000, max: 5000      },
  { label: "৳5,000+",           min: 5000, max: undefined  },
];

const RATINGS = [4, 3, 2];

export default function FilterSidebar({
  filters,
  onChange,
  onClear,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const { currency } = useCurrencyStore();
  const PRICE_RANGES = currency === "USD" ? USD_RANGES : BDT_RANGES;

  function toggleCategory(category: ProductCategory) {
    onChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  }

  function setPriceRange(min: number, max: number | undefined) {
    const isActive = filters.minPrice === min && filters.maxPrice === max;
    onChange({
      ...filters,
      minPrice: isActive ? undefined : min,
      maxPrice: isActive ? undefined : max,
    });
  }

  function setMinRating(rating: number) {
    onChange({
      ...filters,
      minRating: filters.minRating === rating ? undefined : rating,
    });
  }

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.minRating !== undefined ? 1 : 0);

  const content = (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-text-secondary" />
          <h2 className="font-display font-bold text-text-primary text-sm">
            Filters
          </h2>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-[#7C3AED] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-[#06B6D4] hover:text-[#7C3AED] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Category
        </h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <input
                type="checkbox"
                checked={filters.category === cat.value}
                onChange={() => toggleCategory(cat.value)}
                className="h-4 w-4 rounded border-white/20 bg-secondary-bg accent-[#7C3AED]"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            Price
          </h3>
          <span
            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg"
            style={{
              background: currency === "USD" ? "rgba(124,58,237,0.15)" : "rgba(6,182,212,0.15)",
              color: currency === "USD" ? "#A78BFA" : "#67E8F9",
            }}
          >
            {currency}
          </span>
        </div>
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <label
              key={range.label}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <input
                type="checkbox"
                checked={
                  filters.minPrice === range.min &&
                  filters.maxPrice === range.max
                }
                onChange={() => setPriceRange(range.min, range.max)}
                className="h-4 w-4 rounded border-white/20 bg-secondary-bg accent-[#7C3AED]"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Minimum Rating
        </h3>
        <div className="space-y-2">
          {RATINGS.map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <input
                type="checkbox"
                checked={filters.minRating === rating}
                onChange={() => setMinRating(rating)}
                className="h-4 w-4 rounded border-white/20 bg-secondary-bg accent-[#7C3AED]"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                {rating}+ stars
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5">
          {content}
        </div>
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed left-0 top-0 z-50 h-full w-[85%] max-w-sm overflow-y-auto bg-primary-bg p-5 lg:hidden"
            >
              <button
                type="button"
                onClick={onClose}
                className="mb-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-text-secondary"
              >
                <X size={16} />
              </button>
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}