import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { tbillRate } from "../rates-feed";
import { assumedMmfYield, MMF_FALLBACK_YIELD } from "../mmf-assumption";
import { TARGET_MMF_YIELD } from "../journey";
import { SMOOTHER_MMF_RATE } from "../school-fees";
import { BANK_SAVINGS_BASELINE } from "../market-2026";
import { ASSUMED_CURRENT_YIELD } from "../journey";

/**
 * Market rates are read, not typed.
 *
 * The codebase held four MMF yields — 11.5%, 11.8%, 12%, and the directory's
 * own numbers — and two of them carried a comment explaining that harmonising
 * them was "a product call, not a mechanical fix". That reads like a decision
 * and was not one: nobody chose three values thirty basis points apart for
 * three calculators, three people typed a plausible number on three different
 * days, and the comment made the drift look deliberate enough to survive
 * review twice.
 *
 * Underneath that was the real fault. A money market fund holds Treasury bills
 * and bank deposits, so its yield is the short bill plus a thin spread — not an
 * independent fact anybody is entitled to type. When bills fell from 16% to 9%,
 * every hardcoded figure stayed put and became a promise the market could no
 * longer keep, while a reader was told an MMF pays 11.5%.
 *
 * These checks hold the anchor in place.
 */
describe("market rate assumptions are anchored to the feed", () => {
  it("the MMF assumption tracks the live 91-day bill", () => {
    const bill = tbillRate(91);
    expect(bill, "no 91-day bill in the feed").toBeTruthy();
    // Moves WITH the bill, rather than merely sitting near it today: a
    // hardcoded 0.103 would pass a range check and fail this one.
    expect(assumedMmfYield() * 100).toBeGreaterThan(bill!.grossEAY);
    expect(assumedMmfYield() * 100).toBeLessThan(bill!.grossEAY + 3);
  });

  it("every calculator uses that one assumption, not its own", () => {
    expect(TARGET_MMF_YIELD).toBe(assumedMmfYield());
    expect(SMOOTHER_MMF_RATE).toBe(assumedMmfYield());
  });

  it("the bank savings baseline is one constant, not two copies", () => {
    // Both held the literal 0.0323, so a future correction would have landed
    // in one file and silently disagreed with the other.
    expect(BANK_SAVINGS_BASELINE).toBe(ASSUMED_CURRENT_YIELD);
  });

  it("under-promises when the anchor is missing", () => {
    // The fallback must be below what it replaces. If the feed goes away, the
    // safe direction to be wrong in is pessimistic — the whole failure this
    // module addresses was optimism that outlived its evidence.
    expect(MMF_FALLBACK_YIELD).toBeLessThan(assumedMmfYield() + 0.02);
  });

  /**
   * The scan that would have caught the original drift.
   *
   * Any new `const SOMETHING_YIELD = 0.11` in lib/ is a market rate somebody
   * typed, and typing one is how this codebase acquired four.
   */
  it("no module declares its own MMF or T-bill rate literal", () => {
    const LIB = new URL("..", import.meta.url).pathname;
    const offenders: string[] = [];
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        if (name === "__tests__" || name === "node_modules") return [];
        if (statSync(full).isDirectory()) return walk(full);
        // mmf-assumption.ts is the one module allowed a literal: it holds the
        // fallback used when the feed carries no bill, which by definition
        // cannot be derived from the feed. Exempting the anchor is not the
        // line-pardoning mistake found elsewhere — this is a whole file whose
        // job is to be the single place a rate is written down.
        if (/mmf-assumption\.ts$/.test(full)) return [];
        return /\.ts$/.test(full) ? [full] : [];
      });

    for (const file of walk(LIB)) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
          const stripped = line.replace(/\/\/.*$/, "");
          // A named MMF/T-bill/yield constant assigned a bare decimal.
          if (/\b(?:const|let)\s+\w*(?:MMF|TBILL|T_BILL)\w*\s*=\s*0?\.\d+/i.test(stripped)) {
            offenders.push(`${file.replace(LIB, "lib/")}:${i + 1}  ${line.trim().slice(0, 88)}`);
          }
        });
    }
    expect(
      offenders,
      `read the rate from lib/mmf-assumption.ts instead of typing one:\n${offenders.join("\n")}`
    ).toEqual([]);
  });
});
