import type { Metadata } from "next";
import PictureView from "@/components/onboarding/PictureView";
import PrintButton from "@/components/PrintButton";
import PrintLetterhead from "@/components/tools/PrintLetterhead";

export const metadata: Metadata = {
  title: "My Pesa Picture",
  description:
    "A diagnostic dashboard for your money: liquidity leaks, the silent inflation burner, and your Pesa Engine persona.",
};

export default function PicturePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <PrintLetterhead title="My Pesa Picture" />
        <div className="print:hidden">
          <h1 className="text-2xl font-semibold text-primary lg:text-3xl">My Pesa Picture</h1>
          <p className="mt-1 text-sm text-ink-soft lg:text-base">
            Your money&apos;s health, diagnosed — leaks first, then the fix.
          </p>
        </div>
      </div>
      <div className="mt-6 flex w-full justify-center">
        <PictureView />
      </div>
      <div className="mt-8 w-full max-w-2xl">
        <PrintButton label="Print / Save my Pesa Picture as PDF" />
      </div>
    </div>
  );
}
