import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT_NARRATIVE } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Licensing & partnerships — JiPange",
  description:
    "The calculators stay free to every Kenyan. Institutions license the engine, distribute the tools, or fund a module — never the reader.",
};

/**
 * The business-facing page, deliberately NOT /partners.
 *
 * /partners is the consumer product directory — CMA money market funds, CBK
 * T-bills, SASRA SACCOs. Somebody arriving there is choosing where to put
 * their savings, and dropping a partnership pitch in front of them would
 * ambush a person who came for something else. The name also matches
 * Mwangaza's /licensing, so the sister platforms answer to the same word.
 */
export default function LicensingPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">
          Free to every Kenyan. Funded by institutions.
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          {SUPPORT_NARRATIVE.lead}
        </p>

        <h2 className="mt-10 text-lg font-semibold text-ink">
          Three ways to work together
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          The same engine, offered three ways. Which one fits depends on whether you
          want it inside your own product, in front of the people you already serve,
          or pointed at something only you can see.
        </p>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="font-semibold text-ink">Embed</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              The calculations run inside your platform, under your brand — Kenya&apos;s
              actual tax bands, NSSF, SHIF, the Housing Levy and SACCO mechanics, kept
              current by us. You hold whatever licence your own advice requires.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-ink">Distribute</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Hand the tools to your members, staff or customers as something useful and
              free. Nothing is asked of them — no account, no data, no charge — so there
              is nothing for you to explain away later.
            </p>
          </section>
          <section>
            <h3 className="font-semibold text-ink">Co-build</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              A module aimed at your mandate — a SACCO&apos;s share-capital maths, a
              pension provider&apos;s contribution planner, an employer&apos;s leavers&apos;
              pack. You fund the build; it stays free to the people who use it.
            </p>
          </section>
        </div>

        {/* The deck is offered, not embedded.
          *
          * A slide deck is a poor way to read an argument and a fine way to
          * carry one into a meeting, so the case is on this page as text and
          * the file sits beside it. The size is stated because on Kenyan
          * mobile data an unlabelled download is a small rudeness. */}
        <h2 className="mt-10 text-lg font-semibold text-ink">
          The full case, if you want it on paper
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Everything above is the short version. The partnership deck sets out the gap
          it addresses, what JiPange and Mwangaza Yield each do, how they fit together,
          and what the commercial arrangement looks like — with every figure sourced
          and dated.
        </p>
        <p className="mt-3 text-sm">
          <a
            href="/partners/jipange-mwangaza-partnership-deck.pptx"
            download
            className="font-medium text-primary underline"
          >
            Download the partnership deck →
          </a>{" "}
          <span className="text-faint">(PowerPoint, 132 KB)</span>
        </p>

        <h2 className="mt-10 text-lg font-semibold text-ink">What stays true</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {SUPPORT_NARRATIVE.closing}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          No institution buys influence over what a calculator says. If a figure changes
          because a partner asked, it changes because the partner was right about the
          figure.
        </p>

        <p className="mt-10 text-sm text-ink-soft">
          Looking for where to put your own savings instead?{" "}
          <Link href="/partners" className="font-medium text-primary underline">
            The product directory is here →
          </Link>
        </p>
      </div>
    </div>
  );
}
