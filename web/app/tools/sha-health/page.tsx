import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import ShaHealthCalculator from "@/components/tools/ShaHealthCalculator";

export const metadata: Metadata = {
  title: "SHA Health Gap Analyzer — Kenya Social Health Authority",
  description:
    "See your exact SHA (SHIF) contribution, what SHA actually covers, and how much private top-up you need to fill the gaps.",
};

export default function ShaHealthPage() {
  return (
    <ToolLayout
      path="/tools/sha-health"
      title="SHA Health Coverage Gap"
      description="Find your exact SHA (SHIF) contribution and the private top-up cost needed to cover what SHA doesn't — private hospitals, dental, optical, and more."
      insights={[
        {
          icon: "⚠️",
          tone: "caution",
          stat: "2.75%",
          label: "of your gross salary goes to SHIF — but SHA only covers accredited public facilities. Private hospitals, dental, and optical are not included.",
          source: "Social Health Insurance Act 2023 · SHA",
        },
        {
          icon: "💡",
          tone: "hopeful",
          stat: "Ksh 1,500–3,500/mo",
          label: "is the typical SHA top-up cost for a single person. Paired with SHA, it gives full private hospital access at a fraction of standalone cover.",
          source: "JiPange 2026 market survey",
        },
      ]}
    >
      <ShaHealthCalculator />
    </ToolLayout>
  );
}
