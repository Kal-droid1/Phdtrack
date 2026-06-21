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
      },
      boxShadow: {
        warm: "0 1px 3px 0 rgba(44, 42, 56, 0.06), 0 1px 2px -1px rgba(44, 42, 56, 0.06)",
        "warm-md":
          "0 4px 6px -1px rgba(44, 42, 56, 0.08), 0 2px 4px -2px rgba(44, 42, 56, 0.06)",
        "warm-lg":
          "0 10px 15px -3px rgba(44, 42, 56, 0.08), 0 4px 6px -4px rgba(44, 42, 56, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
