import { create } from "zustand";

export type OnboardingStep =
  | "login"
  | "worlds"
  | "tour"
  | "achievement"
  | "article"
  | "welcome";

interface OnboardingStoreState {
  step: OnboardingStep;
  firstName: string;
  selectedWorldIds: string[];
  setStep: (step: OnboardingStep) => void;
  setFirstName: (name: string) => void;
  setSelectedWorldIds: (ids: string[]) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStoreState>((set) => ({
  step: "login",
  firstName: "",
  selectedWorldIds: [],

  setStep: (step) => set({ step }),
  setFirstName: (firstName) => set({ firstName }),
  setSelectedWorldIds: (selectedWorldIds) => set({ selectedWorldIds }),

  reset: () =>
    set({ step: "login", firstName: "", selectedWorldIds: [] }),
}));