import type { Metadata } from "next";
import Link from "next/link";
import HustleSmoother from "@/components/planners/HustleSmoother";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, softwareApplicationJsonLd } from "@/lib/structured-data";

const title = "Cycle Venture Planner";
const description =
  "Lumpy cycle payouts in, steady monthly salary out — seed capital protected for the next round.";
const path = "/planners/hustle";

export const metadata: Metadata = {
  title: `${title} — JiPange`,
  description:
    "Turn lumpy cycle payouts from poultry, farming or agribusiness into a steady monthly salary — with next cycle's seed capital always protected.",
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
        <h1 className="mt-2 text-2xl font-semibold text-primary lg:text-3xl">🌾 {title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft lg:text-base">{description}</p>
      </div>
      <div className="mt-8 w-full max-w-3xl">
        <HustleSmoother />
      </div>
    </div>
  );
}
