import Image from "next/image";
import Link from "next/link";
import ResumeToast from "@/components/onboarding/ResumeToast";
import ReturningUserRedirect from "@/components/onboarding/ReturningUserRedirect";
import LandingInteractivity from "@/components/landing/LandingInteractivity";
import KenyaMoneyNow from "@/components/landing/KenyaMoneyNow";
import { liveFigures } from "@/lib/landing-pulse";
import { fulizaDailyFee } from "@/lib/fuliza";
import { TOOL_META } from "@/lib/tool-meta";
import { CURRENT_INFLATION, TARGET_MMF_YIELD } from "@/lib/journey";
import { inflationAttribution } from "@/lib/rates-feed";
import {
  SAVINGS_GAP_PRINCIPAL_KES,
  SAVINGS_GAP_YEARS,
  mmfVsBankDepositGapKES,
} from "@/lib/tool-stats";
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
  CBK_AVG_DEPOSIT_RATE_NET_PCT,
  CBK_AVG_DEPOSIT_RATE_PCT,
  CBK_AVG_DIGITAL_LOAN_KSH,
  CBK_BSAR_2025_CITE,
  CBK_DIGITAL_CREDIT_BILLION_KSH,
  CBK_DIGITAL_CREDIT_LOANS_MILLIONS,
  CBK_DIGITAL_LENDERS_LICENSED,
  CBK_MOBILE_MONEY_SUBSCRIPTIONS_MILLIONS,
} from "@/lib/kenya-stats";
import { cite } from "@/lib/sources";

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

/* The bank-rate claim, computed rather than asserted.
 *
 * This card showed "3.23% — Average bank savings rate", cited to a "CBK
 * Banking Sector Report, 2026". No such report exists; the 3.23% was an
 * unsourced spec constant (lib/journey.ts ASSUMED_CURRENT_YIELD). CBK's Bank
 * Supervision Annual Report 2025 measures the average deposit rate at 7.13%
 * for December 2025 — 6.06% after the 15% withholding tax. Whether that beats
 * inflation is a comparison the page now MAKES, against the live reading, and
 * the sentence follows the answer instead of assuming it. */
const BANK_NET_BELOW_INFLATION = CBK_AVG_DEPOSIT_RATE_NET_PCT / 100 < CURRENT_INFLATION;

/* The hero's three live readings — the same figures, with the same dates and
 * publishers, that the "Kenya's money, this month" section shows in full. */
const HERO_PULSE = liveFigures().slice(0, 3);

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
    figure: `${CBK_AVG_DEPOSIT_RATE_NET_PCT}%`,
    dataCount: CBK_AVG_DEPOSIT_RATE_NET_PCT.toFixed(2),
    dataSuffix: "%",
    decimals: "2",
    color: "text-[#F4A09A]",
    label: "Average bank deposit rate, after tax",
    detail: BANK_NET_BELOW_INFLATION
      ? `With inflation at ${pct(CURRENT_INFLATION)}, the average deposit falls slightly short of it after tax. For savings you will not need this month, a better-paying home can turn that around.`
      : `With inflation at ${pct(CURRENT_INFLATION)}, the average deposit stays just ahead after tax — and many ordinary savings accounts pay less than the average, so it pays to compare.`,
    source: `${CBK_BSAR_2025_CITE} (Dec 2025, ${CBK_AVG_DEPOSIT_RATE_PCT}% before tax) · ${inflationAttribution()}`,
    cta: "Run the inflation maths →",
    href: "/tools/inflation-reality",
  },
  {
    figure: pct(TARGET_MMF_YIELD),
    dataCount: (TARGET_MMF_YIELD * 100).toFixed(1),
    dataSuffix: "%",
    color: "text-[#86CBA5]",
    label: "Money market fund return we assume, before tax",
    detail: `The same shillings, in a better-paying home. Of Ksh ${BANK_DEPOSITS_TRILLION_KSH} trillion in bank deposits, Ksh ${MMF_AUM_BILLION_KSH} billion (${MMF_SHARE_OF_DEPOSITS_PCT}%) has so far found its way into money market funds — plenty of room to grow.`,
    source: `${cite("mmfAumBillionKsh")} · ${cite("bankDepositsTrillionKsh")} · MMF rate assumed from the latest 91-day bill`,
    cta: "See the compounding →",
    href: "/tools/investment-returns",
  },
  {
    figure: `${FULIZA_USERS_MILLIONS}M`,
    dataCount: FULIZA_USERS_MILLIONS,
    dataSuffix: "M",
    color: "text-[#F0C060]",
    label: "Kenyans who used Fuliza in a year",
    detail: `Ksh ${FULIZA_VOLUME_TRILLION_KSH} trillion borrowed — about ${ksh(FULIZA_PER_USER_KSH)} per borrower across the year. Short-term credit is a useful bridge; knowing its true cost, and building a small buffer, makes the next month lighter.`,
    source: "Safaricom PLC FY2026 Annual Results",
    cta: "See Fuliza's true cost →",
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
    body: `${100 - RBA_NO_PENSION_PCT}% of working Kenyans actively contribute to a pension scheme. Of recent retirees, ${RBA_INCOME_MEETS_NEEDS_PCT}% say their retirement income covers their daily needs and ${RBA_INCOME_FALLS_SHORT_PCT}% say it does not — which is why starting early, even small, matters so much.`,
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
    body: `Financial inclusion has never been higher — M-Pesa has driven gender parity to within 1.6 percentage points, and mobile money subscriptions reached ${CBK_MOBILE_MONEY_SUBSCRIPTIONS_MILLIONS} million by December 2025. Access is not the problem. What Kenyans do with that access is where the gap persists.`,
    cite: `FinAccess Household Survey 2024 — CBK / FSD Kenya / KNBS · ${CBK_BSAR_2025_CITE}, Table 8`,
  },
  {
    figure: `${FINACCESS_LITERACY_PASS_PCT}%`,
    dataCount: FINACCESS_LITERACY_PASS_PCT,
    dataSuffix: "%",
    tone: "success" as const,
    label: "of Kenyans passed all 3 financial literacy questions",
    body: `The questions covered inflation, interest rates and risk diversification. For the ${FINACCESS_LITERACY_FAIL_PCT}% who found them hard, clear explanations and worked examples make a real difference — and that is exactly what JiPange is built to provide.`,
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
      <section className="bg-white border-b border-border py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">

            {/* Left column */}
            <div>
              <p className="mb-5 inline-block rounded-full border border-[#F0D08A] bg-accent-soft px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-ink">
                Free · Anonymous · Built for Kenya 🇰🇪
              </p>
              <p className="mb-2 text-base italic font-medium text-muted">
                Jipange kabla pesa ikupange.
              </p>
              <h1
                className="mb-5 text-[2.25rem] font-black leading-tight tracking-tight text-primary sm:text-5xl"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Every shilling deserves a plan.{" "}
                <span className="block">
                  <em className="not-italic text-accent-ink">Let&apos;s build yours.</em>
                </span>
              </h1>
              <p className="mb-8 max-w-prose text-base leading-relaxed text-ink-soft">
                JiPange brings together the latest figures from the Central Bank, KNBS and
                Kenya&apos;s regulators, and turns them into a clear, personal next step — for your
                salary, your savings and your family&apos;s goals. Every number is dated and
                sourced, so you can plan with confidence.
              </p>
              {/* Stacked buttons match each other's width; side-by-side ones
                  do not. Measured at 390px these wrapped to their own content
                  widths — 266px above 188px — a 78px step between the two
                  choices the page is built around, with a ragged edge down the
                  right. A phone has one column, so a button that stops short of
                  it reads as unfinished rather than as emphasis. Full width
                  below sm:, intrinsic width once they sit in a row.

                  "Once they sit in a row" was the flaw. At lg the hero splits
                  into two columns and the left one narrows to ~450px, while
                  these two at their intrinsic widths need 266 + 188 + 12 =
                  466px. They wrap — back into a stack, and back to 266px above
                  188px, which is the exact ragged shape this comment was
                  written to remove. It was fixed on the phone and reappeared on
                  the desktop, one breakpoint further along.

                  So full width is restored at lg. The rule is not "narrow
                  screens get full width", it is "a button that is alone on its
                  line gets full width", and lg is the other place that is
                  true. */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/profile"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-base font-bold text-accent-contrast shadow-[0_2px_14px_rgba(232,160,32,0.30)] transition-colors hover:bg-accent-deep sm:w-auto lg:w-full"
                >
                  Start my plan — 90 seconds ›
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border-[1.5px] border-border bg-canvas px-6 text-base font-semibold text-primary transition-colors hover:border-primary hover:bg-[#E6D9CA] sm:w-auto lg:w-full"
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
              {/* The market pulse — live, dated readings, where the page used
                  to lead with "57.9% cannot pass a basic literacy test". The
                  statistic is still on the page, in the research section with
                  its context; the first thing a reader sees is now something
                  useful to them. */}
              <div
                data-reveal
                className="w-full max-w-xs rounded-2xl border border-border bg-canvas px-5 py-4"
              >
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-accent-ink">
                  Market pulse
                </p>
                <dl className="mt-2 divide-y divide-border">
                  {HERO_PULSE.map((f) => (
                    <div key={f.id} className="flex items-baseline justify-between gap-3 py-2">
                      <dt className="text-[0.8125rem] leading-snug text-ink-soft">
                        {f.label}
                        <span className="block text-[0.6875rem] text-muted">{f.source}</span>
                      </dt>
                      <dd
                        className="text-xl font-black tracking-tight text-primary"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Information first ── */}
      <KenyaMoneyNow />

      {/* ── Goal-based quick start ── */}
      <section className="border-b border-border bg-background py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent-ink">Start with one win</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-primary sm:text-2xl">
                What do you want your money to do better?
              </h2>
            </div>
            <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent-ink">
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
                <span className="mt-4 text-[0.6875rem] font-bold uppercase tracking-widest text-accent-ink">{item.eyebrow}</span>
                <span className="mt-1 font-bold text-primary">{item.title}</span>
                <span className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</span>
                <span className="mt-auto pt-3 text-sm font-semibold text-primary group-hover:text-accent-ink">Start here →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reality band ── */}
      <section className="bg-shell py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div data-reveal className="mb-10 text-center">
            <p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-canvas/60">
              Where Kenyans stand — in three numbers
            </p>
            <h2 className="text-xl font-extrabold tracking-tight text-canvas/90 sm:text-2xl" style={{ textWrap: "balance" } as React.CSSProperties}>
              The opportunity in front of us, measured
            </h2>
          </div>

          <div
            data-reveal
            className="overflow-hidden rounded-2xl border border-white/8 bg-white/8 grid grid-cols-1 sm:grid-cols-3 gap-px"
          >
            {REALITY_STATS.map((stat) => (
              <Link key={stat.label} href={stat.href} className="group bg-shell p-6 sm:p-8 flex flex-col gap-1.5 hover:bg-shell-hover transition-colors">
                <p
                  className={`text-5xl sm:text-6xl font-black leading-none tracking-tighter ${stat.color}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                  data-count={stat.dataCount}
                  data-suffix={stat.dataSuffix}
                  data-decimals={stat.decimals}
                >
                  {stat.figure}
                </p>
                <p className="text-[0.9375rem] font-bold leading-snug text-canvas/90">
                  {stat.label}
                </p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-canvas/60">
                  {stat.detail}
                </p>
                <p className="mt-auto border-t border-white/7 pt-3 text-[0.6875rem] text-canvas/60">
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

      {/* Open by default. Information is this site's pillar, and the research
          was folded behind a toggle most readers never pressed. It still
          collapses for anyone who wants a shorter page. */}
      <details open className="group/evidence bg-canvas">
        <summary className="cursor-pointer list-none border-b border-border px-4 py-5 marker:content-none sm:px-6">
          <span className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <span>
              <span className="block text-xs font-bold uppercase tracking-widest text-accent-ink">The evidence</span>
              <span className="mt-1 block text-sm font-semibold text-primary sm:text-base">
                The research behind JiPange’s Kenya-first approach
              </span>
            </span>
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D4CEC5] bg-white text-xl text-primary transition-transform group-open/evidence:rotate-45">+</span>
          </span>
        </summary>

      {/* ── Research findings ── */}
      <section className="bg-canvas py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div data-reveal className="mb-6">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-accent-ink">
              Research findings
            </p>
            <h2
              className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              The problem is structural, not personal
            </h2>
            <p className="mt-2 max-w-prose text-[0.9375rem] text-ink-soft">
              These are system-wide gaps, not individual failings — and each one can be navigated
              with the right information at the right moment.
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
      <section className="border-y border-border bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[5fr_4fr] lg:items-start lg:gap-16">

            {/* Left — pull quote + body */}
            <div>
              <p
                data-reveal
                className="mb-5 text-2xl font-extrabold leading-tight tracking-tight text-primary sm:text-3xl"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                &ldquo;Kenyans work hard for every shilling.
                <br />
                With a clear plan, those shillings can{" "}
                <em className="not-italic text-accent-ink">work just as hard in return.</em>&rdquo;
              </p>
              <p data-reveal data-delay="1" className="mb-4 text-[0.9375rem] leading-loose text-ink-soft">
                You earn a salary. PAYE, NSSF, SHIF and Housing Levy leave before you touch it.
                Rent on the first. School fees in January, April, September. Fuliza at the end of
                the month when the calculation doesn&apos;t balance. A Sacco loan you&apos;re
                guaranteeing for three colleagues. Your financial life is genuinely complex, and it
                deserves tools that understand it.
              </p>
              <p data-reveal data-delay="2" className="mb-5 text-[0.9375rem] leading-loose text-ink-soft">
                JiPange is built for this reality. Every number is grounded in Kenya&apos;s
                actual tax bands, each week&apos;s Treasury bill auction results, the NSSF Act 2013 phased rollout, SHIF
                contributions and Sacco mechanics — not a spreadsheet from somewhere else with a
                Ksh sign added.
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
                className="rounded-2xl border border-[#F0D08A] bg-accent-soft p-6"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent-ink">
                  📱 Understanding mobile credit
                </p>
                <p
                  className="text-4xl font-black leading-none tracking-tighter text-accent-ink"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  ≈{FULIZA_EXAMPLE_APR}%
                </p>
                <p className="mt-1.5 mb-3 text-[0.875rem] font-semibold text-ink-soft">
                  Fuliza&apos;s cost, expressed as an annual rate
                </p>
                <p className="text-[0.8125rem] leading-relaxed text-muted">
                  Ksh {FULIZA_EXAMPLE_DAILY.toFixed(2)}/day on Ksh {FULIZA_EXAMPLE_BALANCE}{" "}is easy
                  to overlook. Expressed as an annual rate, it is one of the costliest ways to
                  borrow — worth knowing whenever a cheaper option is within reach. Kenyans borrowed
                  Ksh {FULIZA_VOLUME_TRILLION_KSH} trillion through Fuliza in the year to March 2026.
                </p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
                  Digital lending is growing fast too. The {CBK_DIGITAL_LENDERS_LICENSED} digital lenders CBK
                  licenses were owed Ksh {CBK_DIGITAL_CREDIT_BILLION_KSH} billion in December 2025
                  — nearly double a year earlier — across {CBK_DIGITAL_CREDIT_LOANS_MILLIONS} million
                  loans averaging about {ksh(CBK_AVG_DIGITAL_LOAN_KSH)}.
                </p>
                <p className="mt-3 text-[0.6875rem] italic text-accent-ink">
                  Safaricom PLC FY2026 Annual Results · {CBK_BSAR_2025_CITE}, §3.24
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
                  Ksh {BANK_DEPOSITS_TRILLION_KSH}T
                </p>
                <p className="mt-1.5 mb-3 text-[0.875rem] font-semibold text-ink-soft">
                  {BANK_NET_BELOW_INFLATION
                    ? "in bank deposits, where the average rate after tax trails inflation"
                    : "in bank deposits, where the average rate after tax barely clears inflation"}
                </p>
                <p className="text-[0.8125rem] leading-relaxed text-muted">
                  Only Ksh {MMF_AUM_BILLION_KSH} billion sits in money market funds, which we
                  assume earn about {pct(TARGET_MMF_YIELD)}{" "}against the average bank
                  deposit&apos;s {CBK_AVG_DEPOSIT_RATE_PCT}%. After tax on both, Ksh{" "}
                  {SAVINGS_GAP_PRINCIPAL_KES.toLocaleString("en-KE")} over {SAVINGS_GAP_YEARS} years
                  comes out about {ksh(mmfVsBankDepositGapKES())} ahead in the fund — and more
                  against a savings account paying below the average.
                </p>
                <p className="mt-3 text-[0.6875rem] italic text-success-deep">
                  {cite("mmfAumBillionKsh")} · {CBK_BSAR_2025_CITE}, §3.7 · MMF yield assumed from
                  the latest 91-day bill
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      </details>

      {/* ── How it works ── */}
      <section className="bg-canvas py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-8">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-accent-ink">
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
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-black text-accent-contrast" aria-hidden="true">
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
      <section className="border-t border-border bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-accent-ink">
                Self-serve calculators
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-primary">
                Start with a quick win
              </h2>
            </div>
            <Link
              href="/tools"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent-ink"
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
                {/* text-muted, not text-border. A border colour used as a glyph
                    measured 1.12:1 — not subtle, unseeable. */}
                <span className="ml-auto shrink-0 text-muted transition-colors group-hover:text-accent-ink">
                  ›
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Goal planners ── */}
      <section className="border-t border-border bg-canvas py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-accent-ink">
                Goal planners
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                Working toward something specific?
              </h2>
            </div>
            <Link
              href="/planners"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-accent-ink"
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
                  // min-h-11: measured 42px at 390px, two short of the 44 that every
                  // header control now holds to. Padding is untouched so the
                  // pill keeps its shape; only the floor moves.
                  // grow: at 390px these pills stop sharing lines and stack one
                  // per row, where they came out 163/159px — a 4px mismatch on
                  // drawn borders, which reads as a wobble rather than a list.
                  className="inline-flex min-h-11 grow items-center gap-1.5 rounded-full border-[1.5px] border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
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
              {/* accent, not accent-ink: this sits on a dark panel, where the
                  light-background text shade drops to 1.24:1. */}
              <span className="text-accent">90 seconds away.</span>
            </h2>
            <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-canvas/90">
              No black box. No selling. No accounts. Just the maths, the vehicle, and the paybill to
              start. The rest is yours.
            </p>
            <Link
              href="/profile"
              className="inline-flex h-14 items-center justify-center rounded-full bg-accent px-10 text-base font-extrabold text-accent-contrast shadow-[0_4px_18px_rgba(232,160,32,0.35)] transition-all hover:bg-accent-deep hover:-translate-y-0.5"
            >
              Start my plan — it&apos;s free ›
            </Link>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {["🕶️ Anonymous", "🆓 No signup", "🇰🇪 PAYE · SHIF · NSSF accurate", "⚡ Works on any phone"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/12 bg-white/7 px-3 py-1.5 text-[0.8125rem] text-canvas"
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
      <div className="bg-primary border-t border-white/10 px-4 py-4 text-center">
        {/* Capped, because it was not.
          * This line had no measure at all: at 1440px it ran the full 1408px
          * as one centred sentence of roughly 250 characters, which is about
          * three times the width the eye can track back from. Every other
          * block on this page is bounded; this one was missed because it sits
          * outside the sections. */}
        <p className="mx-auto max-w-3xl text-[0.6875rem] text-canvas/90">
          {/* Two hand-typed errors lived in this sentence.
            *
            * "CMA Collective Investment Schemes, July 2026" named a month in
            * which no such report exists — the CMA reports QUARTERLY, and
            * lib/sources.ts has recorded that since the figure was corrected.
            * The registry had the right citation all along; this line just
            * never read it. It does now, via cite().
            *
            * "Rates current July 2026" is gone rather than corrected. This
            * page states statistics, not rates — no PAYE band or fund yield
            * appears on it — so the sentence was claiming currency for figures
            * that are not here, while the tables it sounded like it covered
            * are governed by lib/statutes.ts and carry their own dates.
            *
            * "Pension Policy International/KIPPRA 2024" was listed here with no
            * figure on the page drawing on it — the KIPPRA-linked number was
            * removed from lib/sources.ts and its credit line outlived it. The
            * list is now exactly what the cards above cite. */}
          Sources: FinAccess Household Survey 2024 (CBK/FSD Kenya/KNBS) · RBA Pensioners Survey
          2024 and industry brief to June 2025 · KNBS Economic Survey · {cite("mmfAumBillionKsh")}{" "}
          · Safaricom FY2026 Annual Report · {CBK_BSAR_2025_CITE} · inflation: {inflationAttribution()}.
        </p>
      </div>
    </>
  );
}
