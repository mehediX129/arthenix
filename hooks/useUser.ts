"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/store/user-store";

/**
 * যেকোনো client component থেকে current user data পাওয়ার জন্য hook।
 * প্রথমবার mount হলে Supabase থেকে user fetch করে নেয় (যদি store এখনো initialize না হয়ে থাকে)।
 *
 * ব্যবহার:
 *   const { user, loading } = useUser();
 */
export function useUser() {
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);
  const initialized = useUserStore((state) => state.initialized);
  const fetchUser = useUserStore((state) => state.fetchUser);

  useEffect(() => {
    if (!initialized) {
      fetchUser();
    }
  }, [initialized, fetchUser]);

  return { user, loading, isLoggedIn: !!user };
}