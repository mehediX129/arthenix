"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Package, Star, MessageCircle } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { Profile } from "@/types/database";

interface SellerCardProps {
  seller: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "level">;
  totalProducts?: number;
  avgRating?: number;
  totalSales?: number;
}
export default function SellerCard({
  seller,
  totalProducts = 0,
  avgRating = 0,
  totalSales = 0,
}: SellerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5"
    >
      <div className="flex items-center gap-3">
        <Avatar
          src={seller.avatar_url}
          name={seller.display_name ?? seller.username}
          level={seller.level}
          size="lg"
          showLevelBadge
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display font-bold text-text-primary text-base truncate">
              {seller.display_name ?? seller.username}
            </h3>
            <ShieldCheck size={15} className="text-[#06B6D4] shrink-0" />
          </div>
          <p className="text-text-muted text-xs">@{seller.username}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-5">
        <div className="rounded-xl bg-secondary-bg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-text-primary font-bold text-sm">
            <Package size={13} className="text-[#7C3AED]" />
            {totalProducts}
          </div>
          <span className="text-[10px] text-text-muted">Products</span>
        </div>
        <div className="rounded-xl bg-secondary-bg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-text-primary font-bold text-sm">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </div>
          <span className="text-[10px] text-text-muted">Rating</span>
        </div>
        <div className="rounded-xl bg-secondary-bg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-text-primary font-bold text-sm">
            {totalSales}
          </div>
          <span className="text-[10px] text-text-muted">Sales</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-5">
        <Link
          href={`/profile/${seller.username}`}
          className="w-full rounded-lg border border-white/10 bg-secondary-bg py-2.5 text-center text-sm font-medium text-text-primary transition-colors hover:bg-white/5"
        >
          View Shop
        </Link>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <MessageCircle size={15} />
          Message Seller
        </button>
      </div>
    </motion.div>
  );
}