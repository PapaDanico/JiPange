import type { Metadata } from "next";
import PartnersView from "@/components/partners/PartnersView";

export const metadata: Metadata = {
  title: "Partners & Products — JiPange",
  description:
    "Kenya's vetted financial product directory: CMA-regulated money market funds, CBK T-bills, SASRA SACCOs, and RBA pension providers — all in one place.",
};

export default function PartnersPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      {/* max-w-5xl, matching app/tools/page.tsx — a DIRECTORY, not an article.
          It was max-w-2xl, so at 1440px fifteen product cards were squeezed
          into 672px and two cramped columns while 768px of the viewport sat
          empty either side, and every provider name wrapped. The measure that
          is right for prose is wrong for a scannable grid; the intro paragraph
          below keeps its own max-w-2xl, which is the pattern /tools already
          uses. */}
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-semibold text-primary">Partners & Products</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Vetted, regulated financial products for Kenyans. Filter by type, or follow
          your personalised recommendation from the 5-question journey.
        </p>
      </div>
      <div className="mt-8 w-full flex justify-center">
        <PartnersView />
      </div>
    </div>
  );
}
