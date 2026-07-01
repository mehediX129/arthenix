import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { getLevelFromXP, type UserLevel } from "@/lib/utils/gamification";
import { checkAndUpdateStreak } from "@/lib/db/streak";

export interface ArthenixUser {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  xp: number;
  level: UserLevel;
  selected_worlds: string[];
  is_seller: boolean;
  streak_days: number;
}

interface UserStoreState {
  user: ArthenixUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: ArthenixUser | null) => void;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
  updateXP: (newXP: number) => void;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user, loading: false, initialized: true }),

  clearUser: () => set({ user: null, loading: false, initialized: true }),

  /**
   * Supabase auth session + profiles table থেকে পুরো user data fetch করে
   * store-এ populate করে। App mount হওয়ার সময় একবার call হয়।
   * Streak update এখানেই trigger হয় — user load হওয়ার সাথে সাথে,
   * তাই প্রতিদিন app খুললেই streak count বাড়ে।
   */
  fetchUser: async () => {
    set({ loading: true });
    const supabase = createClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      set({ user: null, loading: false, initialized: true });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, xp, selected_worlds, is_seller, streak_days")
      .eq("id", authUser.id)
      .single();

    const xp = profile?.xp ?? 0;

    // Streak atomically update করা হচ্ছে — same-day guard RPC-এর ভেতরেই
    // আছে, তাই বারবার app refresh করলেও streak ভুলভাবে বাড়বে না।
    const streakResult = await checkAndUpdateStreak(authUser.id);
    const streakDays = streakResult.error
      ? (profile?.streak_days ?? 0)
      : streakResult.streakDays;

    set({
      user: {
        id: authUser.id,
        username:
          profile?.username ??
          authUser.user_metadata?.full_name ??
          authUser.email?.split("@")[0] ??
          "User",
        email: authUser.email ?? "",
        avatar_url: profile?.avatar_url ?? null,
        xp,
        level: getLevelFromXP(xp),
        selected_worlds: profile?.selected_worlds ?? [],
        is_seller: profile?.is_seller ?? false,
        streak_days: streakDays,
      },
      loading: false,
      initialized: true,
    });
  },

  /**
   * XP optimistically আপডেট করে (quest complete করার সাথে সাথে
   * UI-তে XP দেখানোর জন্য), level recalculate করে নেয়।
   */
  updateXP: (newXP) => {
    const current = get().user;
    if (!current) return;
    set({
      user: { ...current, xp: newXP, level: getLevelFromXP(newXP) },
    });
  },
}));