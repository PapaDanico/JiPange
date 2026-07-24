import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site-config";

/**
 * Shared Open Graph card renderer — every shared JiPange link unfurls as a
 * branded 1200×630 card instead of a bare URL. Rendered statically at build
 * time by the per-route opengraph-image.tsx files, so no user data and no
 * runtime cost. Fonts/logo load from lib/og (satori needs TTF + PNG).
 *
 * Titles must stay emoji-free: Source Serif 4 is the only embedded font, so
 * emoji either render as blank tofu or pull a CDN fetch into the build.
 * lib/og/__tests__/og-titles.test.ts enforces this and keeps each card in
 * sync with its page's display title.
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** Accessible alt text for a card — one convention for all 30+ routes. */
export function ogAlt(title: string): string {
  return `${title} — JiPange`;
}

function titleFontSize(title: string): number {
  if (title.length > 55) return 54;
  if (title.length > 34) return 62;
  return 72;
}

export async function ogCard(title: string, kicker = "Free · Anonymous · Built for Kenya") {
  const dir = join(process.cwd(), "lib/og");
  const [serif, logo] = await Promise.all([
    readFile(join(dir, "SourceSerif4-SemiBold.ttf")),
    readFile(join(dir, "logo.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fafaf8",
          padding: "64px 72px",
          fontFamily: "Source Serif 4",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori context, not the DOM */}
          <img src={logoSrc} width={72} height={72} alt="" />
          <div style={{ fontSize: 40, fontWeight: 600, color: "#6b5b4d" }}>JiPange</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#946213",
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              fontSize: titleFontSize(title),
              fontWeight: 600,
              color: "#171717",
              lineHeight: 1.12,
              letterSpacing: "-0.015em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", width: 120, height: 8, backgroundColor: "#e8a838", borderRadius: 4 }} />
          <div style={{ fontSize: 26, color: "#7a6b5e" }}>{new URL(SITE_URL).host}</div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Source Serif 4", data: serif, weight: 600, style: "normal" }],
    }
  );
}
