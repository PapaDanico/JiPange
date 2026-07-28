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
          stat: "Ksh 400–1,500/mo",
          label: "is what individual private cover is advertised at in Kenya — entry plans from about Ksh 400 a month, inpatient-focused cover nearer Ksh 700–1,500. Paired with SHA it buys private hospital access; premiums rise with age and benefit limits, so treat this as a starting point and get a quote.",
          source: "Published individual premiums, Kenyan insurers 2026 — indicative, verify with a provider",
        },
      ]}
    >
      <ShaHealthCalculator />
    </ToolLayout>
  );
}
