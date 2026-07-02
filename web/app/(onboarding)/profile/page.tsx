import BrandHeader from "@/components/BrandHeader";
import OnboardingStepIndicator from "@/components/onboarding/OnboardingStepIndicator";
import ProfileForm from "@/components/onboarding/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md">
        <BrandHeader />
        <OnboardingStepIndicator step={1} />
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
