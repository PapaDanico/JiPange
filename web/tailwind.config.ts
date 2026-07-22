import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6B5B4D",
        accent: "#E8A838",
        success: "#2D7D46",
        // Darkened from #D97706/#DC2626 so text using these tokens meets the
        // WCAG AA 4.5:1 contrast minimum on white/near-white backgrounds.
        warning: "#B45309",
        danger: "#C81E1E",
        background: "#FAFAF8",
        surface: "#FFFFFF",
        canvas: "#F1ECE3",
        border: "#E5E0D8",
        ink: "#171717",
        muted: "#7A6B5E",
      },
    },
  },
  plugins: [],
};

export default config;
