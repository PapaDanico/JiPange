import Link from "next/link";
import ToolInsights from "./ToolInsights";
import ToolEnhancements from "./ToolEnhancements";
import ToolLayoutCTA from "./ToolLayoutCTA";

interface Insight {
  icon: string;
  tone: "caution" | "hopeful";
  stat: string;
  label: string;
  source?: string;
}

export default function ToolLayout({
  title,
  description,
  insights,
  children,
}: {
  title: string;
  description: string;
  insights?: [Insight, Insight];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-md print:hidden">
        <Link href="/tools" className="text-xs font-medium text-primary underline">
          ← All calculators
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary">{title}</h1>
        <p className="mt-1 text-sm text-[#4B4238]">{description}</p>
        {insights && <ToolInsights insights={insights} />}
      </div>
      <div className="mt-8 w-full max-w-md">{children}</div>
      <ToolEnhancements />
      <ToolLayoutCTA />
    </div>
  );
}
