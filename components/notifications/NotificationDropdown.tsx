"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Zap,
  TrendingUp,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import type { NotificationWithActor } from "@/types/database";

// ─── Helpers ────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationIcon(type: NotificationWithActor["type"]) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  switch (type) {
    case "article_like":
    case "post_like":
      return (
        <div className={base} style={{ background: "rgba(236,72,153,0.15)" }}>
          <Heart size={14} className="text-pink-400" fill="currentColor" />
        </div>
      );
    case "article_comment":
    case "post_comment":
      return (
        <div className={base} style={{ background: "rgba(124,58,237,0.15)" }}>
          <MessageCircle size={14} className="text-violet-400" />
        </div>
      );
    case "new_follower":
      return (
        <div className={base} style={{ background: "rgba(6,182,212,0.15)" }}>
          <UserPlus size={14} className="text-cyan-400" />
        </div>
      );
    case "xp_milestone":
    case "quest_complete":
      return (
        <div className={base} style={{ background: "rgba(245,158,11,0.15)" }}>
          <Zap size={14} className="text-amber-400" />
        </div>
      );
    case "level_up":
      return (
        <div className={base} style={{ background: "rgba(16,185,129,0.15)" }}>
          <TrendingUp size={14} className="text-emerald-400" />
        </div>
      );
  }
}

function getNotificationText(n: NotificationWithActor): string {
  const actor = n.actor_display_name ?? n.actor_username ?? "Someone";
  const title = n.entity_title ? `"${n.entity_title}"` : "your post";
  switch (n.type) {
    case "article_like":   return `${actor} liked your article ${title}`;
    case "article_comment":return `${actor} commented on ${title}`;
    case "post_like":      return `${actor} liked ${title}`;
    case "post_comment":   return `${actor} replied to ${title}`;
    case "new_follower":   return `${actor} started following you`;
    case "xp_milestone":   return n.message ?? `You reached a new XP milestone!`;
    case "level_up":       return n.message ?? `You leveled up!`;
    case "quest_complete": return n.message ?? `Daily quest completed!`;
  }
}

function getNotificationHref(n: NotificationWithActor): string {
  if (n.entity_type === "article" && n.entity_id) return `/articles/${n.entity_id}`;
  if (n.entity_type === "post" && n.entity_id) return `/community`;
  return "#";
}

// ─── Single notification row ─────────────────────────────────

function NotificationItem({ n, onRead }: { n: NotificationWithActor; onRead: (id: string) => void }) {
  const href = getNotificationHref(n);

  return (
    <Link
      href={href}
      onClick={() => { if (!n.is_read) onRead(n.id); }}
      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] relative group"
    >
      {/* Unread dot */}
      {!n.is_read && (
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: "#7C3AED" }}
        />
      )}

      {getNotificationIcon(n.type)}

      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-snug"
          style={{ color: n.is_read ? "var(--text-secondary)" : "var(--text-primary)" }}
        >
          {getNotificationText(n)}
        </p>
        <p className="font-mono text-xs text-text-muted mt-0.5">
          {timeAgo(n.created_at)}
        </p>
      </div>
    </Link>
  );
}

// ─── Main dropdown ───────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: Props) {
  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAllRead,
    markRead,
  } = useNotificationStore();

  const ref = useRef<HTMLDivElement>(null);

  // Load when opened
  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [isOpen, loadNotifications]);

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute top-full right-0 mt-2 w-[360px] rounded-2xl overflow-hidden z-50"
          style={{
            background: "rgba(15, 15, 25, 0.98)",
            border: "1px solid rgba(124, 58, 237, 0.25)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-text-muted" />
              <span className="font-display font-bold text-sm text-text-primary">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-md font-mono text-xs font-bold text-white"
                  style={{ background: "rgba(124,58,237,0.8)" }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 font-mono text-xs text-text-muted hover:text-violet-400 transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="text-violet-400 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(124,58,237,0.1)",
                    border: "1px solid rgba(124,58,237,0.2)",
                  }}
                >
                  <Bell size={20} className="text-violet-400" />
                </div>
                <p className="text-sm text-text-muted">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    onRead={(id) => markRead([id])}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/5 px-4 py-2.5">
              <p className="font-mono text-xs text-text-muted text-center">
                Showing latest {notifications.length} notifications
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}