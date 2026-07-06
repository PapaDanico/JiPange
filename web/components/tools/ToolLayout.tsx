import Link from "next/link";
import ToolInsights from "./ToolInsights";

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
      <div className="mt-8 w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm print:hidden">
        <p className="text-sm font-medium text-primary">Want a full plan, not just one number?</p>
        <p className="mt-1 text-xs text-[#4B4238]">
          Get a personalised 3-step action plan built around your whole financial picture.
        </p>
        <Link
          href="/profile"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
        >
          Build my free plan
        </Link>
      </div>
    </div>
  );
}
