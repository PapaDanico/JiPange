"use client";

/**
 * The boundary of last resort.
 *
 * app/error.tsx catches anything thrown inside the root layout's children —
 * which is almost everything, and is why this file was easy to not miss. What
 * it cannot catch is a throw in the root layout ITSELF, because the layout is
 * what renders the boundary. When that happens Next falls back to its own
 * built-in error screen: an unstyled page, in English, with no way back to the
 * app and nothing identifying whose site it is.
 *
 * global-error replaces the entire document, so it has to supply its own
 * <html> and <body>. It cannot use the app's layout, header, fonts or Tailwind
 * theme tokens — the failure that brought the user here may be in exactly
 * those. Every style below is therefore inline and self-contained, and the
 * colours are literals rather than CSS variables for the same reason.
 *
 * It stays deliberately plain. A recovery screen that itself depends on the
 * thing that just broke is not a recovery screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          backgroundColor: "#FBF9F6",
          color: "#1F2937",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.6, color: "#4B5563" }}>
            JiPange hit an error it could not recover from on its own. Nothing you
            have saved is affected — your plan is stored on this device and is not
            touched by this.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: "44px",
                padding: "0 1.5rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#0F5132",
                color: "#FFFFFF",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
                deliberate, and the one place the rule's advice is wrong. A
                <Link> does a client-side navigation, which re-renders the same
                root layout that just threw — most likely straight back to this
                screen. A plain <a> is a full document load: new React tree, new
                layout render, which is the only thing here with a real chance
                of recovering. */}
            <a
              href="/"
              style={{
                minHeight: "44px",
                display: "inline-flex",
                alignItems: "center",
                padding: "0 1.5rem",
                borderRadius: "9999px",
                border: "1px solid #0F5132",
                color: "#0F5132",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
          {error.digest && (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#9CA3AF" }}>
              Reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
