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
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">Partners & Products</h1>
        <p className="mt-1 text-sm text-ink-soft">
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
