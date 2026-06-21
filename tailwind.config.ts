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
        brand: "#6366f1",
        "brand-hover": "#5558e6",
        "brand-light": "#eef2ff",
        "brand-subtle": "#e0e7ff",
        cream: "#f8f7ff",
        ink: "#1e1b4b",
        "ink-light": "#374151",
        "ink-muted": "#9ca3af",
        border: "#e5e7eb",
        "border-light": "#f3f4f6",
        card: "#ffffff",
        sage: "#10b981",
        gold: "#f59e0b",
        rose: "#ef4444",
        lavender: "#8b5cf6",
        sidebar: "#6366f1",
        // Accent colors
        accent: {
          indigo: "#6366f1",
          purple: "#8b5cf6",
          cyan: "#06b6d4",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#ef4444",
        },
      },
      boxShadow: {
        warm: "0 1px 3px 0 rgba(99, 102, 241, 0.08), 0 1px 2px -1px rgba(99, 102, 241, 0.06)",
        "warm-md": "0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -2px rgba(99, 102, 241, 0.08)",
        "warm-lg": "0 10px 15px -3px rgba(99, 102, 241, 0.1), 0 4px 6px -4px rgba(99, 102, 241, 0.06)",
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-md": "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)",
        "card-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        "card-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
