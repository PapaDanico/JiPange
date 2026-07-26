/**
 * The words a Kenyan calculator uses without explaining them.
 *
 * JiPange had twenty-five calculators and no glossary. Every one of them
 * produced a number and named it — "net EAY", "effective APR", "real return",
 * "tier 1 NSSF" — and there was nowhere in the product to find out what any of
 * those meant. A tool that computes correctly and explains nothing is a
 * calculator, not financial literacy, and literacy is the point.
 *
 * TWO RULES THIS FILE FOLLOWS
 * --------------------------
 * 1. DEFINE WHAT THE APP ACTUALLY SAYS. Every term here appears somewhere in
 *    the product or in the documents a reader will meet immediately after it —
 *    a payslip, a SACCO statement, a CBK auction notice. It is not a finance
 *    dictionary; it is a decoder for this app and the paperwork around it.
 *
 * 2. SAY WHERE IT BITES. A definition that stops at the definition is trivia.
 *    Each entry ends on the mistake the term causes, because the reason people
 *    lose money to jargon is not that they cannot define it — it is that they
 *    do not know which number it silently changes.
 */

export interface GlossaryEntry {
  term: string;
  /** Plain-language definition. */
  meaning: string;
  /** The mistake this term causes, and where in the app it shows up. */
  whyItMatters: string;
  /** Grouping for the page. */
  topic: "Pay & tax" | "Borrowing" | "Saving & investing" | "Health & retirement";
  /** Related calculator, if one exists. */
  toolPath?: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  /* ───────────────────────────────────────────────────────── Pay & tax */
  {
    term: "Gross vs net",
    meaning:
      "Gross is what your employer says they pay you. Net is what reaches your account after PAYE, NSSF, SHA and the housing levy.",
    whyItMatters:
      "Almost every quoted figure in Kenyan finance is gross, and almost every figure you can actually spend is net. Comparing one to the other is the single most common money mistake there is — it is why a job offer can be larger and leave you poorer.",
    topic: "Pay & tax",
    toolPath: "/tools/take-home-pay",
  },
  {
    term: "PAYE",
    meaning:
      "Pay As You Earn — income tax your employer deducts before paying you, charged in bands that rise with income.",
    whyItMatters:
      "It is charged on the band, not the whole salary: a raise that pushes you into a higher band taxes only the part above the threshold, not everything. People turn down money believing otherwise.",
    topic: "Pay & tax",
    toolPath: "/tools/take-home-pay",
  },
  {
    term: "Personal relief",
    meaning: "A fixed monthly amount subtracted from your PAYE bill, not from your income.",
    whyItMatters:
      "Because it comes off the tax rather than the pay, it is worth the same shillings to everyone — which makes it proportionally far more valuable at a low salary than a high one.",
    topic: "Pay & tax",
    toolPath: "/tools/take-home-pay",
  },
  {
    term: "NSSF Tier I and Tier II",
    meaning:
      "Two layers of the National Social Security Fund contribution. Tier I applies to the lower band of pensionable pay, Tier II to the band above it.",
    whyItMatters:
      "Tier II can be contracted out to an approved private scheme. Readers who do not know the two layers are separate cannot tell whether their employer has done so, or what happened to that money.",
    topic: "Pay & tax",
    toolPath: "/tools/take-home-pay",
  },
  {
    term: "Withholding tax (WHT)",
    meaning:
      "Tax deducted at source from investment income before it reaches you — 15% on most interest, 5% on SACCO dividends, 0% on infrastructure bonds.",
    whyItMatters:
      "Every advertised investment yield in Kenya is quoted BEFORE this. An 11.5% money market fund pays about 9.8%. Comparing an advertised MMF rate to an after-tax rate is comparing two different things and choosing wrong.",
    topic: "Saving & investing",
    toolPath: "/tools/investment-returns",
  },
  {
    term: "Taxable vs tax-free income",
    meaning:
      "Some income is taxed at source, some is exempt. Infrastructure bond interest is exempt; bank, MMF and ordinary bond interest is not.",
    whyItMatters:
      "A tax-free 12.8% beats a taxable 14% once 15% withholding tax is applied. The headline ranking and the real ranking are different, and only the real one pays for anything.",
    topic: "Saving & investing",
  },

  /* ───────────────────────────────────────────────────────── Borrowing */
  {
    term: "APR (annual percentage rate)",
    meaning:
      "The annual cost of borrowing, expressed as a percentage of the amount borrowed.",
    whyItMatters:
      "A daily fee is an enormous APR. Fuliza's roughly 1.083% a day is about 400% a year, and a lender quoting the daily figure is not lying — they are relying on you not annualising it.",
    topic: "Borrowing",
    toolPath: "/tools/fuliza-cost",
  },
  {
    term: "Flat rate vs reducing balance",
    meaning:
      "A flat rate charges interest on the ORIGINAL amount for the whole term. Reducing balance charges it on what you still owe.",
    whyItMatters:
      "A 12% flat rate is roughly a 22% reducing-balance rate on a typical term — nearly double. Kenyan lenders quote both, and the flat one always looks cheaper because it is designed to.",
    topic: "Borrowing",
    toolPath: "/tools/loan-repayment",
  },
  {
    term: "The one-third rule",
    meaning:
      "A statutory limit: your total loan deductions may not leave you with less than one third of your gross pay.",
    whyItMatters:
      "It is a floor on what survives your deductions, not a target to fill. Borrowing up to the limit is legal and generally ruinous — the rule exists to stop lenders, not to guide you.",
    topic: "Borrowing",
    toolPath: "/tools/one-third-rule",
  },
  {
    term: "Guaranteeing a loan",
    meaning:
      "Pledging your own SACCO savings as security for somebody else's borrowing.",
    whyItMatters:
      "The pledged amount stops being yours to borrow against, even though it still shows in your balance. People discover their own loan was refused because of a guarantee they had forgotten giving.",
    topic: "Borrowing",
    toolPath: "/tools/guarantor-shield",
  },

  /* ─────────────────────────────────────────────── Saving & investing */
  {
    term: "Compound interest",
    meaning: "Interest earned on interest already earned, rather than only on what you put in.",
    whyItMatters:
      "It is why starting ten years earlier beats saving twice as much later, and why a debt left to roll grows faster than it feels like it should. Nearly every result in this app is compounding pointed in one direction or the other.",
    topic: "Saving & investing",
    toolPath: "/tools/investment-returns",
  },
  {
    term: "Money market fund (MMF)",
    meaning:
      "A pooled fund investing in short-term government and bank paper, quoted as an annualised yield and usually available at T+1.",
    whyItMatters:
      "The advertised yield is gross, daily-accrued and variable — three qualifications at once. It is the most useful default home for short-term money in Kenya, and the least accurately compared.",
    topic: "Saving & investing",
    toolPath: "/tools/sacco-vs-bank",
  },
  {
    term: "SACCO dividend vs interest on deposits",
    meaning:
      "SACCOs pay a dividend on share capital and interest on deposits. They are different pools with different rates and different rules.",
    whyItMatters:
      "A headline '15% dividend' may apply only to shares, which are often a small part of what you hold and are not withdrawable on demand. Applying it to your whole balance overstates the return substantially.",
    topic: "Saving & investing",
    toolPath: "/tools/sacco-vs-bank",
  },
  {
    term: "Treasury bill discount rate",
    meaning:
      "How CBK quotes a T-bill. You pay less than the face value and are repaid the face value; the quoted rate describes that discount.",
    whyItMatters:
      "It is NOT the return. The discount is earned on the smaller amount you actually paid, so the true gross yield is higher — and 15% withholding tax then pulls the net below the quote. Multiplying your capital by the quoted rate is wrong twice, in opposite directions.",
    topic: "Saving & investing",
    toolPath: "/tools/dhowcsd",
  },
  {
    term: "Effective annual yield (EAY)",
    meaning:
      "What an investment actually returns over a year once the timing of the payments is accounted for.",
    whyItMatters:
      "Two products quoting the same headline rate can pay different EAYs depending on how often they pay out. EAY is the number that lets you compare them; the headline rate is the number that lets them be compared favourably.",
    topic: "Saving & investing",
    toolPath: "/tools/dhowcsd",
  },
  {
    term: "Nominal vs real return",
    meaning:
      "Nominal is the growth in shillings. Real is the growth in what those shillings buy, after inflation.",
    whyItMatters:
      "A 9% return with 6.4% inflation is about 2.4% real — you are roughly a quarter as much better off as the headline suggests. Money in an account paying below inflation is shrinking while the balance rises.",
    topic: "Saving & investing",
    toolPath: "/tools/inflation-reality",
  },
  {
    term: "Inflation (CPI)",
    meaning:
      "The rate at which the general price level rises, measured by the Consumer Price Index.",
    whyItMatters:
      "It is the hurdle every investment has to clear before it has done anything at all. It is also an average across a basket — your own inflation depends on what you actually buy, and school fees and medical care have historically run well above it.",
    topic: "Saving & investing",
    toolPath: "/tools/inflation-reality",
  },
  {
    term: "Emergency fund",
    meaning: "Money held in an instantly accessible form to cover a shock, usually 3–6 months of expenses.",
    whyItMatters:
      "Its job is availability, not return. Chasing yield with it converts an emergency fund into an investment that will be sold at the worst possible moment — which is what an emergency is.",
    topic: "Saving & investing",
    toolPath: "/tools/money-runway",
  },
  {
    term: "Chama / merry-go-round",
    meaning:
      "A rotating savings group: everyone contributes monthly, one member takes the pot each month until all have had a turn.",
    whyItMatters:
      "In pure cash every member ends identically — the pot is the same and everyone pays every month. What differs is TIMING: going first is an interest-free loan from the group, going last is an interest-free loan to it. That gap is what the group is really allocating when it picks the order.",
    topic: "Saving & investing",
    toolPath: "/tools/chama",
  },

  /* ──────────────────────────────────────────── Health & retirement */
  {
    term: "SHA (Social Health Authority)",
    meaning:
      "Kenya's statutory health financier since October 2024, replacing NHIF. Salaried members contribute 2.75% of gross pay, with a monthly floor.",
    whyItMatters:
      "It is a floor, not a plan. Cover is built around accredited public facilities, so a household expecting private hospitals needs a separate top-up. Assuming SHA covers your existing care is the mistake, not the contribution rate.",
    topic: "Health & retirement",
    toolPath: "/tools/sha-health",
  },
  {
    term: "Private medical top-up",
    meaning: "Insurance bought alongside SHA to reach private facilities and services SHA excludes.",
    whyItMatters:
      "Premiums are banded by age and climb steeply, and Kenyan insurers commonly decline NEW members past their mid-sixties — admitting older people only on continuous membership. The decision therefore expires before retirement does.",
    topic: "Health & retirement",
    toolPath: "/tools/fire-number",
  },
  {
    term: "Safe withdrawal rate",
    meaning:
      "The share of a retirement pot you can spend each year without exhausting it — the origin of the familiar 4% and 25× rules.",
    whyItMatters:
      "Those rules come from American market history and size a pot meant to last forever. Applied unchanged to Kenya they mislead in both directions at once: they ignore that spending falls in real terms here too, and that medical cover climbs steeply while everything else falls.",
    topic: "Health & retirement",
    toolPath: "/tools/fire-number",
  },
  {
    term: "FIRE",
    meaning:
      "Financial Independence, Retire Early — holding enough capital that investment income covers your living costs.",
    whyItMatters:
      "The number is not one multiple of today's spending, because retirement spending is not one flat line. Ordinary costs drift down in real terms while medical care climbs; the honest answer prices those two streams separately.",
    topic: "Health & retirement",
    toolPath: "/tools/fire-number",
  },
  {
    term: "Housing levy",
    meaning: "A statutory deduction of 1.5% of gross pay, matched by the employer, under the Affordable Housing Act.",
    whyItMatters:
      "It is deducted before you see your pay and reduces the net figure every other calculation should be built on — including how much loan you can genuinely service.",
    topic: "Pay & tax",
    toolPath: "/tools/take-home-pay",
  },
];

export const GLOSSARY_TOPICS = [
  "Pay & tax",
  "Borrowing",
  "Saving & investing",
  "Health & retirement",
] as const;

export function glossaryByTopic(topic: string): GlossaryEntry[] {
  return GLOSSARY.filter((g) => g.topic === topic);
}
