import { create } from "zustand";
import type { NotificationWithActor } from "@/types/database";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/db/notifications";

interface NotificationStore {
  notifications: NotificationWithActor[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  // Actions
  loadNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
  addRealtime: (n: NotificationWithActor) => void;
}

const PAGE_SIZE = 20;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  hasMore: true,

  loadNotifications: async () => {
    set({ loading: true });
    const { data } = await fetchNotifications(PAGE_SIZE, 0);
    set({
      notifications: data ?? [],
      loading: false,
      hasMore: (data?.length ?? 0) === PAGE_SIZE,
    });
  },

  loadMore: async () => {
    const { notifications, loading, hasMore } = get();
    if (loading || !hasMore) return;
    set({ loading: true });
    const { data } = await fetchNotifications(PAGE_SIZE, notifications.length);
    const newItems = data ?? [];
    set({
      notifications: [...notifications, ...newItems],
      loading: false,
      hasMore: newItems.length === PAGE_SIZE,
    });
  },

  loadUnreadCount: async () => {
    const count = await fetchUnreadCount();
    set({ unreadCount: count });
  },

  markAllRead: async () => {
    await markAllAsRead();
    set((state) => ({
      unreadCount: 0,
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    }));
  },

  markRead: async (ids: string[]) => {
    await markAsRead(ids);
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - ids.length),
      notifications: state.notifications.map((n) =>
        ids.includes(n.id) ? { ...n, is_read: true } : n
      ),
    }));
  },

  addRealtime: (n: NotificationWithActor) => {
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));