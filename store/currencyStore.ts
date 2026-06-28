import { create } from "zustand";
import { persist } from "zustand/middleware";

const USD_TO_BDT = 110;

type Currency = "USD" | "BDT";

interface CurrencyStore {
  currency: Currency;
  toggle: () => void;
  format: (amount: number) => string;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: "USD",

      toggle: () =>
        set((state) => ({
          currency: state.currency === "USD" ? "BDT" : "USD",
        })),

      format: (amount: number) => {
        const { currency } = get();
        if (currency === "BDT") {
          const bdt = Math.round(amount * USD_TO_BDT);
          return `৳${bdt.toLocaleString()}`;
        }
        return `$${amount.toLocaleString()}`;
      },
    }),
    {
      name: "arthenix-currency",
    }
  )
);