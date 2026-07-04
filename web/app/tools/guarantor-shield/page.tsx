import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import GuarantorShieldCalculator from "@/components/tools/GuarantorShieldCalculator";

export const metadata: Metadata = {
  title: "Sacco Guarantor Liability Shield",
  description:
    "See how much of your Sacco borrowing power is frozen by loans you've guaranteed for others.",
};

export default function GuarantorShieldPage() {
  return (
    <ToolLayout
      title="🎯 Sacco Guarantor Liability Shield"
      description="Your deposits back other people's loans — find your true unencumbered borrowing power."
    >
      <GuarantorShieldCalculator />
    </ToolLayout>
  );
}
