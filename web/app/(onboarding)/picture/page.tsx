import type { Metadata } from "next";
import PictureView from "@/components/onboarding/PictureView";
import ExportableSection from "@/components/tools/ExportableSection";
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
      <div className="mt-6 w-full max-w-2xl">
        <ExportableSection filename="my-pesa-picture" title="My Pesa Picture">
          <div className="flex w-full justify-center">
            <PictureView />
          </div>
        </ExportableSection>
      </div>
    </div>
  );
}
