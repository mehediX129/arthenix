import { create } from "zustand";

interface LevelUpStore {
  isOpen: boolean;
  newLevel: number;
  show: (level: number) => void;
  hide: () => void;
}

export const useLevelUpStore = create<LevelUpStore>((set) => ({
  isOpen: false,
  newLevel: 1,
  show: (level) => set({ isOpen: true, newLevel: level }),
  hide: () => set({ isOpen: false }),
}));