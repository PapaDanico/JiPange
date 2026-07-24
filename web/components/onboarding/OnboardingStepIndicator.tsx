export default function OnboardingStepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return <p className="text-xs font-medium text-ink-soft print:hidden">Step {step} of 3</p>;
}
