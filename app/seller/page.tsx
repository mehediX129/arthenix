"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  EyeOff,
  Star,
  Loader2,
  BarChart2,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import type { SellerStats, SellerProduct, SellerOrder } from "@/types/database";

// ─── Helpers ─────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
  return `৳${n}`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function monthGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Stat Card ───────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  trend?: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded-lg"
            style={{
              background: trend >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
              color: trend >= 0 ? "#10B981" : "#EF4444",
            }}
          >
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="font-display font-black text-2xl text-text-primary">{value}</p>
      <p className="font-mono text-xs text-text-muted mt-0.5">{label}</p>
      {sub && (
        <p className="font-mono text-xs text-text-muted opacity-60 mt-1">{sub}</p>
      )}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function SellerDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<SellerStats | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) router.push("/login");
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        supabase.rpc("get_seller_stats"),
        supabase.rpc("get_seller_products"),
        supabase.rpc("get_seller_orders", { p_limit: 10 }),
      ]);
      if (statsRes.data) setStats(statsRes.data as SellerStats);
      if (productsRes.data) setProducts(productsRes.data as SellerProduct[]);
      if (ordersRes.data) setOrders(ordersRes.data as SellerOrder[]);
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleToggleActive(productId: string) {
    setTogglingId(productId);
    const supabase = createClient();
    const { data } = await supabase.rpc("toggle_product_active", {
      p_product_id: productId,
    });
    if (data !== null) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, is_active: data as boolean } : p
        )
      );
    }
    setTogglingId(null);
  }

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <Loader2 size={24} className="animate-spin text-violet-400" />
      </div>
    );
  }

  const revenueTrend = stats
    ? monthGrowth(stats.this_month, stats.last_month)
    : undefined;

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={18} className="text-cyan-400" />
              <span className="font-mono text-xs text-text-muted">SELLER DASHBOARD</span>
            </div>
            <h1 className="font-display font-black text-3xl text-text-primary">
              Store Analytics
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Manage your listings and track revenue
            </p>
          </div>
          <Link
            href="/seller/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm text-white transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #06B6D4, #7C3AED)",
              boxShadow: "0 8px 24px rgba(6,182,212,0.25)",
            }}
          >
            <Plus size={14} />
            New Product
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={28} className="animate-spin text-violet-400" />
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={DollarSign}
                label="TOTAL REVENUE"
                value={formatCurrency(stats?.total_revenue ?? 0)}
                sub={`${formatCurrency(stats?.this_month ?? 0)} this month`}
                color="#10B981"
                trend={revenueTrend}
                delay={0}
              />
              <StatCard
                icon={ShoppingBag}
                label="TOTAL SALES"
                value={formatCount(stats?.total_sales ?? 0)}
                color="#7C3AED"
                delay={0.05}
              />
              <StatCard
                icon={Package}
                label="PRODUCTS"
                value={String(stats?.total_products ?? 0)}
                sub={`${stats?.active_products ?? 0} active`}
                color="#06B6D4"
                delay={0.1}
              />
              <StatCard
                icon={TrendingUp}
                label="THIS MONTH"
                value={formatCurrency(stats?.this_month ?? 0)}
                sub="vs last month"
                color="#F59E0B"
                trend={revenueTrend}
                delay={0.15}
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">

              {/* ── Products List ── */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="font-display font-bold text-text-primary">
                      Your Products
                    </h2>
                    <span className="font-mono text-xs text-text-muted">
                      {products.length} listings
                    </span>
                  </div>

                  {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}
                      >
                        <Package size={20} className="text-cyan-400" />
                      </div>
                      <p className="text-text-muted text-sm">No products yet</p>
                      <Link
                        href="/seller/new"
                        className="font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        List your first product →
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Thumbnail */}
                          <div
                            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
                            style={{ background: "rgba(6,182,212,0.1)" }}
                          >
                            {product.thumbnail_url ? (
                              <img
                                src={product.thumbnail_url}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={16} className="text-cyan-400" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate group-hover:text-cyan-300 transition-colors">
                              {product.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs text-emerald-400 font-bold">
                                ৳{product.price}
                              </span>
                              {product.original_price && (
                                <span className="font-mono text-xs text-text-muted line-through">
                                  ৳{product.original_price}
                                </span>
                              )}
                              <span className="font-mono text-xs text-text-muted">
                                · {product.sales_count} sold
                              </span>
                              {product.rating_avg > 0 && (
                                <span className="flex items-center gap-0.5 font-mono text-xs text-amber-400">
                                  <Star size={10} fill="currentColor" />
                                  {product.rating_avg.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Toggle active */}
                          <button
                            onClick={() => handleToggleActive(product.id)}
                            disabled={togglingId === product.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors disabled:opacity-50"
                            style={{
                              background: product.is_active
                                ? "rgba(16,185,129,0.12)"
                                : "rgba(255,255,255,0.05)",
                              color: product.is_active ? "#10B981" : "var(--text-muted)",
                              border: product.is_active
                                ? "1px solid rgba(16,185,129,0.2)"
                                : "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {togglingId === product.id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : product.is_active ? (
                              <Eye size={11} />
                            ) : (
                              <EyeOff size={11} />
                            )}
                            {product.is_active ? "Live" : "Hidden"}
                          </button>

                          <Link
                            href={`/marketplace/${product.id}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-cyan-400"
                          >
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* ── Recent Orders ── */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="px-5 py-4 border-b border-white/5">
                    <h2 className="font-display font-bold text-text-primary">
                      Recent Orders
                    </h2>
                  </div>

                  {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <ShoppingBag size={24} className="text-text-muted opacity-40" />
                      <p className="text-text-muted text-sm">No orders yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {orders.map((order) => (
                        <div key={order.id} className="px-5 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {order.product_title}
                              </p>
                              <p className="font-mono text-xs text-text-muted mt-0.5">
                                @{order.buyer_username}
                              </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                              ৳{order.amount}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {order.status === "completed" ? (
                              <CheckCircle size={11} className="text-emerald-400" />
                            ) : (
                              <Clock size={11} className="text-amber-400" />
                            )}
                            <span
                              className="font-mono text-[11px] capitalize"
                              style={{
                                color: order.status === "completed" ? "#10B981" : "#F59E0B",
                              }}
                            >
                              {order.status}
                            </span>
                            <span className="font-mono text-[11px] text-text-muted ml-auto">
                              {new Date(order.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}