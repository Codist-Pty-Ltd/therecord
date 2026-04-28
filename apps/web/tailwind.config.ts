import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        charcoal: "#1C1C1E",
        amber: "#C8651B",
        "legal-blue": "#3B5EA6",
        "constitutional-gold": "#D4A017",
        "charge-red": "#B91C1C",
        "timeline-green": "#16A34A",
      },
      fontFamily: {
        // `next/font` injects these CSS variables on <html> in app/layout.tsx.
        // The literal family names are kept as fallbacks in case the variable
        // fails to register (rare — e.g. during CSS-only prerender testing).
        serif: [
          "var(--font-instrument-serif)",
          "Instrument Serif",
          "Georgia",
          "serif",
        ],
        sans: [
          "var(--font-inter)",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
