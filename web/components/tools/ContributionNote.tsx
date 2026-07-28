"use client";

import Link from "next/link";

/**
 * The only invitation to contribute that appears anywhere near a tool.
 *
 * WHERE IT SITS, AND WHY THAT IS THE WHOLE DESIGN
 * ----------------------------------------------
 * Underneath a document that has ALREADY been produced and handed over. Not
 * before the export, not while it runs, not over the result, and never in a
 * dialog. By the time this is on screen the reader has what they came for and
 * owes nothing — which is the only honest moment to mention money.
 *
 * It is a sentence and a link. It does not reappear, it does not count how
 * many times it has been dismissed, and there is nothing to dismiss. A reader
 * who ignores it forever gets the identical product, permanently, and that has
 * to be true rather than merely implied.
 *
 * `lib/mission.ts` states the rule and `lib/__tests__/mission.test.ts` scans
 * for the shapes it forbids — overlays, interstitials, anything on a
 * calculator page. If a future change puts an ask in front of somebody
 * mid-problem, the suite says so.
 */
export default function ContributionNote() {
  return (
    <p className="mt-3 text-center text-xs leading-relaxed text-faint">
      Documents like this one are free and stay free.{" "}
      <Link href="/support" className="underline hover:text-primary">
        How JiPange is paid for
      </Link>
      .
    </p>
  );
}
