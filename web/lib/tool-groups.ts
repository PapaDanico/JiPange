import type { ToolGroup } from "@/components/tools/ToolsIndexList";

/**
 * Single source of truth for the /tools hub's grouping — also powers the
 * header "Calculators" dropdown, so the two never drift.
 */
export const CALCULATOR_GROUPS: ToolGroup[] = [
  {
    label: "Plan for today",
    calculators: [
      {
        href: "/tools/salary",
        icon: "💰",
        title: "Salary & Pay Hub",
        description: "Take-home pay, 50/25/25 budget split, payday routing, KRA tax shield, and salary negotiation — all from one gross salary.",
        insight: "≈37% of a Ksh 100,000 gross goes to deductions before you see a shilling. Model every angle here.",
      },
      {
        href: "/tools/where-to-save",
        icon: "🏦",
        title: "Where to put your savings",
        description: "What Treasury bills and money market funds pay after withholding tax, ranked — with SACCO dividends explained separately rather than ranked beside them.",
        insight: "A SACCO dividend is not interest and is not guaranteed. It belongs in the conversation, not in the league table.",
      },
      {
        href: "/tools/savings-goal",
        icon: "🎯",
        title: "Savings Goal Calculator",
        description: "Work out how much to save each month to hit a target amount.",
        insight: "Small, consistent amounts beat big, irregular ones.",
      },
      {
        href: "/tools/hustle-smoother",
        icon: "🔄",
        title: "Hustle Income Smoother",
        description: "Turn months of variable freelance or informal income into a steady, reliable monthly salary.",
        insight: "Enter your last 3–12 months' earnings, get the safe draw and buffer fund needed to ride out lean months.",
      },
      {
        href: "/tools/20th-challenge",
        icon: "🔥",
        title: "20th-to-20th Savings Challenge",
        description: "Commit to saving a fixed amount every month and build an unbroken streak with monthly check-ins.",
        insight: "6 months is the habit-formation threshold. Check in between the 15th and 25th — the app keeps score.",
      },
      {
        href: "/tools/loan-repayment",
        icon: "🧮",
        title: "Loan / HELB Repayment Calculator",
        description: "See your monthly instalment and total interest on any loan.",
        insight: "Borrowing costs depend on actual fees, repayment schedules and eligibility.",
      },
    ],
  },
  {
    label: "Plan for the future",
    calculators: [
      {
        href: "/tools/investment-returns",
        icon: "📈",
        title: "Investment Returns Calculator",
        description: "Project how a lump sum plus monthly contributions grows over time.",
        insight: "Compounding grows your money fastest in the later years — start now.",
      },
      {
        href: "/tools/fire-number",
        icon: "🏝️",
        title: "FIRE Number Calculator",
        description: "Your Kenya-localized retirement number: 20× expenses, inflation-adjusted to your retirement year.",
        insight: "A 5% withdrawal assumption is a scenario, not a guaranteed sustainable retirement rate.",
      },
      {
        href: "/tools/dhowcsd",
        icon: "🪜",
        title: "DhowCSD T-Bill Ladder",
        description: "Split capital across 91/182/364-day Treasury Bills for quarterly liquidity.",
        insight: "Compare actual auction yields, taxes and maturity dates before investing.",
      },
      {
        href: "/tools/household-resilience",
        icon: "🛡️",
        title: "Household Financial Resilience",
        description: "Stress-test twelve months of savings, income shocks, debt service and school fees.",
        insight: "Identify the first projected cash shortfall under your assumptions.",
      },
      {
        href: "/tools/money-runway",
        icon: "⏳",
        title: "Money Runway Calculator",
        description: "See how long your savings will last at a given monthly withdrawal.",
        insight: "A modest return can make your savings last years longer.",
      },
      {
        href: "/planners/education",
        icon: "🏫",
        title: "School Fees Sinking Fund Smoother",
        description: "Turn three termly fee shocks into one flat monthly deposit that earns its own subsidy.",
        insight: "Investment returns vary; compare termly due dates with accessible cash.",
      },
      {
        href: "/tools/school-fees-lifetime",
        icon: "🏫",
        title: "The Full Cost of Private School",
        description: "Every year of fees from your child's current grade to Grade 12, increases compounded, across all your children.",
        insight: "Multiplying this year's fee by the years left understates a 14-year private education by roughly half.",
      },
    ],
  },
  {
    label: "Debt & protection",
    calculators: [
      {
        href: "/tools/debt-escape",
        icon: "💸",
        title: "Debt Stack Buster",
        description: "Enter your Fuliza, Tala, and mobile loans. The avalanche plan shows you the fastest, cheapest way to clear every shilling.",
        insight: "Compare outstanding balances, fees and repayment terms before prioritising debts.",
      },
      {
        href: "/tools/sha-health",
        icon: "🏥",
        title: "SHA Health Coverage Gap",
        description: "See your exact SHIF contribution and the top-up cost needed to access private hospitals, dental, and optical.",
        insight: "Check current SHA benefits and facility accreditation before relying on coverage.",
      },
      {
        href: "/tools/land-purchase",
        icon: "🏡",
        title: "Land Purchase True Cost",
        description: "The quoted plot price is only the start. See stamp duty, legal fees, valuation, title transfer, and survey costs before you sign.",
        insight: "Transaction fees add 8–12% on top of the quoted price — budget this before negotiating.",
      },
    ],
  },
  {
    label: "Pesa realities",
    calculators: [
      {
        href: "/tools/sacco-vs-bank",
        icon: "⚖️",
        title: "SACCO vs Bank Loan Comparison",
        description: "Compare SACCO, bank, and mobile lender costs for the same loan.",
        insight: "Illustrative SACCO and bank rates are not lender quotations.",
      },
      {
        href: "/tools/inflation-reality",
        icon: "📉",
        title: "Inflation Reality Calculator",
        description: "See what your salary will really be worth in the future.",
        insight: "Kenya CPI has averaged 6.5% per year — your salary needs to keep pace.",
      },
      {
        href: "/tools/kplc-optimizer",
        icon: "⚡",
        title: "KPLC Token Band Checker",
        description: "Work out your true cost per unit and see which tariff band your month lands in.",
        insight: "Verify the applicable KPLC tariff and billing rules for your account.",
      },
      {
        href: "/tools/fuliza-cost",
        icon: "📱",
        title: "True Cost of Fuliza Calculator",
        description: "Find out what Fuliza really costs before you borrow.",
        insight: "Fees vary with balance and duration; there is no universal APR.",
      },
      {
        href: "/tools/guarantor-shield",
        icon: "🤝",
        title: "Sacco Guarantor Liability Shield",
        description: "See how much of your 3× borrowing power is frozen by loans you've guaranteed.",
        insight: "Guarantee half your deposits away and your development loan gets slashed — check before you apply.",
      },
      {
        href: "/tools/one-third-rule",
        icon: "⚠️",
        title: "1/3 Rule Checker",
        description: "Check if your SACCO and loan deductions are legally compliant.",
        insight: "Many Kenyans unknowingly have illegal deductions taken from their pay.",
      },
      {
        href: "/tools/chama",
        icon: "🤝",
        title: "Chama / Group Savings Optimizer",
        description: "Simulate merry-go-round payouts, welfare fund size, or group investment returns over 1–5 years.",
        insight: "11.4 million Kenyans save through chamas — model yours before the next meeting.",
      },
    ],
  },
];
