import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT = 8;

interface SearchStore {
  isOpen: boolean;
  query: string;
  recentSearches: string[];
  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      isOpen: false,
      query: "",
      recentSearches: [],

      open: () => set({ isOpen: true, query: "" }),
      close: () => set({ isOpen: false }),
      setQuery: (q: string) => set({ query: q }),

      addRecentSearch: (term: string) =>
        set((state) => {
          const trimmed = term.trim();
          if (!trimmed) return state;
          const filtered = state.recentSearches.filter(
            (s) => s.toLowerCase() !== trimmed.toLowerCase()
          );
          return {
            recentSearches: [trimmed, ...filtered].slice(0, MAX_RECENT),
          };
        }),

      removeRecentSearch: (term: string) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s !== term),
        })),

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "arthenix-search",
      partialize: (state) => ({ recentSearches: state.recentSearches }) as SearchStore,
    }
  )
);