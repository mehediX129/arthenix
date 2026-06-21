import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary-bg": "#0A0A12",
        "secondary-bg": "#12121F",
        "card-bg": "#1A1A2E",
        "accent-violet": "#7C3AED",
        "accent-cyan": "#06B6D4",
        "accent-amber": "#F59E0B",
        "accent-pink": "#EC4899",
        "accent-green": "#10B981",
        "text-primary": "#F8FAFC",
        "text-secondary": "#94A3B8",
        "text-muted": "#475569",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        accent: ["Syne", "sans-serif"],
      },
      boxShadow: {
        "glow-violet": "0 0 40px rgba(124,58,237,0.4)",
        "glow-cyan": "0 0 40px rgba(6,182,212,0.4)",
        "glow-pink": "0 0 40px rgba(236,72,153,0.4)",
        "glow-amber": "0 0 40px rgba(245,158,11,0.4)",
      },
      backgroundImage: {
        "gradient-hero":
          "linear-gradient(135deg, #7C3AED 0%, #06B6D4 50%, #EC4899 100%)",
      },
    },
  },
  plugins: [],
};

export default config;