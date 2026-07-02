import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import ActionPlan from "@/components/onboarding/ActionPlan";
import OnboardingStepIndicator from "@/components/onboarding/OnboardingStepIndicator";

export default function PlanPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <BrandHeader />
        <OnboardingStepIndicator step={3} />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-primary">Your 3-Step Action Plan</h1>
          <Link href="/profile" className="text-xs font-medium text-primary underline">
            Update my plan
          </Link>
        </div>
        <p className="mt-1 text-sm text-[#4B4238]">
          Personalised recommendations based on your Pesa Picture.
        </p>
      </div>
      <div className="mt-8 w-full flex justify-center">
        <ActionPlan />
      </div>
      <div className="mt-8 w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-primary">Want to model a specific scenario?</p>
        <p className="mt-1 text-xs text-[#4B4238]">
          Try our free calculators for loans, savings goals, FIRE, and more.
        </p>
        <Link
          href="/tools"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
        >
          Explore calculators
        </Link>
      </div>
    </div>
  );
}
