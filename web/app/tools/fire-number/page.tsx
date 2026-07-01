import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import FireNumberCalculator from "@/components/tools/FireNumberCalculator";

export const metadata: Metadata = {
  title: "FIRE Number Calculator — Financial Independence Kenya",
  description:
    "Find your FIRE number and how many years until Financial Independence, based on the 4% safe withdrawal rule.",
};

export default function FireNumberPage() {
  return (
    <ToolLayout
      title="FIRE Number Calculator"
      description="Find your Financial Independence number and how many years to reach it."
    >
      <FireNumberCalculator />
    </ToolLayout>
  );
}
