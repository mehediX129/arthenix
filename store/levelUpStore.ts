import { create } from "zustand";
import type { UserLevel } from "@/lib/utils/gamification";

interface LevelUpStore {
  isOpen: boolean;
  newLevel: UserLevel;
  show: (level: UserLevel) => void;
  hide: () => void;
}

export const useLevelUpStore = create<LevelUpStore>((set) => ({
  isOpen: false,
  newLevel: "Novice",
  show: (level) => set({ isOpen: true, newLevel: level }),
  hide: () => set({ isOpen: false }),
}));