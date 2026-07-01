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
        warning: "#D97706",
        danger: "#DC2626",
        background: "#FAFAF8",
      },
    },
  },
  plugins: [],
};

export default config;
