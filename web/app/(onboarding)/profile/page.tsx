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
      <ResumeToast />
      <div className="mt-2 w-full flex justify-center">
        <JourneyWizard />
      </div>
    </div>
  );
}
