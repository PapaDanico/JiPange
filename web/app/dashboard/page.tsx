import type { Metadata } from "next";
import DashboardView from "@/components/journey/DashboardView";

export const metadata: Metadata = {
  title: "Your Action Dashboard",
  description:
    "A tailored Kenyan money dashboard: your priority, the real cost of digital debt, and where your money should live.",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary lg:text-3xl">Your Action Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft lg:text-base">
          Built from your five answers — anonymous, on your device.
        </p>
      </div>
      <div className="mt-6 w-full flex justify-center">
        <DashboardView />
      </div>
    </div>
  );
}
