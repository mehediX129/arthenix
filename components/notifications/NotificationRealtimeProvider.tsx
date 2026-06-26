"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationStore } from "@/store/notificationStore";
import { useUser } from "@/hooks/useUser";
import type { NotificationWithActor } from "@/types/database";

export default function NotificationRealtimeProvider() {
  const { user } = useUser();
  const { addRealtime, loadUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", payload.new.actor_id)
            .single()
            .then(({ data: actor }) => {
              const n: NotificationWithActor = {
                ...(payload.new as NotificationWithActor),
                actor_username: actor?.username ?? null,
                actor_display_name: actor?.display_name ?? null,
                actor_avatar_url: actor?.avatar_url ?? null,
              };
              addRealtime(n);
            });
        }
      )
      .subscribe();

    loadUnreadCount();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, addRealtime, loadUnreadCount]);

  return null;
}