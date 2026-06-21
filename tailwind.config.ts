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
        brand: "#c1614d",
        "brand-hover": "#d4705a",
        "brand-light": "#f5e8e0",
        "brand-subtle": "#e8c8b8",
        cream: "#f7f2ed",
        ink: "#2c2a38",
        "ink-light": "#7a6e6e",
        "ink-muted": "#ada0a0",
        border: "#e8e0da",
        "border-light": "#f0eae5",
        card: "#ffffff",
        sage: "#7a9a7a",
        gold: "#c9a84c",
        rose: "#c17070",
        lavender: "#9a8ab5",
        sidebar: "#2c2a38",
        // Dark theme colors
        dark: "#0a0a0f",
        "dark-card": "rgba(255,255,255,0.05)",
        "dark-border": "rgba(255,255,255,0.08)",
        "dark-border-light": "rgba(255,255,255,0.06)",
        "dark-text": "rgba(255,255,255,0.8)",
        "dark-text-muted": "rgba(255,255,255,0.4)",
        "dark-text-dim": "rgba(255,255,255,0.6)",
        glow: {
          purple: "#8b5cf6",
          teal: "#14b8a6",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      boxShadow: {
        warm: "0 1px 3px 0 rgba(44, 42, 56, 0.06), 0 1px 2px -1px rgba(44, 42, 56, 0.06)",
        "warm-md":
          "0 4px 6px -1px rgba(44, 42, 56, 0.08), 0 2px 4px -2px rgba(44, 42, 56, 0.06)",
        "warm-lg":
          "0 10px 15px -3px rgba(44, 42, 56, 0.08), 0 4px 6px -4px rgba(44, 42, 56, 0.04)",
        // Glow shadows
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.3)",
        "glow-teal": "0 0 20px rgba(20, 184, 166, 0.3)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.3)",
        "glow-rose": "0 0 20px rgba(244, 63, 94, 0.3)",
        "glow-gradient": "0 0 30px rgba(139, 92, 246, 0.2), 0 0 60px rgba(20, 184, 166, 0.1)",
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
      },
      blur: {
        "4xl": "120px",
      },
    },
  },
  plugins: [],
};
export default config;
