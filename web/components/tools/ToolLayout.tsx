import Link from "next/link";
import PrintLetterhead from "./PrintLetterhead";
import ToolInsights from "./ToolInsights";
import ToolEnhancements from "./ToolEnhancements";
import ToolLayoutCTA from "./ToolLayoutCTA";
import GoDeeper, { type DeeperLink } from "./GoDeeper";
import ReportError from "./ReportError";
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
  deeper,
  children,
}: {
  title: string;
  description: string;
  /** This page's route (e.g. "/tools/fire-number") — powers its structured
   *  data. Every call site already lives at a fixed, known route, so this
   *  is a one-line addition, not a new place for title/description to drift. */
  path: string;
  insights?: [Insight, Insight];
  /** Optional handoff to the sister tool that goes deeper on this question. */
  deeper?: DeeperLink;
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
        <Link href="/tools" className="inline-flex min-h-11 items-center text-xs font-medium text-primary underline">
          ← All calculators
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary lg:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft lg:text-base">{description}</p>
      </div>

      {/* Single column up to lg; calculator + sticky sidebar (Next Move, share, plan upsell) beyond it. */}
      {/* [&>*]:min-w-0 — a grid child defaults to min-width:auto, so it refuses to
          shrink below its content's minimum and pushes the whole page sideways.
          The salary tab strip is a legitimate overflow-x-auto scroller, but its
          column expanded to fit every tab instead of letting the strip scroll,
          giving 12px of horizontal page scroll at 360px. Applies to all tools. */}
      <div className="mt-8 grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12 [&>*]:min-w-0">
        <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
          {children}
          {/* BELOW the calculator, not above it. Measured on /tools/salary at
              390x844, which is the phone most of these readers are on: the two
              insight cards pushed the page's only input to y=697 — clinging to
              the bottom edge — and the answer to y=921, off the screen
              entirely. The reader scrolled ~700px of preamble to reach the
              field, then had to scroll again to see what they came for.

              What sat in that 700px made it worse rather than better. The
              largest, most prominent number on a take-home calculator was
              "29.56% of a Ksh 100,000 gross salary" — a correct figure about
              a hypothetical earner, rendered visually senior to the reader's
              own, before they had entered anything. A reader on 40,000 or on
              300,000 is told a percentage that is not theirs, in the position
              the page reserves for its most important fact.

              These stats are worth keeping: they are sourced, they carry their
              statutory attribution, and they give a figure meaning. Meaning is
              the point — and context lands after a number, not before one. Now
              the reader gets their own figure first and the comparison second,
              which is the order in which the comparison is worth anything.

              Applies to all 26 tools that pass `insights`. Deliberately fixed
              here rather than on the one page it was measured on: a calculator
              whose calculator is below the fold is the same defect wherever it
              appears, and a per-page exception would leave salary inconsistent
              with twenty-five siblings for no stated reason. */}
          {insights && <ToolInsights insights={insights} />}
          {/* Under the calculator, not in the sidebar: a reader looks for this
              at the moment they doubt a figure they have just read, and the
              sidebar is sticky furniture they have already tuned out. */}
          <ReportError title={title} path={path} />
        </div>
        <aside className="mx-auto w-full max-w-2xl space-y-6 print:hidden lg:sticky lg:top-20 lg:mx-0 lg:max-w-none">
          <ToolEnhancements />
          <ToolLayoutCTA />
          {deeper && <GoDeeper deeper={deeper} />}
        </aside>
      </div>
    </div>
  );
}
