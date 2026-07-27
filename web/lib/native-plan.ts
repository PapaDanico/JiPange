/**
 * The action plan and goal strategy, generated on the device.
 *
 * WHY THIS REPLACES THE AI CALL
 * ------------------------------
 * The plan's entire input is seven fields — age, county, net pay, savings
 * capacity, dependants, chama membership — and its output is three ranked
 * recommendations drawn from a known universe of Kenyan products. That is not
 * a language problem; it is a decision table. Sending it across a border to a
 * model bought four things nobody wanted: a per-request cost that had to be
 * rate-limited and cached, a ten-second serverless deadline, an "AI planning
 * is temporarily unavailable" dead-end whenever the key was absent, and a
 * privacy-notice section explaining that salaries travel to a processor
 * outside Kenya.
 *
 * Generated here instead, the plan is free at any scale, works offline and in
 * the installed app, answers instantly, never goes down, and NOTHING LEAVES
 * THE DEVICE — the strongest privacy sentence there is, and this codebase's
 * whole posture.
 *
 * WHAT IT GIVES UP, HONESTLY
 * ---------------------------
 * Prose variety. A model writes a different sentence each time; this writes
 * the same sentence for the same person. For financial guidance that is a
 * feature — two readers with the same numbers should get the same advice, and
 * the advice can be tested, which the model's never could.
 *
 * EVIDENCE-BASED FIGURES
 * -----------------------
 * Yields come from the same places the calculators already trust: the live
 * T-bill feed (net of withholding tax), the MMF/bank baselines in
 * lib/journey.ts, and the PAYE bands and pension-relief cap in lib/tax.ts.
 * When those move, the plan moves with them — there is no second copy of any
 * rate in this file.
 */

import type { ActionPlan, ActionPlanItem, GoalStrategy, GoalStrategyRequest, Profile } from "./types";
import { actionPlanSchema, goalStrategySchema } from "./types";
import { formatKES } from "./budget";
import { tbillRate } from "./rates-feed";
import { ASSUMED_CURRENT_YIELD, TARGET_MMF_YIELD } from "./journey";
import { PAYE_BANDS, PENSION_RELIEF_CAP_MONTHLY } from "./tax";
import { PRODUCT_LINKS } from "./affiliate-links";

/**
 * The MMFs to name, from the product directory — never typed into this file.
 *
 * The first version of this engine said "CIC, Britam and Sanlam" in three
 * separate strings. That was a second source of truth about which products
 * exist, and it went out of date immediately: Ziidi, reachable from the
 * M-PESA app and the largest fund in the market, was absent from the advice
 * while sitting in the directory the rest of the app reads.
 *
 * Naming providers is a data question. The directory answers it, dates its
 * yields, and records who regulates each one; this engine's job is to decide
 * WHAT to recommend, not to keep a private list of WHO.
 *
 * Ordered by reach first: a fund a reader can open from a menu they already
 * have beats thirty basis points they will never collect because the
 * onboarding defeated them.
 */
function mmfNames(limit = 3): string {
  const funds = PRODUCT_LINKS.filter((p) => p.type === "mmf");
  const byReach = [
    ...funds.filter((p) => /M-PESA/i.test(p.liquidity) && p.yieldPct === undefined),
    ...funds.filter((p) => !(/M-PESA/i.test(p.liquidity) && p.yieldPct === undefined)),
  ];
  const picked = byReach.slice(0, limit).map((p) => p.shortName.replace(/ MMF$/, ""));
  if (picked.length <= 1) return picked[0] ?? "a money market fund";
  return `${picked.slice(0, -1).join(", ")} and ${picked[picked.length - 1]}`;
}

/** Round to a figure a person would actually set a standing order for. */
function friendly(amount: number): number {
  if (amount >= 20_000) return Math.round(amount / 5_000) * 5_000;
  if (amount >= 5_000) return Math.round(amount / 1_000) * 1_000;
  if (amount >= 1_000) return Math.round(amount / 500) * 500;
  return Math.max(100, Math.round(amount / 100) * 100);
}

/** Marginal PAYE rate at a monthly taxable income — where a pension shilling saves tax. */
function marginalRate(taxableMonthly: number): number {
  for (const band of PAYE_BANDS) {
    if (taxableMonthly <= band.upTo) return band.rate;
  }
  return PAYE_BANDS[PAYE_BANDS.length - 1].rate;
}

const MMF_PCT = (TARGET_MMF_YIELD * 100).toFixed(1);
const BANK_PCT = (ASSUMED_CURRENT_YIELD * 100).toFixed(2);

interface Candidate extends Omit<ActionPlanItem, "rank"> {
  /** Rough 12-month shilling impact — the ranking key. Never shown. */
  score: number;
}

export interface NativePlanInput {
  profile: Profile;
  net: number;
  surplus: number;
}

/**
 * Three ranked, concrete recommendations. Same shape the API returned, so the
 * consumer and stored plans are untouched.
 */
export function buildActionPlan({ profile, net, surplus }: NativePlanInput): ActionPlan {
  // The honesty rule, kept from the prompt it replaces: when the numbers say
  // there is nothing spare, the plan must address that instead of pretending.
  if (surplus <= 0) {
    return actionPlanSchema.parse([
      {
        rank: 1,
        title: "Find where the month goes",
        description:
          `Your outgoings currently meet or exceed your net pay of ${formatKES(net)}, so the first move is visibility, not products. Track every shilling for 30 days — M-PESA statements plus the Budget Split tool — and name the three biggest leaks.`,
        impact: "You cannot fix a leak you have not found; most people locate 10–15% of net pay this way.",
        effort: "medium",
        category: "savings",
      },
      {
        rank: 2,
        title: "Price your short-term debt",
        description:
          "If Fuliza, app loans or salary advances are part of the month, price them with the Fuliza Cost tool — rolled over, they often run past 70% a year. Clearing the most expensive one first is the highest-return move available to you.",
        impact: "Stopping a rolling Fuliza habit typically frees more per month than any investment could earn.",
        effort: "medium",
        category: "debt",
      },
      {
        rank: 3,
        title: "Start with Ksh 100 a day anyway",
        description:
          "Open a zero-fee pocket you cannot spend from — M-Shwari Lock or a money market fund with a low minimum — and move Ksh 100 each day you can. The habit matters more than the amount while the budget is tight.",
        impact: `Roughly ${formatKES(30_000)} of cushion in a year, built before the budget is fixed.`,
        effort: "low",
        category: "savings",
      },
    ]);
  }

  const candidates: Candidate[] = [];
  const emergencyMonthly = friendly(surplus * 0.5);
  const yieldGapPct = ((TARGET_MMF_YIELD - ASSUMED_CURRENT_YIELD) * 100).toFixed(1);

  // Emergency cushion in an MMF — the near-universal first move, scored on the
  // cushion itself, not just the yield, because the yield is not why you do it.
  candidates.push({
    title: "Build a one-month cushion in a money market fund",
    description:
      `Open an MMF — ${mmfNames()} all take small minimums — and set a standing order of ${formatKES(emergencyMonthly)} for payday. Target: one month of net pay — ${formatKES(net)} — as your do-not-touch floor.`,
    impact: `About ${formatKES(emergencyMonthly * 12)} of cushion in 12 months, earning ~${MMF_PCT}% instead of ~${BANK_PCT}% in a bank account — ${yieldGapPct} points of pure difference for the same shilling.`,
    effort: "low",
    category: "savings",
    score: emergencyMonthly * 12 * 0.5 + emergencyMonthly * 12 * (TARGET_MMF_YIELD - ASSUMED_CURRENT_YIELD),
  });

  // Pension relief — real money returned by KRA, scored on the actual tax
  // saving at this person's marginal band.
  const gross = profile.grossMonthlySalary;
  const rate = marginalRate(gross);
  if (rate >= 0.25 && surplus >= 3_000) {
    const pensionMonthly = friendly(Math.min(surplus * 0.3, PENSION_RELIEF_CAP_MONTHLY));
    const taxSavedYear = Math.round(pensionMonthly * rate * 12);
    candidates.push({
      title: "Claim the pension relief KRA leaves on the table",
      description:
        `Contribute ${formatKES(pensionMonthly)}/month to a registered pension — NSSF Tier 2 voluntary or a personal scheme. Contributions up to ${formatKES(PENSION_RELIEF_CAP_MONTHLY)}/month are deducted from taxable pay (Income Tax Act s.15(3)), so at your ${Math.round(rate * 100)}% band each shilling costs you ${(1 - rate).toFixed(2)}.`,
      impact: `About ${formatKES(taxSavedYear)} of tax back over 12 months, on top of the retirement pot itself${profile.age < 35 ? " — and at " + profile.age + ", decades of compounding still ahead of it" : ""}.`,
      effort: "medium",
      category: "tax",
      score: taxSavedYear,
    });
  }

  // T-bills once the surplus can reach the minimum inside a quarter. Uses the
  // LIVE net yield from the feed — never a number typed into this file.
  const bill = tbillRate(364);
  if (bill && surplus >= 15_000) {
    const min = bill.minInvestmentKES ?? 100_000;
    const monthsToMin = Math.max(1, Math.ceil(min / surplus));
    candidates.push({
      title: "Open a DhowCSD account and ladder into T-bills",
      description:
        `Register on CBK's DhowCSD app now (free, needs your ID and KRA PIN), park savings in your MMF until you reach the ${formatKES(min)} minimum — about ${monthsToMin} month${monthsToMin === 1 ? "" : "s"} at your pace — then bid non-competitively for the 364-day bill.`,
      impact: `The 364-day bill currently nets ${bill.netEAY.toFixed(2)}% after withholding tax — government-backed, and the rate is live from CBK's latest auction, not a brochure figure.`,
      effort: "medium",
      category: "investment",
      score: min * (bill.netEAY / 100) * 0.75,
    });
  }

  // Dependants change what "safe" means before any investment does.
  if (profile.dependants > 0) {
    candidates.push({
      title: "Put a floor under the people who depend on you",
      description:
        `With ${profile.dependants} dependant${profile.dependants === 1 ? "" : "s"}, confirm your SHA registration is active and premiums current, then price simple term life cover — from roughly Ksh 500–1,500/month at your age from the major Kenyan insurers. Cover before compounding.`,
      impact: "One hospital bill or worse, uninsured, can erase years of saving in a month. This is the cheapest large risk you can move off your family.",
      effort: "low",
      category: "insurance",
      score: net * 2 * 0.4,
    });
  }

  // Chama members: the money is already moving — make it earn and guard it.
  if (profile.chamaMember) {
    candidates.push({
      title: "Make the chama money work between meetings",
      description:
        "Move the group's idle float from a bank account into a regulated Sacco or an MMF in the group's name, and before guaranteeing any member's loan, check what it freezes with the Guarantor Shield tool.",
      impact: `Idle group funds earn ~${MMF_PCT}% instead of ~${BANK_PCT}%, and an unpriced guarantee is the most common way disciplined savers lose capital.`,
      effort: "medium",
      category: "savings",
      score: surplus * 6 * (TARGET_MMF_YIELD - ASSUMED_CURRENT_YIELD) + net * 0.1,
    });
  } else if (surplus >= 5_000 && !(bill && surplus >= 15_000)) {
    candidates.push({
      title: "Join a regulated Sacco for the dividend, not the myth",
      description:
        `A tier-1, SASRA-regulated Sacco pays dividends and interest on deposits that have recently run near ~9% — put ${formatKES(friendly(surplus * 0.25))}/month there once your MMF cushion exists. Regulated only: check SASRA's licensed list first.`,
      impact: "A second compounding pot with borrowing rights against it later — at roughly triple a bank account's rate.",
      effort: "low",
      category: "investment",
      score: friendly(surplus * 0.25) * 12 * 0.09,
    });
  }

  // Universally applicable floor candidates, so the pool can always seat three
  // distinct categories. A Ksh 1,000 surplus is still owed a full plan.
  candidates.push({
    title: "Price any mobile debt before it prices you",
    description:
      "Run whatever you owe — Fuliza, app loans, salary advances — through the Fuliza Cost and Loan Repayment tools once. Rolled-over mobile credit routinely exceeds 70% a year, which outruns anything your savings can earn.",
    impact: "Clearing the most expensive debt first is the highest guaranteed return available to any saver.",
    effort: "low",
    category: "debt",
    score: 2, // floor: seats only when nothing stronger qualifies
  });
  if (profile.dependants === 0) {
    candidates.push({
      title: "Confirm your own SHA cover is active",
      description:
        "Check your SHA registration and contributions are current — one admission without cover can consume a year of savings, and reinstating lapsed cover takes longer than keeping it.",
      impact: "Your emergency fund stays for emergencies that insurance cannot carry, instead of becoming the insurance.",
      effort: "low",
      category: "insurance",
      score: 1, // floor: seats only when nothing stronger qualifies
    });
  }

  // Rank by modelled impact; never two of a kind, because three flavours of
  // "save more" is one recommendation wearing three hats.
  const ranked = candidates.sort((a, b) => b.score - a.score);
  const picked: Candidate[] = [];
  for (const c of ranked) {
    if (picked.length === 3) break;
    if (picked.some((p) => p.category === c.category)) continue;
    picked.push(c);
  }
  for (const c of ranked) {
    if (picked.length === 3) break;
    if (!picked.includes(c)) picked.push(c);
  }

  return actionPlanSchema.parse(
    picked.map((c, i) => ({ title: c.title, description: c.description, impact: c.impact, effort: c.effort, category: c.category, rank: i + 1 }))
  );
}

/* ────────────────────────── goal strategy ────────────────────────── */

const VEHICLE_BY_GOAL: Record<GoalStrategyRequest["goalType"], (r: GoalStrategyRequest) => string> = {
  emergency: () => "Money market fund (instant-access)",
  business: () => "Money market fund, kept liquid",
  education: (r) => (r.years < 3 ? "Money market fund" : "MMF + medium-dated Treasury bonds via DhowCSD"),
  home: (r) => (r.years < 4 ? "Money market fund" : "Sacco deposits + MMF"),
  retirement: () => "Registered pension (tax relief) + long infrastructure bonds",
};

const WATCH_OUT: Record<GoalStrategyRequest["goalType"], string> = {
  emergency:
    "The enemy is withdrawal, not yield. Keep this pot in a different institution from your spending account, and never chase a higher rate that adds lock-in — an emergency fund you cannot reach on a Tuesday night has failed at its one job.",
  business:
    "Do not lock this capital. Fixed deposits and bonds punish early exit, and a business opportunity rarely waits 90 days. Liquidity is the return here.",
  education:
    "Fees inflate faster than general prices. Revisit the target every January against the actual fee letter, not the old assumption — and resist borrowing against this pot for anything else.",
  home:
    "Plot scams outrun savings mistakes in Kenya. Budget for a lawyer and an official land search before any deposit leaves this pot — the search fee is noise next to a lost deposit.",
  retirement:
    "The tax relief only exists inside registered schemes. An unregistered 'pension' from a chama or app gets no s.15(3) deduction and no RBA protection — check the register before the first shilling.",
};

/**
 * WHERE to put the money and HOW to start, from the goal's own numbers.
 * Deterministic sibling of buildActionPlan — same output contract as the API.
 */
export function buildGoalStrategy(request: GoalStrategyRequest): GoalStrategy {
  const { goalType, targetAmount, years, currentSavings, requiredMonthly, monthlyCapacity } = request;
  const vehicle = VEHICLE_BY_GOAL[goalType](request);
  const remaining = Math.max(0, targetAmount - currentSavings);

  const overCapacity =
    request.feasibility === "beyond-reach" && monthlyCapacity != null && monthlyCapacity > 0;
  const startMonthly = friendly(
    overCapacity ? monthlyCapacity : requiredMonthly > 0 ? requiredMonthly : (monthlyCapacity ?? 0) || remaining / Math.max(1, years * 12)
  );

  const why =
    goalType === "emergency" || goalType === "business"
      ? `This money's job is to be there, whole, on short notice — so capital preservation and same-week access beat every extra point of yield. An MMF pays ~${MMF_PCT}% while staying reachable; anything offering more does it by locking the door.`
      : goalType === "retirement"
        ? `At a ${years}-year horizon the two forces that matter are compounding and tax. A registered pension returns your marginal PAYE rate on every contribution up to ${formatKES(PENSION_RELIEF_CAP_MONTHLY)}/month, and infrastructure bonds pay coupons free of withholding tax — both are structural edges no unwrapped account can match.`
        : years < 3
          ? `At under three years, a market dip has no time to recover, so this stays in an MMF at ~${MMF_PCT}% — dull on purpose. The plan's engine is the monthly deposit, not the return.`
          : `At ${years} years there is room to earn more than an MMF alone: a base of instant-access MMF plus medium-dated government paper via DhowCSD lifts the blended return while the deposit dates stay matched to when the money is needed.`;

  const steps: GoalStrategy["steps"] = [
    {
      step: 1,
      title: overCapacity ? "Start at your real capacity — honestly" : "Open the vehicle this week",
      description: overCapacity
        ? `The required ${formatKES(requiredMonthly)}/month exceeds your stated capacity of ${formatKES(monthlyCapacity!)}. Do not pretend otherwise: start the standing order at ${formatKES(startMonthly)}, and either extend the timeline or trim the target — the plan that survives is the one you can actually pay.`
        : `${goalType === "retirement" ? "Ask your employer about NSSF Tier 2 voluntary contributions, or open a personal pension with a registered manager (check the RBA register)" : `Open an MMF (${mmfNames()}) — small minimums, same-week access`}, and put the first ${formatKES(startMonthly)} in before the month ends.`,
    },
    {
      step: 2,
      title: "Automate it on payday",
      description: `Set a standing order of ${formatKES(startMonthly)} for the day after your salary lands — the plan should not depend on willpower twelve times a year. ${currentSavings > 0 ? `Your existing ${formatKES(currentSavings)} moves in as the opening balance.` : "It starts from zero; the standing order is the whole machine."}`,
    },
    {
      step: 3,
      title:
        goalType === "education" || goalType === "home"
          ? "Step up into government paper as the pot grows"
          : goalType === "retirement"
            ? "Add tax-free infrastructure bonds on top"
            : "Review every January, touch it never",
      description:
        goalType === "education" || goalType === "home"
          ? `Once the pot passes ${formatKES(100_000)}, move slices into Treasury bonds via CBK's DhowCSD app with maturities landing just before you need the money — the fee letter dates for education, the purchase date for property.`
          : goalType === "retirement"
            ? `When an infrastructure bond auction opens (they recur through the year), bid via DhowCSD: IFB coupons carry no withholding tax, which at long horizons compounds into a meaningfully larger pot than any taxed alternative.`
            : `Once a year, check the balance against the ${formatKES(targetAmount)} target and raise the standing order with any pay rise. Between reviews, the rule is simple: it does not exist for spending.`,
    },
  ];

  return goalStrategySchema.parse({ vehicle, why, steps, watchOut: WATCH_OUT[goalType] });
}
