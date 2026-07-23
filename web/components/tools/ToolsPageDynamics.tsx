"use client";

import dynamic from "next/dynamic";

// `dynamic(..., { ssr: false })` is only permitted from a Client Component —
// this wrapper exists solely so app/tools/page.tsx (a Server Component) can
// render these two client-only sections without SSR.
export const ReadinessSnapshot = dynamic(
  () => import("@/components/tools/ReadinessSnapshot"),
  { ssr: false }
);
export const ContinueSessionBanner = dynamic(
  () => import("@/components/tools/ContinueSessionBanner"),
  { ssr: false }
);
