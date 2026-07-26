"use client";

import { RefObject, useState } from "react";

/**
 * Getting a result off the device — as a PDF, or as an image.
 *
 * WHY BOTH
 * --------
 * The image came first and is still the right default for most of what happens
 * here: a Kenyan reader who has just worked out their take-home pay wants to
 * send it to somebody on WhatsApp, and an image is what WhatsApp shows inline.
 *
 * But an image is not a document. Anyone taking a savings plan to a SACCO, a
 * fee projection to a school bursar, or a payslip breakdown to an employer
 * needs a PDF, and this had no way to produce one — the sister product had the
 * same gap and was told so plainly: "I'm still unable to generate PDFs."
 *
 * NO PLATFORM DIALOG, EVER
 * ------------------------
 * Both paths build the file in the page and download it. Nothing here calls
 * window.print(), because that is absent on iOS when an app runs from the home
 * screen and dropped by several Android WebViews — on those devices it does
 * nothing at all, silently, which is exactly how a button comes to be reported
 * as broken. jsPDF is dynamically imported so it costs nothing until pressed.
 *
 * The PDF embeds the rendered card rather than re-laying out text in PDF
 * primitives. That would mean two renderers to keep in step and the printed
 * figures drifting from the on-screen ones — the class of bug this codebase
 * keeps finding. One renderer, one layout, one set of numbers.
 */
export default function ExportCardButton({
  containerRef,
  filename = "jipange-result",
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  filename?: string;
}) {
  const [loading, setLoading] = useState<"pdf" | "image" | null>(null);
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

  /**
   * Rasterise the result card, with the app's chrome and animations neutralised.
   *
   * Both lessons here were paid for. Chrome is hidden via INLINE styles, not a
   * class: html2canvas measures the live element but paints a clone in an
   * iframe, and a class-based rule reflowed the live element (871px -> 620px)
   * while the clone still laid out at 871px, slicing the disclaimer in half.
   * And the entrance animation is frozen, because `animate-rise` is
   * `rise-in 0.4s ... both` — the clone remounts, restarts it from opacity 0,
   * and the capture lands mid-fade. Every exported card came out washed to a
   * pale grey until that was fixed.
   */
  async function renderCard(el: HTMLElement) {
    const chrome = Array.from(el.querySelectorAll<HTMLElement>(".print\\:hidden"));
    const previousDisplay = chrome.map((node) => node.style.display);
    chrome.forEach((node) => {
      node.style.display = "none";
    });

    const animated = [el, ...Array.from(el.querySelectorAll<HTMLElement>("*"))];
    const previousMotion = animated.map((node) => ({
      animation: node.style.animation,
      opacity: node.style.opacity,
      transform: node.style.transform,
    }));
    animated.forEach((node) => {
      node.style.animation = "none";
      node.style.opacity = "1";
      if (node.style.transform === "" || /translateY/.test(node.style.transform)) {
        node.style.transform = "none";
      }
    });

    // html2canvas draws an underline through the middle of the text rather
    // than below it, so every export showed "itax.kra.go.ke" struck through —
    // which on a tax page reads as "this address is withdrawn". Underlines are
    // dropped for the capture; the link colour still marks them.
    const underlined = Array.from(el.querySelectorAll<HTMLElement>("a, u, .underline"));
    const previousDecoration = underlined.map((node) => node.style.textDecoration);
    underlined.forEach((node) => {
      node.style.textDecoration = "none";
    });

    try {
      // html2canvas-pro, not html2canvas: Tailwind v4 emits color-mix() in
      // oklab space, and html2canvas 1.4.1 throws "unsupported color function
      // oklab" on it — which read to the user as the button doing nothing.
      const { default: html2canvas } = await import("html2canvas-pro");
      // Explicit height, with a little slack: left to measure itself,
      // html2canvas comes a few pixels short and slices the last line.
      const bounds = el.getBoundingClientRect();
      return await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAFAF8",
        width: Math.ceil(bounds.width),
        height: Math.ceil(bounds.height) + 8,
        windowHeight: Math.ceil(bounds.height) + 8,
      });
    } finally {
      chrome.forEach((node, i) => {
        node.style.display = previousDisplay[i];
      });
      underlined.forEach((node, i) => {
        node.style.textDecoration = previousDecoration[i];
      });
      animated.forEach((node, i) => {
        node.style.animation = previousMotion[i].animation;
        node.style.opacity = previousMotion[i].opacity;
        node.style.transform = previousMotion[i].transform;
      });
    }
  }

  /** The card on a padded background with the JiPange footer under it. */
  function frame(src: HTMLCanvasElement) {
    const pad = 48;
    const footerH = 44;
    const out = document.createElement("canvas");
    out.width = src.width + pad * 2;
    out.height = src.height + pad * 2 + footerH;

    const ctx = out.getContext("2d");
    if (!ctx) return null;
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
    ctx.fillText("JiPange · jipangefinance.org", out.width / 2, out.height - footerH / 2 - 2);
    return out;
  }

  async function handleExport(as: "pdf" | "image") {
    const el = containerRef.current;
    if (!el) return;
    setLoading(as);
    setError("");
    try {
      const src = await renderCard(el);
      const out = frame(src);
      if (!out) {
        setError("Could not prepare the canvas. Try a screenshot instead.");
        return;
      }

      if (as === "image") {
        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = out.toDataURL("image/png");
        link.click();
        return;
      }

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Fit to width, then PAGINATE — do not scale a long card down to fit one
      // sheet. These results run long: the retirement plan card rasterises at
      // 780x3524, which shrunk-to-fit lands as a 65mm-wide sliver of 4pt text
      // on a 210mm page. Legible on nobody's screen and useless printed. So the
      // card is cut into page-height bands at full width and each band gets its
      // own A4 page, which is what a document is supposed to do.
      const imgW = pageW;
      const naturalH = (out.height * imgW) / out.width;
      if (naturalH <= pageH) {
        pdf.addImage(out.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, imgW, naturalH);
      } else {
        // Source pixels per page of output, from the width-fit scale factor.
        const sliceH = Math.floor((pageH * out.width) / pageW);
        const band = document.createElement("canvas");
        const bctx = band.getContext("2d");
        band.width = out.width;
        for (let y = 0; y < out.height; y += sliceH) {
          const h = Math.min(sliceH, out.height - y);
          band.height = h;
          if (!bctx) break;
          // Repaint the background: the last band is short, and without this
          // it inherits whatever was in the reused buffer.
          bctx.fillStyle = "#FAFAF8";
          bctx.fillRect(0, 0, band.width, h);
          bctx.drawImage(out, 0, y, out.width, h, 0, 0, out.width, h);
          if (y > 0) pdf.addPage();
          pdf.addImage(
            band.toDataURL("image/jpeg", 0.92),
            "JPEG",
            0,
            0,
            imgW,
            (h * imgW) / out.width,
          );
        }
      }
      pdf.save(`${filename}.pdf`);
    } catch (err) {
      const what = as === "pdf" ? "PDF" : "image";
      setError(
        err instanceof Error && err.message
          ? `Could not build the ${what} (${err.message}). Try a screenshot instead.`
          : `Could not build the ${what}. Try a screenshot instead.`,
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2 print:hidden">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleExport("pdf")}
          disabled={loading !== null}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {loading === "pdf" ? (
            "Generating PDF…"
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 18 15 15" />
              </svg>
              Download PDF
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => handleExport("image")}
          disabled={loading !== null}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium text-ink-soft shadow-sm transition-colors hover:bg-canvas disabled:opacity-50"
        >
          {loading === "image" ? (
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
              Save image
            </>
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
