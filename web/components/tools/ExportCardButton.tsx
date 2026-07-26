"use client";

import { RefObject, useState } from "react";

export default function ExportCardButton({
  containerRef,
  filename = "jipange-result",
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  filename?: string;
}) {
  const [loading, setLoading] = useState(false);
  /**
   * An export that fails must say so.
   *
   * This handler used to be try/finally with no catch: when html2canvas threw,
   * the button reset itself and the user got no file, no message, and no
   * reason to think anything had gone wrong. A silent failure on a download
   * button is worse than an error, because the user's next move is to assume
   * their device blocked it.
   */
  const [error, setError] = useState("");

  async function handleExport() {
    const el = containerRef.current;
    if (!el) return;
    setLoading(true);
    setError("");
    /*
     * Drop app chrome before rasterising.
     *
     * Reuse the print signal rather than inventing a second one: anything
     * marked print:hidden is chrome — share buttons, the copy affordance,
     * outbound product links — and a static image is exactly as unable to use
     * a tappable control as a sheet of paper is.
     *
     * INLINE styles, not a CSS class, and the reason cost an afternoon:
     * html2canvas measures the live element but paints a CLONE in an iframe.
     * A class-based rule reflowed the live element (measured 871px -> 620px)
     * while the clone still laid out at 871px, so the canvas was cut to 620px
     * and the last line of the disclaimer was sliced in half. Inline styles are
     * carried onto the clone, so both sides agree.
     */
    const chrome = Array.from(
      el.querySelectorAll<HTMLElement>(".print\\:hidden"),
    );
    const previousDisplay = chrome.map((node) => node.style.display);
    chrome.forEach((node) => {
      node.style.display = "none";
    });
    try {
      // html2canvas-pro, not html2canvas: Tailwind v4 emits color-mix() in
      // oklab space, and html2canvas 1.4.1 throws "unsupported color function
      // oklab" on it. That threw inside this handler, the catch below reset the
      // button, and the user got no file and no message — the export looked
      // like it had simply done nothing, on all 23 calculators that offer it.
      // The pro fork is API-compatible and parses modern color functions.
      const { default: html2canvas } = await import("html2canvas-pro");
      // Explicit height, with a little slack.
      //
      // Left to measure the element itself, html2canvas came up a few pixels
      // short and sliced the last line of the disclaimer in half — the final
      // text line's box extends fractionally past the height it reads. Ceil
      // the measured height and add a small margin so the tail always lands.
      const bounds = el.getBoundingClientRect();
      const src = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAFAF8",
        width: Math.ceil(bounds.width),
        height: Math.ceil(bounds.height) + 8,
        windowHeight: Math.ceil(bounds.height) + 8,
      });

      const pad = 48;
      const footerH = 44;
      const out = document.createElement("canvas");
      out.width = src.width + pad * 2;
      out.height = src.height + pad * 2 + footerH;

      const ctx = out.getContext("2d");
      if (!ctx) {
        setLoading(false);
        return;
      };
      ctx.fillStyle = "#FAFAF8";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(src, pad, pad);

      ctx.strokeStyle = "#E5E0D8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, out.height - footerH - 2);
      ctx.lineTo(out.width - pad, out.height - footerH - 2);
      ctx.stroke();

      ctx.fillStyle = "#9A8B80";
      ctx.font = "500 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "JiPange · jipangefinance.org",
        out.width / 2,
        out.height - footerH / 2 - 2
      );

      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = out.toDataURL("image/png");
      link.click();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? `Could not build the image (${err.message}). Try a screenshot instead.`
          : "Could not build the image. Try a screenshot instead.",
      );
    } finally {
      chrome.forEach((node, i) => {
        node.style.display = previousDisplay[i];
      });
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-ink-soft shadow-sm transition-colors hover:bg-canvas disabled:opacity-50 print:hidden"
    >
      {loading ? (
        "Generating image…"
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download result image
        </>
      )}
    </button>
    {error && (
      <p role="alert" className="text-xs text-danger">
        {error}
      </p>
    )}
    </div>
  );
}
