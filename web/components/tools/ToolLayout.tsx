import Link from "next/link";
import PrintLetterhead from "./PrintLetterhead";
import ToolInsights from "./ToolInsights";
import ToolEnhancements from "./ToolEnhancements";
import ToolLayoutCTA from "./ToolLayoutCTA";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, softwareApplicationJsonLd } from "@/lib/structured-data";

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
  path,
  insights,
  children,
}: {
  title: string;
  description: string;
  /** This page's route (e.g. "/tools/fire-number") — powers its structured
   *  data. Every call site already lives at a fixed, known route, so this
   *  is a one-line addition, not a new place for title/description to drift. */
  path: string;
  insights?: [Insight, Insight];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <JsonLd data={softwareApplicationJsonLd({ name: title, description, path })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Calculators", path: "/tools" },
          { name: title, path },
        ])}
      />
      {/* Every calculator prints as a letterheaded one-page report. */}
      <div className="w-full max-w-5xl">
        <PrintLetterhead title={title} />
      </div>
      <div className="w-full max-w-5xl print:hidden">
        <Link href="/tools" className="text-xs font-medium text-primary underline">
          ← All calculators
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary lg:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft lg:text-base">{description}</p>
        {insights && (
          <div className="max-w-2xl">
            <ToolInsights insights={insights} />
          </div>
        )}
      </div>

      {/* Single column up to lg; calculator + sticky sidebar (Next Move, share, plan upsell) beyond it. */}
      <div className="mt-8 grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
        <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">{children}</div>
        <aside className="mx-auto w-full max-w-2xl space-y-6 print:hidden lg:sticky lg:top-20 lg:mx-0 lg:max-w-none">
          <ToolEnhancements />
          <ToolLayoutCTA />
        </aside>
      </div>
    </div>
  );
}
