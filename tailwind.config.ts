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
        sidebar: "#0f1724",
        dark: "#111827",
        card: "#1f2937",
        cardBorder: "#374151",
        accent: "#4ade80",
        accentDark: "#052e16",
        secondary: "#f59e0b",
        textPrimary: "#f9fafb",
        textMuted: "#9ca3af",
      },
    },
  },
  plugins: [],
};
export default config;
