import type { Metadata } from "next";
import Link from "next/link";
import HustleSmoother from "@/components/planners/HustleSmoother";
import HustleIncomeSmootherCalculator from "@/components/tools/HustleIncomeSmootherCalculator";
import ReportError from "@/components/tools/ReportError";
import ToolEnhancements from "@/components/tools/ToolEnhancements";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, softwareApplicationJsonLd } from "@/lib/structured-data";
import { PLANNER_NAV_ITEMS } from "@/lib/planner-nav";

/* Name and icon come from the nav registry rather than a local constant: this
 * page and the nav disagreed for as long as both held their own copy.
 *
 * ONE TOOL FOR IRREGULAR INCOME, 27 Nov 2026. This page and the gig-income
 * calculator at /tools/hustle-smoother answered the same question, "my income
 * does not arrive as a salary; what can I pay myself?", for two shapes of
 * income. They now sit on one page, one section per shape, and the old
 * address redirects to #monthly. */
const nav = PLANNER_NAV_ITEMS.find((item) => item.href === "/planners/hustle")!;
const title = nav.title;
const description =
  "Income that does not arrive as a salary, turned into one: lumpy cycle payouts with next cycle's seed capital protected, or month-to-month earnings smoothed with a buffer for the lean months.";
const path = "/planners/hustle";

export const metadata: Metadata = {
  title: `${title} — JiPange`,
  description:
    "Turn irregular income into a steady monthly salary: cycle payouts from poultry, farming or agribusiness with next cycle's seed capital protected, or variable freelance and informal earnings with a buffer for lean months.",
};

export default function HustlePlannerPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <JsonLd data={softwareApplicationJsonLd({ name: title, description, path })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Planners", path: "/planners" },
          { name: title, path },
        ])}
      />
      <div className="w-full max-w-3xl">
        <Link href="/planners" className="inline-flex min-h-11 items-center text-xs font-medium text-primary underline">
          ← All planners
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-primary lg:text-3xl">{nav.icon} {title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft lg:text-base">{description}</p>
        <nav aria-label="Which shape is your income?" className="mt-4 flex flex-wrap gap-2 text-sm">
          <a href="#cycle" className="inline-flex min-h-11 items-center rounded-full border border-border px-4 hover:bg-primary/5">
            Paid in lumps, per cycle
          </a>
          <a href="#monthly" className="inline-flex min-h-11 items-center rounded-full border border-border px-4 hover:bg-primary/5">
            Varies month to month
          </a>
        </nav>
      </div>
      <section id="cycle" className="mt-8 w-full max-w-3xl scroll-mt-24">
        <h2 className="mb-1 text-lg font-semibold text-primary">Paid in lumps, per cycle</h2>
        <p className="mb-4 text-sm text-ink-soft">
          A poultry batch, a harvest, a contract that pays at the end. Seed capital for the next round comes off the top.
        </p>
        <HustleSmoother />
      </section>
      <section id="monthly" className="mt-12 w-full max-w-3xl scroll-mt-24">
        <h2 className="mb-1 text-lg font-semibold text-primary">Varies month to month</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Freelance, boda, market stall: enter your last few months and get a monthly draw you can count on.
        </p>
        <HustleIncomeSmootherCalculator />
      </section>
      <div className="mt-8 w-full max-w-3xl space-y-4">
        <ReportError title={title} path={path} />
        <ToolEnhancements />
      </div>
    </div>
  );
}
