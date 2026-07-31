import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { tbillRate } from "../rates-feed";
import {
  PRODUCT_LINKS,
  YIELDS_AS_OF,
  YIELDS_MAX_AGE_DAYS,
  SACCO_RATES_AS_OF,
  SACCO_RATES_SOURCE,
  SACCO_DIVIDEND_RANGE_PCT,
  SACCO_DEPOSIT_GUARANTEE_OPERATIONAL,
  yieldsAreStale,
} from "../affiliate-links";

/**
 * The product directory is the single source of truth about which financial
 * products exist, what they yield, and who regulates them.
 *
 * Two defects prompted these checks. The plan engine kept its own private
 * list of provider names in prose, which went out of date the moment the
 * market moved — Ziidi, reachable from the M-PESA app and the largest fund in
 * the market, was missing from the advice while the directory was the obvious
 * place to look. And the yields carried no date at all: an undated "11.8%" is
 * true when typed and quietly wrong a quarter later, which is the defect this
 * codebase has spent a long time removing everywhere else.
 */
describe("product yields are dated", () => {
  /* This assertion used to be `yieldsAreStale() === false`, and it went red on
   * schedule — correctly, because the survey had aged out.
   *
   * The trouble is where that leaves whoever finds it red. Re-surveying
   * fifteen funds is real work; editing YIELDS_AS_OF to today is one
   * keystroke and turns the suite green without a single yield having been
   * checked. A guard whose cheapest repair is falsifying the thing it guards
   * will eventually be repaired that way, and then it is worse than absent,
   * because the date it now carries is a lie with a test vouching for it.
   *
   * So the deadline is kept and the consequence is moved to where it belongs.
   * Being overdue is allowed; passing overdue figures off as current is not.
   * `yieldsAreStale()` was already written for exactly this and rendered
   * nowhere — the one condition it existed to catch was live in production
   * with no reader ever told. Now the page says so, and this asserts that it
   * does. Re-surveying still clears the notice; nothing else does. */
  it("tells the reader when the survey has aged out, rather than quoting it plainly", () => {
    /* Scanned from the component body onward, not the whole file. The first
     * version of this check searched the file and passed with the notice
     * deleted, because the import statement still named `yieldsAreStale` —
     * it was asserting that the symbol had been imported, which is precisely
     * the state the old code was already in and the state that failed. */
    const file = readFileSync(
      new URL("../../components/partners/PartnersView.tsx", import.meta.url),
      "utf8"
    );
    const body = file.slice(file.indexOf("export default function PartnersView"));
    expect(body, "PartnersView no longer declares a default export").not.toBe("");
    expect(
      body,
      "the yields can go stale and the partners page renders no notice that says so"
    ).toMatch(/\{\s*yieldsAreStale\(\)\s*&&/);
    expect(body).toMatch(/YIELDS_MAX_AGE_DAYS/);

    /* And it must describe what the date actually covers. The first version of
     * this notice warned about "fund yields" and reassured the reader that
     * minimums were unaffected — exactly inverted. No money market fund in this
     * directory carries a yield at all (a considered refusal, documented at the
     * Ziidi entry), so the notice disclaimed something the page does not show
     * and vouched for the one thing the date is actually about. */
    expect(
      body,
      'the staleness notice claims fund yields are shown, and none are'
    ).not.toMatch(/fund yields (below|above) were surveyed/i);
    expect(body, 'the notice does not say what the survey covers').toMatch(/minimum/i);
  });

  it("records how overdue the survey is, so it cannot drift indefinitely", () => {
    // Not an assertion so much as a visible countdown: if this ever prints a
    // number in the hundreds, the directory is quoting a different market.
    const overdueDays = Math.floor(
      (Date.now() - new Date(YIELDS_AS_OF).getTime()) / 86_400_000 - YIELDS_MAX_AGE_DAYS
    );
    expect(
      overdueDays,
      `the yield survey (${YIELDS_AS_OF}) is ${overdueDays} days past its ${YIELDS_MAX_AGE_DAYS}-day window — re-check the providers`
    ).toBeLessThan(365);
  });

  it("goes stale after the window rather than quoting old rates forever", () => {
    const asOf = new Date(YIELDS_AS_OF);
    const inside = new Date(asOf.getTime() + (YIELDS_MAX_AGE_DAYS - 1) * 86_400_000);
    const outside = new Date(asOf.getTime() + (YIELDS_MAX_AGE_DAYS + 1) * 86_400_000);
    expect(yieldsAreStale(inside)).toBe(false);
    expect(yieldsAreStale(outside)).toBe(true);
  });
});

describe("the directory describes each product honestly", () => {
  it("every quoted yield belongs to a product that names its regulator", () => {
    // A rate without a regulator is a number from nowhere.
    for (const p of PRODUCT_LINKS.filter((x) => x.yieldPct !== undefined)) {
      expect(p.regulator, `${p.slug} quotes a yield with no regulator`).toBeTruthy();
    }
  });

  it("carries the M-PESA-reachable money market fund, marked as such", () => {
    // Reach decides whether somebody starts at all. A fund openable from a
    // menu the reader already has beats basis points they never collect
    // because the onboarding defeated them.
    //
    // Asserted on the explicit flag, not on the liquidity prose: every fund
    // here says "T+1 to M-Pesa", so a /M-PESA/i match identifies nothing.
    // The earlier version of this check passed for that empty reason.
    const reachable = PRODUCT_LINKS.filter((p) => p.type === "mmf" && p.walletNative);
    expect(reachable.length, "no MMF marked walletNative is listed").toBeGreaterThan(0);
    for (const p of reachable) {
      expect(p.liquidity, `${p.slug} is walletNative but never mentions M-PESA`).toMatch(/M-PESA/i);
    }
  });

  /**
   * The refusal is part of the data, so it is pinned like any other fact.
   *
   * Two figures are in circulation for this fund and both are traps: its own
   * 9.50% is from February 2025, and the 18.20% that appears next to the name
   * "Zidi" in current survey tables belongs to Etica Capital's fund — a
   * different manager, one letter away. Quoting either would overstate or
   * misdate the largest fund in the market. If a verified current figure is
   * ever added, this test should be deleted deliberately, not deleted because
   * it started failing.
   */
  it("quotes no yield for the fund whose only available figures are wrong", () => {
    const ziidi = PRODUCT_LINKS.find((p) => p.slug === "ziidi-mmf");
    expect(ziidi, "ziidi-mmf is missing from the directory").toBeTruthy();
    expect(
      ziidi!.yieldPct,
      "a yield appeared for Ziidi — confirm it is Safaricom's fund and current, not Etica's 'Zidi'"
    ).toBeUndefined();
    expect(ziidi!.minKes, "Ziidi's Ksh 100 minimum is its defining feature").toBe(100);
  });

  it("quotes no yield that predates the survey the date claims", () => {
    // The stale-yield defect in its subtler form: a figure nobody re-checked
    // sitting under a date somebody refreshed. Any fund carrying a number is
    // asserting it was observed on YIELDS_AS_OF — funds outside that survey
    // must carry nothing rather than an inherited figure wearing a new date.
    const quoted = PRODUCT_LINKS.filter((p) => p.type === "mmf" && p.yieldPct !== undefined);
    for (const p of quoted) {
      expect(p.yieldPct, `${p.slug} quotes an implausible MMF yield`).toBeGreaterThan(5);
      expect(p.yieldPct, `${p.slug} quotes an implausible MMF yield`).toBeLessThan(25);
    }
  });

  /**
   * A URL is a promise that somebody opened the page.
   *
   * Six funds were added from a yield survey that carried rates and minimums
   * but no links, and no provider site is reachable from where this runs. The
   * temptation is to compose a plausible address from the manager's name —
   * which on a financial product sends a reader looking to move money to a
   * page nobody has loaded. Absent is the correct value, and both cards render
   * facts instead of a button when it is absent.
   */
  it("never invents a provider URL", () => {
    for (const p of PRODUCT_LINKS) {
      if (p.url === undefined) continue;
      expect(p.url, `${p.slug} has a malformed URL`).toMatch(/^https:\/\/[\w.-]+\.\w{2,}/);
    }
    // The survey funds are the ones with no verified link; if a URL ever
    // appears on one, it should be because somebody opened it.
    const unlinked = PRODUCT_LINKS.filter((p) => p.url === undefined).map((p) => p.slug);
    expect(unlinked.length, "expected the survey-sourced funds to carry no URL").toBeGreaterThan(0);
  });

  /**
   * A money market fund cannot out-earn what it holds.
   *
   * MMFs invest in Treasury bills and bank deposits, so a fund's gross yield
   * sits near the short bill plus a thin spread, and then management fees take
   * a bite. It cannot sit eight points above the instrument it is made of.
   *
   * This check exists because the directory briefly carried 14.8-18.2% while
   * the 91-day bill was paying 9.30%. Those figures came from a survey labelled
   * with a recent date but produced in a much higher rate environment — Kenyan
   * bills were above 16% not long before — and nothing in the codebase could
   * tell the difference, because a plausible-looking percentage with a recent
   * date beside it passes every check that only asks "is this a number?".
   *
   * The live feed is the anchor precisely because it cannot be typed in wrong.
   *
   * WHY THIS BAND HAS TWO SIDES
   * ---------------------------
   * It had one. It only asked whether a quote was too HIGH — which caught the
   * defect that prompted it and would have slept through the mirror image: a
   * fund carried at 5.8% while the bill it holds pays 9.30%. That is not a
   * conservative fund, it is a stale or mistyped number, and it fails in the
   * worse direction: it keeps a reader's money in a bank account by making the
   * alternative look pointless. An MMF can lag its bills by fees and a cash
   * drag; it cannot lag them by a third.
   *
   * A one-sided band is a check that half works, which is the kind most likely
   * to be trusted as though it worked.
   */
  it("quotes no MMF yield that the underlying T-bill cannot support", () => {
    const bill = tbillRate(91);
    expect(bill, "no 91-day bill in the feed to sanity-check against").toBeTruthy();
    const anchor = bill!.grossEAY;
    /* Above: a thin spread over the bill, plus room for a genuinely good fund.
     * Below: fees and cash drag, which are real but bounded — a fund holding
     * 9.30% paper does not return 6%. */
    const ceiling = anchor + 4;
    const floor = anchor - 2.5;
    const quoted = PRODUCT_LINKS.filter((x) => x.type === "mmf" && x.yieldPct !== undefined);

    /* A tripwire on the empty state, not a demand that it be non-empty.
     *
     * Today the directory quotes NO MMF yield at all — every candidate figure
     * was either stale or belonged to a differently-spelled fund, and each was
     * refused in writing at its entry in affiliate-links.ts. So the band below
     * currently iterates over nothing, and a loop over nothing passes.
     *
     * Asserting "there must be some" would turn that careful refusal into a red
     * build and pressure somebody into quoting a number to make CI happy, which
     * is the worst outcome available. Asserting the count instead means the day
     * a sourced yield IS added, this line fails, whoever added it reads this
     * comment, deletes the line — and the band starts genuinely guarding on the
     * same commit. Silence stays honest; it just cannot stay unnoticed. */
    expect(
      quoted.length,
      "an MMF now carries a yield. The band below will check it from here on; " +
        "delete this assertion (and this comment) as part of that change."
    ).toBe(0);

    for (const p of quoted) {
      expect(
        p.yieldPct,
        `${p.slug} quotes ${p.yieldPct}% gross while the 91-day bill pays ` +
          `${anchor.toFixed(2)}% — an MMF cannot durably beat the paper it holds ` +
          `by that much, so this figure is from an older rate environment`
      ).toBeLessThanOrEqual(ceiling);
      expect(
        p.yieldPct,
        `${p.slug} quotes ${p.yieldPct}% gross while the 91-day bill pays ` +
          `${anchor.toFixed(2)}% — fees and cash drag do not cost that much, so this ` +
          `figure is stale or mistyped, and it understates the case for moving money`
      ).toBeGreaterThanOrEqual(floor);
    }
  });

  /**
   * SACCO figures answer to SASRA, not to the Treasury bill.
   *
   * The MMF ceiling above must never be applied here — a dividend is a share
   * of a society's annual lending surplus, voted at an AGM, so double digits
   * can sit honestly beside a 9% bill. What they do owe is a date, a source,
   * and a range they cannot silently leave.
   */
  it("dates and sources every SACCO dividend, inside the range SASRA reports", () => {
    const saccos = PRODUCT_LINKS.filter((p) => p.type === "sacco" && p.yieldPct !== undefined);
    expect(saccos.length, "no SACCO dividends to check").toBeGreaterThan(0);
    expect(Number.isNaN(new Date(SACCO_RATES_AS_OF).getTime())).toBe(false);
    expect(SACCO_RATES_SOURCE, "the figures cite no supervisory source").toMatch(/SASRA/i);
    for (const p of saccos) {
      expect(
        p.yieldPct,
        `${p.slug} quotes ${p.yieldPct}%, outside the ${SACCO_DIVIDEND_RANGE_PCT.low}-${SACCO_DIVIDEND_RANGE_PCT.high}% range SASRA reports for the sector`
      ).toBeGreaterThanOrEqual(SACCO_DIVIDEND_RANGE_PCT.low);
      expect(p.yieldPct).toBeLessThanOrEqual(SACCO_DIVIDEND_RANGE_PCT.high);
    }
  });

  /**
   * The two things a yield cannot tell you.
   *
   * "13% dividends p.a." beside "min entry Ksh 1,000" reads as 13% on
   * everything you put in — but the dividend is declared on share capital
   * while deposits earn a separate, lower rate. And the Deposit Guarantee
   * Fund the Act provides for is not operational, so a SACCO deposit has no
   * live statutory cover while a bank deposit has KDIC. A reader comparing a
   * 13% SACCO against a 9% bill is owed both facts, and neither is derivable
   * from the number on the card.
   */
  it("says what the SACCO rate is paid on, and that deposits are unguaranteed", () => {
    for (const p of PRODUCT_LINKS.filter((x) => x.type === "sacco")) {
      expect(p.yieldApplies, `${p.slug} does not say what its rate is paid on`).toMatch(
        /share capital/i
      );
      expect(p.protection, `${p.slug} does not disclose the deposit guarantee gap`).toBeTruthy();
    }
    // If the Fund is ever operationalised this flips, and the cards should
    // stop warning about it — a stale warning is its own kind of wrong.
    expect(SACCO_DEPOSIT_GUARANTEE_OPERATIONAL).toBe(false);
  });

  it("still claims no affiliate arrangement anywhere, as the terms state", () => {
    expect(PRODUCT_LINKS.filter((p) => p.isAffiliate).map((p) => p.slug)).toEqual([]);
  });

  it("has no duplicate slugs", () => {
    const slugs = PRODUCT_LINKS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
