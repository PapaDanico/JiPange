import type { Metadata } from "next";
import PictureView from "@/components/onboarding/PictureView";

export const metadata: Metadata = {
  title: "My Pesa Picture",
  description:
    "A diagnostic dashboard for your money: liquidity leaks, the silent inflation burner, and your Pesa Engine persona.",
};

export default function PicturePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary lg:text-3xl">My Pesa Picture</h1>
        <p className="mt-1 text-sm text-ink-soft lg:text-base">
          Your money&apos;s health, diagnosed — leaks first, then the fix.
        </p>
      </div>
      <div className="mt-6 flex w-full justify-center">
        <PictureView />
      </div>
    </div>
  );
}
