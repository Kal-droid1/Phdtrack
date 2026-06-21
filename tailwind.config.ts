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
        sidebar: "#2d1f24",
        dark: "#edbfc6",
        card: "#ffffff",
        cardBorder: "#e8c5cc",
        accent: "#8b3a52",
        accentDark: "#8b3a52",
        secondary: "#f59e0b",
        textPrimary: "#1a1a1a",
        textMuted: "#6b4f55",
      },
    },
  },
  plugins: [],
};
export default config;
