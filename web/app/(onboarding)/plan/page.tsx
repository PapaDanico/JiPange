import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import ActionPlan from "@/components/onboarding/ActionPlan";

export default function PlanPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <BrandHeader />
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
    </div>
  );
}
