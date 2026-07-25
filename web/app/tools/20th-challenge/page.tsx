import type { Metadata } from "next";
import ToolLayout from "@/components/tools/ToolLayout";
import TwentiethChallengeTracker from "@/components/tools/TwentiethChallengeTracker";

export const metadata: Metadata = {
  title: "20th-to-20th Savings Challenge — JiPange",
  description:
    "Commit to saving a fixed amount every month, check in between the 15th and 25th, and build an unbroken streak.",
};

export default function TwentiethChallengePage() {
  return (
    <ToolLayout
      path="/tools/20th-challenge"
      title="20th-to-20th Savings Challenge"
      description="Pick an amount. Save it every month. Check in between the 15th and 25th to keep your streak alive."
      insights={[
        {
          icon: "📊",
          tone: "caution",
          stat: "78%",
          label:
            "of Kenyans who save do so irregularly — when they remember, or when there's something left. A monthly check-in habit changes that.",
          source: "FinAccess Kenya 2021",
        },
        {
          icon: "💡",
          tone: "hopeful",
          stat: "6 months",
          label:
            "is the research-backed threshold for a habit to become automatic. Get to 6 check-ins and saving stops feeling like discipline — it feels like rent.",
          source: "Habit research consensus",
        },
      ]}
    >
      <TwentiethChallengeTracker />
    </ToolLayout>
  );
}
