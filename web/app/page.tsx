import Image from "next/image";
import Link from "next/link";
import ResumeToast from "@/components/onboarding/ResumeToast";
import ReturningUserRedirect from "@/components/onboarding/ReturningUserRedirect";
import LandingInteractivity from "@/components/landing/LandingInteractivity";
import { fulizaDailyFee } from "@/lib/fuliza";
import { TOOL_META } from "@/lib/tool-meta";
import {
  ASSUMED_CURRENT_YIELD,
  CURRENT_INFLATION,
  TARGET_MMF_YIELD,
} from "@/lib/journey";
import {
  FINACCESS_LITERACY_FAIL_PCT,
  FINACCESS_FORMAL_INCLUSION_PCT,
  FINACCESS_LITERACY_PASS_PCT,
  RBA_NO_PENSION_PCT,
  RBA_COVERAGE_OF_WORKING_AGE_PCT,
  RBA_INCOME_MEETS_NEEDS_PCT,
  RBA_INCOME_FALLS_SHORT_PCT,
  INFORMAL_WORKERS_MILLIONS,
  FULIZA_USERS_MILLIONS,
  FULIZA_VOLUME_TRILLION_KSH,
  FULIZA_PER_USER_KSH,
  BANK_DEPOSITS_TRILLION_KSH,
  MMF_AUM_BILLION_KSH,
  MMF_SHARE_OF_DEPOSITS_PCT,
  BANK_SAVINGS_EARNING_BELOW_INFLATION_TRILLION,
} from "@/lib/kenya-stats";

/* Counts and headline figures, derived rather than typed.
 *
 * This page said "All 18 calculators", lib/tiers.ts said 26, and there were
 * 25 — three numbers for one fact. And the Fuliza headline read "Ksh 6.50/day
 * ... 400%" while lib/fuliza.ts computes Ksh 6.00 for a Ksh 600 balance
 * (Ksh 5.00 band fee plus 20% excise), which annualises to 365%. The tool was
 * corrected and the shop window was not.
 *
 * Both now read from the source of truth, so a tariff change or a new
 * calculator moves the homepage with it. */
const TOOL_COUNT = Object.keys(TOOL_META).filter((h) => h.startsWith("/tools/")).length;

const FULIZA_EXAMPLE_BALANCE = 600;
const FULIZA_EXAMPLE_DAILY = fulizaDailyFee(FULIZA_EXAMPLE_BALANCE);
const FULIZA_EXAMPLE_APR = Math.round((FULIZA_EXAMPLE_DAILY * 365) / FULIZA_EXAMPLE_BALANCE * 100);

/**
 * Ksh with thousands separators, for figures quoted inside prose.
 *
 * Every number in the cards below is now interpolated rather than typed. The
 * previous version stated "Ksh 370 billion (7%)" and "Average ticket: Ksh 254"
 * as literal text beside constants that this file did not import, so the
 * constants and the copy could — and did — disagree for a year.
 */
const ksh = (n: number) => `Ksh ${n.toLocaleString("en-KE")}`;

const pct = (rate: number) => `${parseFloat((rate * 100).toFixed(2))}%`;

const TRUST_CHIPS = [
  "🕶️ 100% anonymous",
  "👆🏿 No salary questions",
  "🆓 Free — no signup",
  "🇰🇪 Built for Kenya",
];

const REALITY_STATS: {
  figure: string;
  dataCount: string | number;
  dataSuffix: string;
  decimals?: string;
  color: string;
  label: string;
  detail: string;
  source: string;
  cta: string;
  href: string;
}[] = [
  {
    figure: pct(ASSUMED_CURRENT_YIELD),
    dataCount: (ASSUMED_CURRENT_YIELD * 100).toFixed(2),
    dataSuffix: "%",
    decimals: "2",
    color: "text-[#F4A09A]",
    label: "Average bank savings rate",
    detail: `Inflation runs at ${pct(CURRENT_INFLATION)}. Money "safe" in a bank account loses real purchasing power every single day — silently, automatically.`,
    source: "CBK Banking Sector Report, 2026",
    cta: "Run the inflation maths →",
    href: "/tools/inflation-reality",
  },
  {
    figure: pct(TARGET_MMF_YIELD),
    dataCount: (TARGET_MMF_YIELD * 100).toFixed(1),
    dataSuffix: "%",
    color: "text-[#86CBA5]",
    label: "Kenya MMF baseline return",
    detail: `Same shillings, right vehicle. Yet Ksh ${BANK_DEPOSITS_TRILLION_KSH} trillion sits in bank accounts — only Ksh ${MMF_AUM_BILLION_KSH} billion (${MMF_SHARE_OF_DEPOSITS_PCT}%) is in money market funds.`,
    source:
      "CMA Collective Investment Schemes Quarterly Report, Q1 2026 · CBK banking sector data",
    cta: "See the compounding →",
    href: "/tools/investment-returns",
  },
  {
    figure: `${FULIZA_USERS_MILLIONS}M`,
    dataCount: FULIZA_USERS_MILLIONS,
    dataSuffix: "M",
    color: "text-[#F0C060]",
    label: "Kenyans who used Fuliza in a year",
    detail: `Ksh ${FULIZA_VOLUME_TRILLION_KSH} trillion borrowed — mostly for food, rent and school fees. That is ${ksh(FULIZA_PER_USER_KSH)} per borrower across the year. This is a planning gap, not a cash-flow accident.`,
    source: "Safaricom PLC FY2026 Annual Results",
    cta: "Calculate Fuliza's true cost →",
    href: "/tools/fuliza-cost",
  },
];

const RESEARCH_CARDS = [
  {
    figure: `${RBA_NO_PENSION_PCT}%`,
    dataCount: RBA_NO_PENSION_PCT,
    dataSuffix: "%",
    tone: "danger" as const,
    label: "of Kenya's workforce has no active pension contribution",
    body: `Only ${100 - RBA_NO_PENSION_PCT}% of working Kenyans actively contribute to a pension scheme. And of those who do reach retirement, just ${RBA_INCOME_MEETS_NEEDS_PCT}% say their retirement income covers their daily needs — ${RBA_INCOME_FALLS_SHORT_PCT}% say it does not, after saving for 30–40 years.`,
    cite: "Retirement Benefits Authority — Pensioners Survey 2024 (427 recent retirees)",
  },
  {
    figure: `${RBA_COVERAGE_OF_WORKING_AGE_PCT}%`,
    dataCount: RBA_COVERAGE_OF_WORKING_AGE_PCT,
    dataSuffix: "%",
    tone: "danger" as const,
    label: "of working-age Kenyans are enrolled in any retirement scheme at all",
    body: `And enrolled is not the same as paying in — that figure counts dormant members too, which is why ${RBA_NO_PENSION_PCT}% make no active contribution. Side hustles, chamas, small businesses: ${INFORMAL_WORKERS_MILLIONS} million Kenyans in the informal sector are building their livelihoods with almost no formal retirement safety net.`,
    cite: "Retirement Benefits Authority — industry brief, half-year to June 2025 · KNBS Economic Survey",
  },
  {
    figure: `${FINACCESS_FORMAL_INCLUSION_PCT}%`,
    dataCount: FINACCESS_FORMAL_INCLUSION_PCT,
    dataSuffix: "%",
    tone: "success" as const,
    label: "of Kenyans have access to formal financial services",
    body: "Financial inclusion has never been higher — M-Pesa has driven gender parity to within 1.6 percentage points. Access is not the problem. What Kenyans do with that access is where the gap persists.",
    cite: "FinAccess Household Survey 2024 — CBK / FSD Kenya / KNBS",
  },
  {
    figure: `${FINACCESS_LITERACY_PASS_PCT}%`,
    dataCount: FINACCESS_LITERACY_PASS_PCT,
    dataSuffix: "%",
    tone: "success" as const,
    label: "of Kenyans passed all 3 financial literacy questions",
    body: `Questions covered inflation, interest rates, and risk diversification. ${FINACCESS_LITERACY_FAIL_PCT}% could not pass — meaning the majority are making daily financial decisions without the tools to understand the consequences. JiPange is the missing tool.`,
    cite: "FinAccess Household Survey 2024 — CBK / FSD Kenya / KNBS",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Tap 5 answers",
    body: "Anonymous, zero typing. Your life stage, income zone, and one financial priority — that's all we need to build something specific to you. 90 seconds, on any phone.",
  },
  {
    num: "2",
    title: "See your Pesa Picture",
    body: "Your survival runway, where inflation is eroding your money, your real PAYE breakdown, and the exact cost of every silent leak — in one honest, Kenya-specific screen.",
  },
  {
    num: "3",
    title: "Get your action plan",
    body: "The exact vehicle — MMF, Sacco, DhowCSD T-Bill — the monthly milestone, and the M-Pesa paybill to start today. Not next month. Today.",
  },
];

const TOOLS = [
  { href: "/tools/take-home-pay", emoji: "💰", name: "Take-Home Pay", hook: "Exact net: PAYE, NSSF, SHIF & Housing Levy" },
  { href: "/tools/investment-returns", emoji: "📈", name: "Investment Returns", hook: "MMF vs bank vs T-Bill — see the compounding gap" },
  { href: "/tools/money-runway", emoji: "⏳", name: "Money Runway", hook: "How long your savings survive a job loss" },
  { href: "/tools/guarantor-shield", emoji: "🛡️", name: "Sacco Guarantor Shield", hook: "Your real unencumbered borrowing power" },
  { href: "/tools/kplc-optimizer", emoji: "⚡", name: "KPLC Token Checker", hook: "Your real cost per unit, from your own receipt" },
  { href: "/tools/fuliza-cost", emoji: "📱", name: "True Cost of Fuliza", hook: `What Ksh ${FULIZA_EXAMPLE_DAILY.toFixed(2)}/day really costs you annually` },
];

const PLANNERS = [
  { href: "/planners/education", emoji: "🎓", label: "School fees smoother" },
  { href: "/planners/home", emoji: "🏠", label: "Plot & Mjengo" },
  { href: "/planners/emergency", emoji: "🛡️", label: "Emergency fund" },
  { href: "/planners/retirement", emoji: "🌅", label: "Retirement milestone" },
  { href: "/planners/hustle", emoji: "🌾", label: "Cycle venture" },
  { href: "/planners/business", emoji: "🚀", label: "Business capital" },
];

const QUICK_STARTS = [
  {
    href: "/tools/take-home-pay",
    eyebrow: "Keep more salary",
    title: "Understand my payslip",
    detail: "See PAYE, NSSF, SHIF and your exact take-home pay.",
    icon: "💰",
  },
  {
    href: "/tools/debt-escape",
    eyebrow: "Clear expensive debt",
    title: "Build my debt escape",
    detail: "Turn balances and repayments into a clear payoff order.",
    icon: "🧭",
  },
  {
    href: "/tools/savings-goal",
    eyebrow: "Make progress",
    title: "Plan a savings goal",
    detail: "Find the monthly amount that gets you there on time.",
    icon: "🎯",
  },
];

export default function Home() {
  return (
    <>
      <ResumeToast />
      <ReturningUserRedirect />
      <LandingInteractivity />

      {/* ── Hero ── */}
      <section className="bg-white border-b border-border py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">

            {/* Left column */}
            <div>
              <p className="mb-5 inline-block rounded-full border border-[#F0D08A] bg-[#FFF8E8] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-accent">
                Free · Anonymous · Built for Kenya 🇰🇪
              </p>
              <p className="mb-2 text-base italic font-medium text-muted">
                Jipange kabla pesa ikupange.
              </p>
              <h1
                className="mb-5 text-[2.25rem] font-black leading-tight tracking-tight text-primary sm:text-5xl"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Your money is working hard.{" "}
                <span className="block">
                  Just not{" "}
                  <em className="not-italic text-accent">for you.</em>
                </span>
              </h1>
              <p className="mb-8 max-w-prose text-base leading-relaxed text-ink-soft">
                Inflation quietly erodes your savings. Fuliza bridges the gap for{" "}
                {FULIZA_USERS_MILLIONS} million Kenyans borrowing for food and rent. And{" "}
                {RBA_NO_PENSION_PCT}% of Kenya&apos;s workforce has no pension plan. JiPange
                changes that — one honest calculation at a time.
              </p>
              <div className="mb-6 flex flex-wrap gap-3">
                <Link
                  href="/profile"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-base font-bold text-[#1A0D06] shadow-[0_2px_14px_rgba(232,160,32,0.30)] transition-colors hover:bg-accent-deep"
                >
                  Start my plan — 90 seconds ›
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex h-12 items-center justify-center rounded-full border-[1.5px] border-border bg-canvas px-6 text-base font-semibold text-primary transition-colors hover:border-primary hover:bg-[#E6D9CA]"
                >
                  Explore calculators
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRUST_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-border bg-canvas px-3 py-1.5 text-[0.8125rem] font-medium text-muted"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Right column — logo + teaser */}
            <div className="flex flex-col items-center gap-6 lg:items-start">
              <Image
                src="/logo-icon.webp"
                alt="JiPange shield"
                width={973}
                height={833}
                priority
                sizes="(max-width: 640px) 176px, 224px"
                className="w-44 sm:w-56 h-auto"
              />
              <div
                data-reveal
                className="w-full max-w-xs rounded-2xl border border-border bg-canvas px-6 py-5 text-center"
              >
                <p
                  className="text-4xl font-black tracking-tighter text-danger-deep"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                  data-count={FINACCESS_LITERACY_FAIL_PCT}
                  data-suffix="%"
                  data-decimals="1"
                >
                  {FINACCESS_LITERACY_FAIL_PCT}%
                </p>
                <p className="mt-1.5 text-[0.8125rem] text-muted">
                  of Kenyans cannot pass a basic financial literacy test
                  <br />
                  <span className="mt-1 block text-[0.7rem] text-muted">
                    FinAccess Household Survey, 2024
                  </span>
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Goal-based quick start ── */}
      <section className="border-b border-border bg-background py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent">Start with one win</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-primary sm:text-2xl">
                What do you want your money to do better?
              </h2>
            </div>
            <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent">
              Browse every calculator →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {QUICK_STARTS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-h-36 flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
              >
                <span aria-hidden="true" className="text-2xl">{item.icon}</span>
                <span className="mt-4 text-[0.6875rem] font-bold uppercase tracking-widest text-accent">{item.eyebrow}</span>
                <span className="mt-1 font-bold text-primary">{item.title}</span>
                <span className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</span>
                <span className="mt-auto pt-3 text-sm font-semibold text-primary group-hover:text-accent">Start here →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reality band ── */}
      <section className="bg-[#3A2E26] py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div data-reveal className="mb-10 text-center">
            <p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[rgba(241,236,227,0.45)]">
              The Kenya money gap — in three numbers
            </p>
            <h2 className="text-xl font-extrabold tracking-tight text-[rgba(241,236,227,0.9)] sm:text-2xl" style={{ textWrap: "balance" } as React.CSSProperties}>
              What the data actually says about how Kenyans manage money
            </h2>
          </div>

          <div
            data-reveal
            className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] grid grid-cols-1 sm:grid-cols-3 gap-px"
          >
            {REALITY_STATS.map((stat) => (
              <Link key={stat.label} href={stat.href} className="group bg-[#3A2E26] p-6 sm:p-8 flex flex-col gap-1.5 hover:bg-[#4A3A2E] transition-colors">
                <p
                  className={`text-5xl sm:text-6xl font-black leading-none tracking-tighter ${stat.color}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                  data-count={stat.dataCount}
                  data-suffix={stat.dataSuffix}
                  data-decimals={stat.decimals}
                >
                  {stat.figure}
                </p>
                <p className="text-[0.9375rem] font-bold leading-snug text-[rgba(241,236,227,0.9)]">
                  {stat.label}
                </p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-[rgba(241,236,227,0.5)]">
                  {stat.detail}
                </p>
                <p className="mt-auto border-t border-[rgba(255,255,255,0.07)] pt-3 text-[0.6875rem] text-[rgba(241,236,227,0.3)]">
                  {stat.source}
                </p>
                <span className="text-[0.8125rem] font-semibold text-accent group-hover:opacity-80">
                  {stat.cta}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <details className="group/evidence bg-canvas">
        <summary className="cursor-pointer list-none border-b border-border px-4 py-5 marker:content-none sm:px-6">
          <span className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <span>
              <span className="block text-xs font-bold uppercase tracking-widest text-accent">Want the evidence?</span>
              <span className="mt-1 block text-sm font-semibold text-primary sm:text-base">
                Explore the research behind JiPange’s Kenya-first approach
              </span>
            </span>
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D4CEC5] bg-white text-xl text-primary transition-transform group-open/evidence:rotate-45">+</span>
          </span>
        </summary>

      {/* ── Research findings ── */}
      <section className="bg-canvas py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div data-reveal className="mb-6">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-accent">
              Research findings
            </p>
            <h2
              className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              The problem is structural, not personal
            </h2>
            <p className="mt-2 max-w-prose text-[0.9375rem] text-ink-soft">
              These are not individual failures. They are system-wide gaps that JiPange is designed
              to help you navigate.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {RESEARCH_CARDS.map((card, i) => (
              <div
                key={card.label}
                data-reveal
                data-delay={i % 2 === 1 ? "1" : undefined}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <p
                  className={`text-4xl font-black leading-none tracking-tighter ${
                    card.tone === "danger" ? "text-danger-deep" : "text-success-deep"
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                  data-count={card.dataCount}
                  data-suffix={card.dataSuffix}
                >
                  {card.figure}
                </p>
                <p className="mt-2 text-[0.9375rem] font-bold text-primary">{card.label}</p>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">{card.body}</p>
                <p className="mt-3 border-t border-border pt-3 text-[0.6875rem] italic text-muted">
                  {card.cite}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Narrative ── */}
      <section className="border-y border-border bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[5fr_4fr] lg:items-start lg:gap-16">

            {/* Left — pull quote + body */}
            <div>
              <p
                data-reveal
                className="mb-5 text-2xl font-extrabold leading-tight tracking-tight text-primary sm:text-3xl"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                &ldquo;Most Kenyans aren&apos;t broke —<br />
                they&apos;re <em className="not-italic text-accent">misallocated.</em>
                <br />
                The money is there. The plan is missing.&rdquo;
              </p>
              <p data-reveal data-delay="1" className="mb-4 text-[0.9375rem] leading-loose text-ink-soft">
                You earn a salary. PAYE, NSSF, SHIF and Housing Levy leave before you touch it.
                Rent on the first. School fees in January, April, September. Fuliza at the end of
                the month when the calculation doesn&apos;t balance. A Sacco loan you&apos;re
                guaranteeing for three colleagues. Your financial life is genuinely complex — and it
                was never designed with a Kenya-specific plan in mind.
              </p>
              <p data-reveal data-delay="2" className="mb-5 text-[0.9375rem] leading-loose text-ink-soft">
                JiPange is the only calculator suite built specifically for this reality. Every
                number is grounded in Kenya&apos;s actual tax bands, real MMF yields, the NSSF Act
                2013 phased rollout, SHIF contributions, and Sacco mechanics — not a US retirement
                spreadsheet with a Ksh sign dropped in.
              </p>
              <p data-reveal data-delay="2" className="text-[0.9375rem] leading-loose text-ink-soft">
                <strong className="text-primary">No black box. No selling. No accounts.</strong>
                <br />
                JiPange shows you the maths, names the vehicle, and hands you the M-Pesa paybill.
                The rest is yours.
              </p>
            </div>

            {/* Right — Fuliza + MMF cards */}
            <div className="flex flex-col gap-4">
              <div
                data-reveal
                className="rounded-2xl border border-[#F5C8C4] bg-danger-soft p-6"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-danger-deep">
                  ⚠️ Fuliza reality check
                </p>
                <p
                  className="text-4xl font-black leading-none tracking-tighter text-danger-deep"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  ≈{FULIZA_EXAMPLE_APR}%
                </p>
                <p className="mt-1.5 mb-3 text-[0.875rem] font-semibold text-ink-soft">
                  Real annualised cost of Fuliza
                </p>
                <p className="text-[0.8125rem] leading-relaxed text-muted">
                  Ksh {FULIZA_EXAMPLE_DAILY.toFixed(2)}/day on Ksh {FULIZA_EXAMPLE_BALANCE} feels like loose change. Annualised, it&apos;s the most
                  expensive credit product most Kenyans ever use — more than bank overdrafts, more
                  than credit cards. Kenyans borrowed Ksh {FULIZA_VOLUME_TRILLION_KSH} trillion
                  through Fuliza in the year to March 2026.
                </p>
                <p className="mt-3 text-[0.6875rem] italic text-danger-deep">
                  Safaricom PLC FY2026 Annual Results
                </p>
              </div>

              <div
                data-reveal
                data-delay="1"
                className="rounded-2xl border border-[#C5E8CC] bg-success-soft p-6"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-success-deep">
                  💡 The opportunity
                </p>
                <p
                  className="text-4xl font-black leading-none tracking-tighter text-success-deep"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  Ksh {BANK_SAVINGS_EARNING_BELOW_INFLATION_TRILLION}T
                </p>
                <p className="mt-1.5 mb-3 text-[0.875rem] font-semibold text-ink-soft">
                  in bank accounts earning below inflation
                </p>
                <p className="text-[0.8125rem] leading-relaxed text-muted">
                  Of Ksh {BANK_DEPOSITS_TRILLION_KSH} trillion in Kenyan bank savings, only Ksh{" "}
                  {MMF_AUM_BILLION_KSH} billion is in money market funds — earning 9–12% vs. bank
                  rates of {pct(ASSUMED_CURRENT_YIELD)}. The difference at Ksh 100,000 over 5 years
                  is over Ksh 50,000 earned or lost.
                </p>
                <p className="mt-3 text-[0.6875rem] italic text-success-deep">
                  CMA Collective Investment Schemes Quarterly Report, Q1 2026 · CBK
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      </details>

      {/* ── How it works ── */}
      <section className="bg-canvas py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-8">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-accent">
              The process
            </p>
            <h2
              className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              From &ldquo;pesa inaisha&rdquo; to a plan — in three steps
            </h2>
            <p className="mt-2 max-w-prose text-[0.9375rem] text-ink-soft">
              No spreadsheets. No financial jargon. No signup. Just the honest picture and the next
              move.
            </p>
          </div>

          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3 list-none">
            {STEPS.map((step, i) => (
              <li
                key={step.num}
                data-reveal
                data-delay={i > 0 ? String(i) : undefined}
                className="rounded-2xl border border-border bg-white p-7"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-black text-[#1A0D06]" aria-hidden="true">
                  {step.num}
                </div>
                <h3 className="mb-1.5 text-base font-extrabold text-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Popular tools ── */}
      <section className="border-t border-border bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-accent">
                Self-serve calculators
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-primary">
                Start with a quick win
              </h2>
            </div>
            <Link
              href="/tools"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent"
            >
              All {TOOL_COUNT} calculators →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {TOOLS.map((tool, i) => (
              <Link
                key={tool.href}
                href={tool.href}
                data-reveal
                data-delay={i % 2 === 1 ? "1" : undefined}
                className="group flex items-center gap-3.5 rounded-xl border border-border bg-canvas p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_3px_12px_rgba(232,160,32,0.12)]"
              >
                <div className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-lg">
                  {tool.emoji}
                </div>
                <div className="min-w-0">
                  <p className="text-[0.9rem] font-bold text-primary">{tool.name}</p>
                  <p className="text-[0.8rem] text-muted">{tool.hook}</p>
                </div>
                <span className="ml-auto shrink-0 text-border transition-colors group-hover:text-accent">
                  ›
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Goal planners ── */}
      <section className="border-t border-border bg-canvas py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-accent">
                Goal planners
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                Working toward something specific?
              </h2>
            </div>
            <Link
              href="/planners"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent"
            >
              All 6 planners →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
            <div data-reveal className="space-y-3 text-[0.9375rem] leading-loose text-ink-soft">
              <p>
                Six planners that reverse-engineer exactly what you need to do{" "}
                <strong className="text-primary">this month</strong> to hit your goal — whether
                it&apos;s school fees next term, a plot, or a retirement that doesn&apos;t
                disappoint.
              </p>
              <p>
                Each planner accounts for Kenya inflation, Sacco mechanics, and the actual savings
                vehicles available to you — not a generic compound-interest graph built for a
                different country.
              </p>
            </div>

            <div data-reveal data-delay="1" className="flex flex-wrap gap-2.5">
              {PLANNERS.map((planner) => (
                <Link
                  key={planner.href}
                  href={planner.href}
                  className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
                >
                  <span>{planner.emoji}</span>
                  {planner.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="bg-primary py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <div data-reveal>
            <h2
              className="mb-3 text-3xl font-black leading-tight tracking-tight text-canvas sm:text-4xl"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              Your honest Pesa Picture.{" "}
              <span className="text-accent">90 seconds away.</span>
            </h2>
            <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-[rgba(241,236,227,0.7)]">
              No black box. No selling. No accounts. Just the maths, the vehicle, and the paybill to
              start. The rest is yours.
            </p>
            <Link
              href="/profile"
              className="inline-flex h-14 items-center justify-center rounded-full bg-accent px-10 text-base font-extrabold text-[#1A0D06] shadow-[0_4px_18px_rgba(232,160,32,0.35)] transition-all hover:bg-accent-deep hover:-translate-y-0.5"
            >
              Start my plan — it&apos;s free ›
            </Link>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {["🕶️ Anonymous", "🆓 No signup", "🇰🇪 PAYE · SHIF · NSSF accurate", "⚡ Works on any phone"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.07)] px-3 py-1.5 text-[0.8125rem] text-[rgba(241,236,227,0.55)]"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sources footnote ── */}
      <div className="bg-primary border-t border-[rgba(255,255,255,0.1)] px-4 py-4 text-center">
        <p className="text-[0.6875rem] text-[rgba(241,236,227,0.28)]">
          Sources: FinAccess Household Survey 2024 (CBK/FSD Kenya/KNBS) · RBA Pensioners Survey
          2024 · CMA Collective Investment Schemes, July 2026 · Safaricom FY2026 Annual Report ·
          Pension Policy International/KIPPRA 2024. Rates current July 2026.
        </p>
      </div>
    </>
  );
}
