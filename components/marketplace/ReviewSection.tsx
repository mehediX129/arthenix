"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ThumbsUp, Loader2, MessageSquarePlus } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import {
  getProductReviews,
  getRatingBreakdown,
  submitReview,
} from "@/lib/db/reviews";
import { createClient } from "@/lib/supabase/client";
import type { ReviewWithReviewer } from "@/types/database";

interface ReviewSectionProps {
  productId: string;
  ratingAvg: number;
  ratingCount: number;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

function StarRow({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-white/15"
          }
        />
      ))}
    </div>
  );
}

export default function ReviewSection({
  productId,
  ratingAvg,
  ratingCount,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([]);
  const [breakdown, setBreakdown] = useState<Record<1 | 2 | 3 | 4 | 5, number>>(
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [reviewsResult, breakdownResult] = await Promise.all([
        getProductReviews(productId),
        getRatingBreakdown(productId),
      ]);

      if (reviewsResult.data) setReviews(reviewsResult.data);
      if (breakdownResult.data) setBreakdown(breakdownResult.data);

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);

      setLoading(false);
    }

    load();
  }, [productId]);

  const userAlreadyReviewed = reviews.some(
    (r) => r.reviewer_id === currentUserId
  );

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!currentUserId) {
      setFormError("Review দিতে হলে আগে sign in করতে হবে।");
      return;
    }
    if (formRating === 0) {
      setFormError("একটা rating সিলেক্ট করো।");
      return;
    }

    setSubmitting(true);

    const { data, error } = await submitReview({
      product_id: productId,
      reviewer_id: currentUserId,
      rating: formRating,
      comment: formComment.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    if (data) {
      setReviews((prev) => [data, ...prev]);
      setBreakdown((prev) => ({
        ...prev,
        [formRating]: prev[formRating as 1 | 2 | 3 | 4 | 5] + 1,
      }));
    }

    setShowForm(false);
    setFormRating(0);
    setFormComment("");
  }

  const maxBreakdownCount = Math.max(...Object.values(breakdown), 1);

  return (
    <div className="rounded-2xl border border-white/10 bg-card-bg/60 backdrop-blur-sm p-5 md:p-7">
      <h2 className="font-display font-bold text-text-primary text-lg mb-5">
        Reviews
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-text-muted" />
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 pb-6 border-b border-white/10">
            <div className="flex flex-col items-center sm:items-start shrink-0">
              <span className="font-display font-black text-4xl text-text-primary">
                {ratingAvg > 0 ? ratingAvg.toFixed(1) : "—"}
              </span>
              <StarRow rating={Math.round(ratingAvg)} size={15} />
              <span className="text-xs text-text-muted mt-1">
                {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
              </span>
            </div>

            <div className="flex-1 space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = breakdown[star];
                const pct = (count / maxBreakdownCount) * 100;
                return (
                  <div key={star} className="flex items-center gap-2.5">
                    <span className="text-xs text-text-muted w-8 shrink-0">
                      {star} ★
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: (5 - star) * 0.05 }}
                        className="h-full rounded-full bg-amber-400"
                      />
                    </div>
                    <span className="text-xs text-text-muted w-6 shrink-0 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write review trigger */}
          {!showForm && !userAlreadyReviewed && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 mt-5 rounded-lg border border-white/10 bg-secondary-bg px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-white/5"
            >
              <MessageSquarePlus size={16} />
              Write a Review
            </button>
          )}

          {userAlreadyReviewed && (
            <p className="mt-5 text-xs text-text-muted">
              তুমি ইতিমধ্যে এই প্রোডাক্টে review দিয়েছো।
            </p>
          )}

          {/* Review form */}
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handleSubmitReview}
              className="mt-5 rounded-xl bg-secondary-bg p-4"
            >
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Your rating
              </label>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={22}
                        className={
                          value <= (hoverRating || formRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-white/20"
                        }
                      />
                    </button>
                  );
                })}
              </div>

              <label className="block text-xs font-medium text-text-secondary mb-2">
                Comment (optional)
              </label>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                rows={3}
                placeholder="তোমার অভিজ্ঞতা শেয়ার করো..."
                className="w-full rounded-lg bg-card-bg border border-white/10 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 resize-none"
              />

              {formError && (
                <p className="text-xs text-red-400 mt-2">{formError}</p>
              )}

              <div className="flex items-center gap-2.5 mt-3.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Submit Review"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}

          {/* Review list */}
          <div className="mt-6 space-y-5">
            {reviews.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">
                এখনো কোনো review নেই। প্রথম review তুমিই দাও!
              </p>
            )}

            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.3) }}
                className="flex gap-3 pb-5 border-b border-white/5 last:border-0 last:pb-0"
              >
                <Avatar
                  src={review.reviewer?.avatar_url ?? null}
                  name={review.reviewer?.username ?? "User"}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary">
                      {review.reviewer?.username ?? "Anonymous"}
                    </span>
                    <span className="text-xs text-text-muted">
                      {timeAgo(review.created_at)}
                    </span>
                  </div>
                  <StarRow rating={review.rating} size={12} />
                  {review.comment && (
                    <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 mt-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <ThumbsUp size={12} />
                    Helpful {review.helpful_count > 0 && `(${review.helpful_count})`}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}