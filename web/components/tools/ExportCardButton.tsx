"use client";

import { RefObject, useState } from "react";

export default function ExportCardButton({
  containerRef,
  filename = "jipange-result",
}: {
  containerRef: RefObject<HTMLDivElement>;
  filename?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    const el = containerRef.current;
    if (!el) return;
    setLoading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const src = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAFAF8",
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E5E0D8] bg-white px-4 py-3 text-sm font-medium text-[#4B4238] shadow-sm transition-colors hover:bg-[#F1ECE3] disabled:opacity-50 print:hidden"
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
  );
}
