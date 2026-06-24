import { create } from "zustand";
import { XPToastData } from "@/components/gamification/XPToast";

let toastCounter = 0;

interface XPToastStore {
  toasts: XPToastData[];
  addToast: (xp: number, reason: string, icon?: string) => void;
  removeToast: (id: string) => void;
}

export const useXPToastStore = create<XPToastStore>((set) => ({
  toasts: [],
  addToast: (xp, reason, icon) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: `xp-toast-${++toastCounter}`, xp, reason, icon },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));