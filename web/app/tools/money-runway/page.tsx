import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import MoneyRunwayCalculator from "@/components/tools/MoneyRunwayCalculator";

export const metadata: Metadata = {
  title: "Money Runway Calculator — How Long Will My Savings Last",
  description:
    "See how many months or years your savings will last at a given monthly withdrawal rate.",
};

export default function MoneyRunwayPage() {
  return (
    <ToolLayout
      title="Money Runway Calculator"
      description="See how long your savings will last at a given monthly withdrawal."
    >
      <MoneyRunwayCalculator />
    </ToolLayout>
  );
}
