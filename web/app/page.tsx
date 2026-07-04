import Image from "next/image";
import Link from "next/link";
import ResumeToast from "@/components/onboarding/ResumeToast";
import ReturningUserRedirect from "@/components/onboarding/ReturningUserRedirect";
import {
  ASSUMED_CURRENT_YIELD,
  CURRENT_INFLATION,
  TARGET_MMF_YIELD,
  YIELD_UPSIDE_POINTS,
} from "@/lib/journey";

const pct = (rate: number) => `${parseFloat((rate * 100).toFixed(2))}%`;

const TRUST_CHIPS = ["🕶️ 100% anonymous", "👆🏿 Tap-only, zero typing", "🆓 Free — no signup"];

const STATS: { figure: string; label: string; detail: string; href: string; tone: "danger" | "success" }[] = [
  {
    figure: pct(ASSUMED_CURRENT_YIELD),
    label: "what the average bank savings account pays",
    detail: `Inflation runs at ${pct(CURRENT_INFLATION)} — money "safe" in the bank loses buying power every single day.`,
    href: "/tools/inflation-reality",
    tone: "danger",
  },
  {
    figure: pct(TARGET_MMF_YIELD),
    label: "Kenya's money-market growth baseline",
    detail: `The same shillings, moved to the right vehicle, earn +${YIELD_UPSIDE_POINTS} points more — automatically.`,
    href: "/tools/investment-returns",
    tone: "success",
  },
  {
    figure: "≈400%",
    label: "Fuliza's true annualised cost",
    detail: "The overdraft that feels like KSh 25 a day is the most expensive credit in your life.",
    href: "/tools/fuliza-cost",
    tone: "danger",
  },
];

const STEPS = [
  { emoji: "👆🏿", title: "Tap 5 answers", text: "90 seconds, anonymous, zero typing — no salary figures needed." },
  { emoji: "🔍", title: "See your Pesa Picture", text: "Your survival status, where inflation is eating your savings, and the silent leaks." },
  { emoji: "🗺️", title: "Get your action plan", text: "The exact vehicle, monthly milestone, and even the paybill to execute it." },
];

const TOOLS = [
  { href: "/tools/take-home-pay", emoji: "💰", name: "Take-Home Pay", hook: "Your exact net after PAYE, SHIF & Housing Levy" },
  { href: "/tools/fuliza-cost", emoji: "📱", name: "True Cost of Fuliza", hook: "What the overdraft really charges you" },
  { href: "/tools/kplc-optimizer", emoji: "⚡", name: "KPLC Token Optimizer", hook: "Free units by splitting your token buys" },
  { href: "/tools/fire-number", emoji: "🔥", name: "FIRE Number", hook: "Your Kenya-localized retirement target" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12 sm:py-16">
      <ResumeToast />
      <ReturningUserRedirect />

      {/* ── Hero ── */}
      <section className="flex flex-col items-center text-center">
        <Image
          src="/logo-lockup.webp"
          alt="JiPange"
          width={1131}
          height={609}
          priority
          className="h-auto w-56 sm:w-64"
        />
        <h1 className="mt-4 max-w-lg text-2xl font-semibold leading-snug text-primary sm:text-3xl">
          Jipange kabla pesa ikupange.
        </h1>
        <p className="mt-2 max-w-md text-base text-[#4B4238] sm:text-lg">
          The financial plan every Kenyan deserves — built for how we actually live: M-Pesa,
          Saccos, chamas, side hustles and all.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/profile"
            className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-full bg-accent px-6 text-base font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
          >
            Start my plan — 90 seconds
          </Link>
          <Link
            href="/tools"
            className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-full border border-primary px-6 text-base font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Explore free calculators
          </Link>
        </div>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {TRUST_CHIPS.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-[#E5E0D8] bg-white px-3 py-1.5 text-xs font-medium text-[#4B4238]"
            >
              {chip}
            </li>
          ))}
        </ul>
      </section>

      {/* ── The leak: why this matters right now ── */}
      <section aria-label="Why it matters" className="mt-14 w-full max-w-4xl">
        <h2 className="text-center text-lg font-semibold text-primary">
          Your money is leaking <em>right now</em> — here&apos;s the maths
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((stat) => (
            <Link
              key={stat.figure}
              href={stat.href}
              className="group rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p
                className={`text-3xl font-semibold ${
                  stat.tone === "danger" ? "text-danger" : "text-success"
                }`}
              >
                {stat.figure}
              </p>
              <p className="mt-1 text-sm font-medium text-primary">{stat.label}</p>
              <p className="mt-2 text-xs text-[#4B4238]">{stat.detail}</p>
              <p className="mt-3 text-xs font-medium text-primary underline group-hover:no-underline">
                Run your numbers →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section aria-label="How it works" className="mt-14 w-full max-w-4xl">
        <h2 className="text-center text-lg font-semibold text-primary">
          From &quot;pesa inaisha tu&quot; to a plan — in three steps
        </h2>
        <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-2xl" aria-hidden="true">
                {step.emoji}
              </p>
              <p className="mt-2 text-sm font-semibold text-primary">
                {index + 1}. {step.title}
              </p>
              <p className="mt-1 text-sm text-[#4B4238]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Popular tools ── */}
      <section aria-label="Popular calculators" className="mt-14 w-full max-w-4xl">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-primary">Start with a quick win</h2>
          <Link href="/tools" className="text-sm font-medium text-primary underline">
            All 17 calculators →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center gap-3 rounded-2xl border border-[#E5E0D8] bg-white p-4 transition-colors hover:bg-[#F1ECE3]"
            >
              <span className="text-2xl" aria-hidden="true">
                {tool.emoji}
              </span>
              <span>
                <span className="block text-sm font-semibold text-primary">{tool.name}</span>
                <span className="block text-xs text-[#4B4238]">{tool.hook}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Final CTA band ── */}
      <section
        aria-label="Get started"
        className="mt-14 w-full max-w-4xl rounded-3xl bg-primary p-8 text-center text-white"
      >
        <h2 className="text-xl font-semibold">Jipange kabla pesa ikupange 😅</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#F1ECE3]">
          Five taps. No signup, no salary questions, nothing stored on our servers. Just your
          money, mapped.
        </p>
        <Link
          href="/profile"
          className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-base font-medium text-[#171717] transition-colors hover:bg-[#d6961f]"
        >
          Start the 90-second check →
        </Link>
        <p className="mt-4 text-xs text-[#F1ECE3]">
          Prefer a specific goal?{" "}
          <Link href="/planners" className="font-medium text-white underline">
            Education, home, business & retirement planners →
          </Link>
        </p>
      </section>
    </div>
  );
}
