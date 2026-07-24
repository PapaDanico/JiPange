import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Shared Open Graph card renderer — every shared JiPange link unfurls as a
 * branded 1200×630 card instead of a bare URL. Rendered statically at build
 * time by the per-route opengraph-image.tsx files, so no user data and no
 * runtime cost. Fonts/logo load from lib/og (satori needs TTF + PNG).
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

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
              fontSize: title.length > 34 ? 62 : 72,
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
          <div style={{ fontSize: 26, color: "#7a6b5e" }}>jipangefinance.org</div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Source Serif 4", data: serif, weight: 600, style: "normal" }],
    }
  );
}
