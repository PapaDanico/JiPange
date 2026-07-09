import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JiPange — Kenya Money Planner",
    short_name: "JiPange",
    description:
      "Free Kenya financial calculators, goal planners, and your Pesa Picture. No signup. No fees. Works offline.",
    start_url: "/tools",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#171717",
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
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
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
