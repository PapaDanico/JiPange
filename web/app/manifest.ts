import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JiPange — Kenya Money Planner",
    short_name: "JiPange",
    description:
      "Free Kenya financial calculators, goal planners, and your Pesa Picture. No signup. No fees. Works offline.",
    id: "/",
    start_url: "/tools",
    display: "standalone",
    // Match the app's real surfaces: paper background, brand-brown chrome
    // (previously #FAF8F5/#171717, which matched neither globals.css nor
    // the viewport themeColor).
    background_color: "#fafaf8",
    theme_color: "#6b5b4d",
    orientation: "portrait",
    categories: ["finance", "productivity"],
    lang: "en",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        // Full-bleed safe-zone variant so Android launchers can crop to
        // any mask shape without clipping the shield.
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Take-Home Pay",
        short_name: "Pay",
        description: "Calculate your net Kenya salary",
        url: "/tools/take-home-pay",
      },
      {
        name: "Savings Goal",
        short_name: "Savings",
        description: "Plan your monthly savings amount",
        url: "/tools/savings-goal",
      },
      {
        name: "FIRE Number",
        short_name: "FIRE",
        description: "Your Kenya retirement target",
        url: "/tools/fire-number",
      },
    ],
  };
}
