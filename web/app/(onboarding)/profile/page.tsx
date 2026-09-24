import type { Metadata } from "next";
import JourneyWizard from "@/components/journey/JourneyWizard";
import ResumeToast from "@/components/onboarding/ResumeToast";

export const metadata: Metadata = {
  title: "Your 90-second money check",
  description:
    "Five taps, zero typing, completely anonymous — get a tailored Kenyan action dashboard for your money.",
};

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      {/* The wizard's per-step <h2> takes focus as each step changes; this is
          the page's own heading, so a screen reader landing here knows where
          it is before the first step renders. */}
      <h1 className="sr-only">Your 90-second money check</h1>
      <ResumeToast />
      <div className="mt-2 w-full flex justify-center">
        <JourneyWizard />
      </div>
    </div>
  );
}
