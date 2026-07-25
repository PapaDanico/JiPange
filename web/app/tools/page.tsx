import type { Metadata } from "next";
import ToolsIndexList from "@/components/tools/ToolsIndexList";
import RecentToolsBar from "@/components/tools/RecentToolsBar";
import { ReadinessSnapshot, ContinueSessionBanner } from "@/components/tools/ToolsPageDynamics";
import JsonLd from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/structured-data";
import { CALCULATOR_GROUPS } from "@/lib/tool-groups";

const title = "Free Financial Calculators";
const description =
  "Free, no-signup calculators for Kenyan money decisions: take-home pay, savings goals, loans, FIRE, and more.";

export const metadata: Metadata = {
  title: `${title} for Kenya`,
  description,
};

export default function ToolsPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <JsonLd
        data={collectionPageJsonLd({
          name: title,
          description,
          path: "/tools",
          items: CALCULATOR_GROUPS.flatMap((group) =>
            group.calculators.map((tool) => ({ name: tool.title, path: tool.href }))
          ),
        })}
      />
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-semibold text-primary lg:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft lg:text-base">
          Quick tools for everyday Kenyan money decisions — no account needed.
        </p>
      </div>
      <div className="w-full max-w-5xl">
        <ContinueSessionBanner />
        <ReadinessSnapshot />
        <RecentToolsBar />
      </div>
      <ToolsIndexList groups={CALCULATOR_GROUPS} />
    </div>
  );
}
