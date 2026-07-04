import type { Metadata } from "next";
import ProfileForm from "@/components/onboarding/ProfileForm";

export const metadata: Metadata = {
  title: "Full profile",
  description:
    "Six quick questions for your shilling-exact Pesa Picture — take-home pay, budget split and AI action plan.",
};

export default function FullProfilePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-primary">Tell us about you</h1>
        <p className="mt-1 text-sm text-[#4B4238]">
          Six quick questions — about 90 seconds. Your data stays with you.
        </p>
      </div>
      <div className="mt-8 w-full flex justify-center">
        <ProfileForm />
      </div>
    </div>
  );
}
