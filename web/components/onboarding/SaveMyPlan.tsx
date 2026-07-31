"use client";

import Link from "next/link";

/**
 * Moving a plan to another device, without an account.
 *
 * This used to be a magic-link sign-in: an e-mail address to Supabase, and on
 * return, name, age, county, salary and dependants upserted to a database
 * outside Kenya. It was the last controller-side personal data this product
 * held — the calculators and the journey are device-only, and the plan stopped
 * leaving the device in July 2026.
 *
 * It was removed in July 2026 because the Data Protection (Registration of Data
 * Controllers and Data Processors) Regulations, 2021 disapply the small-operator
 * exemption for anything in the Third Schedule, which includes "provision of
 * financial services". Whether a personal-finance tool is caught by that phrase
 * is arguable; holding no personal data at all is not. The cheapest way to win
 * an argument about which schedule you fall under is to have nothing to
 * register in respect of.
 *
 * The user need was real, so it is answered rather than dropped. Export a
 * backup file, carry it, import it — same outcome, no account, no server, and
 * the file never leaves the reader's hands. lib/backup.ts already did all of
 * this; it just was not offered at the moment somebody wanted their plan
 * elsewhere.
 *
 * If somebody restores sign-in later: it re-arms the exposure this removed,
 * and privacy-facts.ts has to grow back its ONLY_IF_YOU_SIGN_IN table and
 * PROCESSORS entry on the same commit. lib/__tests__/no-personal-data.test.ts
 * will fail until it does.
 */
export default function SaveMyPlan() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-primary">Keep your plan</p>
      <p className="mt-1 text-xs text-ink-soft">
        Your plan is saved on this device. There is no account and nothing to
        sign in to — we never receive it.
      </p>
      <p className="mt-2 text-xs text-ink-soft">
        Moving to a new phone? Download a backup file and import it there.
      </p>
      <Link
        href="/privacy#your-data"
        className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-deep"
      >
        Download a backup →
      </Link>
    </div>
  );
}
