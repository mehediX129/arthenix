"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  ImagePlus,
  Upload,
  Loader2,
  ChevronDown,
  X,
  ArrowLeft,
} from "lucide-react";
import { createProduct } from "@/lib/db/products";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { worlds } from "@/lib/worlds-data";
import type { ProductCategory } from "@/types/database";

// Ensure the array is treated as ProductCategory[] to satisfy TS union typing
const CATEGORIES: ProductCategory[] = [
  "ebook",
  "course",
  "template",
  "tool",
  "art",
  "music",
  "other",
] as ProductCategory[];

export default function NewProductPage() {
  const { user } = useUser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>("ebook");
  const [worldId, setWorldId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    if (!user) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `products/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("article-covers")
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage
        .from("article-covers")
        .getPublicUrl(path);
      setThumbnailUrl(data.publicUrl);
    }
    setUploading(false);
  }

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  }

  async function handleSubmit() {
    if (!user || !title || !price || !category) return;
    setSubmitting(true);

    const { error } = await createProduct({
      title,
      description: description || null,
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      category,
      seller_id: user.id,
      thumbnail_url: thumbnailUrl || null,
      tags,
      is_active: true,
    });

    if (!error) {
      router.push("/seller");
    }
    setSubmitting(false);
  }

  const canSubmit = title && price && category && !submitting;

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft size={13} />
            Back
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-cyan-400" />
            <span className="font-mono text-xs text-text-muted">NEW LISTING</span>
          </div>
          <h1 className="font-display font-black text-3xl text-text-primary">
            List a Product
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Thumbnail upload */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-2">
              PRODUCT THUMBNAIL
            </label>
            {thumbnailUrl ? (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden group">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-xs text-white"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => setThumbnailUrl("")}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-mono text-xs text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 flex flex-col items-center justify-center gap-2 transition-colors group"
              >
                {uploading ? (
                  <Loader2 size={20} className="text-cyan-400 animate-spin" />
                ) : (
                  <>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ background: "rgba(6,182,212,0.15)" }}
                    >
                      <ImagePlus size={18} className="text-cyan-400" />
                    </div>
                    <span className="font-mono text-xs text-text-muted">
                      Upload thumbnail
                    </span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </div>

          {/* Title */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-2">
              PRODUCT TITLE *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ultimate React UI Kit"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-2">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's included..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
            />
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-xs text-text-muted block mb-2">
                PRICE (৳) *
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="299"
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-text-muted block mb-2">
                ORIGINAL PRICE (৳)
              </label>
              <input
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="499"
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Category + World row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category dropdown */}
            <div>
              <label className="font-mono text-xs text-text-muted block mb-2">
                CATEGORY *
              </label>
              <div className="relative">
                <button
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8 text-sm text-text-primary focus:outline-none"
                >
                  <span className="capitalize">{category}</span>
                  <ChevronDown size={14} className="text-text-muted" />
                </button>
                {categoryOpen && (
                  <div
                    className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl p-1 shadow-2xl"
                    style={{
                      background: "rgba(15,15,25,0.98)",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCategory(c); setCategoryOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm capitalize text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* World dropdown */}
            <div>
              <label className="font-mono text-xs text-text-muted block mb-2">
                WORLD
              </label>
              <div className="relative">
                <button
                  onClick={() => setWorldOpen(!worldOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8 text-sm focus:outline-none"
                >
                  {worldId ? (
                    <span className="text-text-primary">
                      {worlds.find((w) => w.id === worldId)?.emoji}{" "}
                      {worlds.find((w) => w.id === worldId)?.name.split(" ")[0]}
                    </span>
                  ) : (
                    <span className="text-text-muted">Optional</span>
                  )}
                  <ChevronDown size={14} className="text-text-muted" />
                </button>
                {worldOpen && (
                  <div
                    className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl p-1 shadow-2xl max-h-48 overflow-y-auto"
                    style={{
                      background: "rgba(15,15,25,0.98)",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    <button
                      onClick={() => { setWorldId(""); setWorldOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-muted hover:bg-white/5 transition-colors"
                    >
                      None
                    </button>
                    {worlds.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => { setWorldId(w.id); setWorldOpen(false); }}
                        className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                      >
                        <span>{w.emoji}</span>
                        <span>{w.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="font-mono text-xs text-text-muted block mb-2">
              TAGS
            </label>
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8 min-h-[48px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs text-cyan-300"
                  style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.2)" }}
                >
                  #{tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              {tags.length < 8 && (
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                      setTags(tags.slice(0, -1));
                    }
                  }}
                  placeholder={tags.length === 0 ? "Add tags (Enter)..." : "Add tag..."}
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-text-muted placeholder:text-text-muted/40 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: "linear-gradient(135deg, #06B6D4, #7C3AED)",
              boxShadow: canSubmit ? "0 8px 24px rgba(6,182,212,0.25)" : "none",
            }}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {submitting ? "Publishing..." : "Publish Product"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}