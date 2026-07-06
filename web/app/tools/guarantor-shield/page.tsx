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
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "1 in 3",
          label: "Sacco members don't know their total guarantor exposure — and discover it only when they try to borrow.",
          source: "SASRA Sacco Supervision Report 2024",
        },
        {
          icon: "💪",
          tone: "hopeful",
          stat: "Free up",
          label: "frozen deposits by tracking guarantees and negotiating releases — unlocking borrowing power you already earned.",
          source: "Employment Act Cap. 226, Sacco Societies Act",
        },
      ]}
    >
      <GuarantorShieldCalculator />
    </ToolLayout>
  );
}
