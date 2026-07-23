import Link from "next/link";
import {
  ASSUMED_CURRENT_YIELD,
  CURRENT_INFLATION,
  YIELD_UPSIDE_POINTS,
  derivePersona,
  deriveSurvivalState,
  type JourneyAnswers,
} from "@/lib/journey";

const SURVIVAL_COPY = {
  high_risk: {
    className: "border-2 border-danger bg-danger-soft",
    titleClass: "text-danger",
    title: "⚠️ High Priority: The Mobile Loan Trap",
    subtext:
      "Your current cushion relies on short-term digital credit. This creates an invisible 'interest tax' that chips away at your monthly earnings before you can save.",
  },
  optimized: {
    className: "border-2 border-success bg-success-soft",
    titleClass: "text-success",
    title: "🛡️ Solid Baseline: Protected Liquidity",
    subtext:
      "You are successfully avoiding predatory short-term credit. Your foundation is primed for high-yield wealth building.",
  },
  exposed: {
    className: "border-2 border-accent bg-accent-soft",
    titleClass: "text-accent-ink",
    title: "🌤️ Workable, But Exposed",
    subtext:
      "You're covering surprises without digital debt — good — but each one leans on credit or people instead of a cushion that earns while it waits.",
  },
} as const;

function YieldBar({
  label,
  ratePct,
  barClass,
}: {
  label: string;
  ratePct: number;
  barClass: string;
}) {
  // Scale both bars against a 10% axis so the visual gap reads honestly.
  const width = Math.min(100, (ratePct / 10) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>{label}</span>
        <span className="font-semibold">{ratePct.toFixed(1)}%</span>
      </div>
      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-canvas">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

/**
 * The /picture diagnostic: survival status header, the silent inflation
 * burner visualizer, and the Pesa Engine persona with the forward CTA.
 * Pure render over the wizard payload — the maths lives in lib/journey.
 */
export default function PesaDiagnostic({ answers }: { answers: JourneyAnswers }) {
  const survival = SURVIVAL_COPY[deriveSurvivalState(answers.liquidity_leak)];
  const persona = derivePersona(answers);
  const showBurner =
    answers.current_vehicle.includes("mpesa_bank") && answers.income_bracket !== "under_50k";
  const gapPoints = ((CURRENT_INFLATION - ASSUMED_CURRENT_YIELD) * 100).toFixed(2);

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* ── Module 1: Survival Status header ── */}
      <section aria-label="Survival status" className={`rounded-2xl p-5 ${survival.className}`}>
        <h2 className={`text-base font-semibold ${survival.titleClass}`}>{survival.title}</h2>
        <p className="mt-2 text-sm text-ink-soft">{survival.subtext}</p>
      </section>

      {/* ── Module 2: The Silent Inflation Burner ── */}
      {showBurner && (
        <section
          aria-label="Silent inflation burner"
          className="rounded-2xl bg-white p-5 shadow-sm"
        >
          <h2 className="text-base font-semibold text-primary">The silent inflation burner</h2>
          <div className="mt-4 space-y-3">
            <YieldBar
              label="Your Bank/M-Pesa Yield"
              ratePct={ASSUMED_CURRENT_YIELD * 100}
              barClass="bg-[#8B8578]"
            />
            <YieldBar
              label="Kenyan Inflation Baseline"
              ratePct={CURRENT_INFLATION * 100}
              barClass="bg-danger"
            />
          </div>
          <p className="mt-4 rounded-xl bg-accent-soft p-3 text-sm text-ink-soft">
            💡 <em>The Real Picture:</em> Because your floating cash sits in a standard account,
            inflation is currently outpacing your growth by{" "}
            <strong className="text-danger">{gapPoints}% annually</strong>. Shifting this
            momentum to a regulated Money Market Fund (MMF) can reclaim up to{" "}
            <strong className="text-success">+{YIELD_UPSIDE_POINTS}% in net yield gains</strong>.
          </p>
        </section>
      )}

      {/* ── Module 3: Pesa Engine Persona ── */}
      <section aria-label="Pesa Engine persona" className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">
          Your Pesa Engine persona
        </p>
        <p className="mt-2 inline-block rounded-2xl border-2 border-primary bg-white px-6 py-4 text-2xl font-bold text-primary shadow-sm">
          {persona.name}
        </p>
        <p className="mt-2 text-sm text-ink-soft">{persona.blurb}</p>
      </section>

      {/* Sticky forward CTA — clears the mobile bottom nav, hugs the viewport on desktop. */}
      <div className="sticky bottom-20 z-30 pt-2 sm:bottom-4">
        <Link
          href="/plan"
          className="flex h-14 w-full items-center justify-center rounded-full bg-accent text-base font-semibold text-ink shadow-lg transition-colors hover:bg-accent-deep"
        >
          Fix My Picture → View My Action Plan (Free)
        </Link>
      </div>
    </div>
  );
}
