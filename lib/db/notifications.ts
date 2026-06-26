import { createClient } from "@/lib/supabase/client";
import type { NotificationWithActor } from "@/types/database";

export async function fetchNotifications(limit = 20, offset = 0): Promise<{
  data: NotificationWithActor[] | null;
  error: string | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_notifications", {
    p_limit: limit,
    p_offset: offset,
  });
  return {
    data: data as NotificationWithActor[] | null,
    error: error?.message ?? null,
  };
}

export async function fetchUnreadCount(): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_unread_notification_count");
  return (data as number) ?? 0;
}

export async function markAllAsRead(): Promise<void> {
  const supabase = createClient();
  await supabase.rpc("mark_notifications_read", { p_ids: null });
}

export async function markAsRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const supabase = createClient();
  await supabase.rpc("mark_notifications_read", { p_ids: ids });
}