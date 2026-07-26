import Link from "next/link";

/**
 * A handoff from a JiPange calculator to the sister tool that goes deeper on
 * the same question.
 *
 * JiPange is deliberately broad: twenty-seven calculators covering the whole
 * of a Kenyan household's money. Breadth is the point, and it is also the
 * limit — a T-bill ladder tool cannot also be a full government-bond analytics
 * suite without becoming something else. Mwangaza Yield is that suite, built on
 * the same vision, and pointing at it is more honest than quietly under-serving
 * the few users who need that depth.
 *
 * Stated plainly as a sister tool rather than dressed as a recommendation.
 * Both products earn their trust by not selling anything, and a handoff that
 * reads like an advert would spend exactly the credibility that makes them
 * worth using. No affiliate parameters, no tracking — a link.
 */

export interface DeeperLink {
  /** The specific question this calculator cannot fully answer. */
  question: string;
  /** What the sister tool does about it. */
  answer: string;
  href: string;
  label: string;
}

export default function GoDeeper({ deeper }: { deeper: DeeperLink }) {
  return (
    <div className="w-full rounded-2xl border border-primary/15 bg-primary/[0.04] p-6 print:hidden">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
        Going deeper
      </p>
      <p className="mt-2 text-sm font-medium text-primary">{deeper.question}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{deeper.answer}</p>
      <Link
        href={deeper.href}
        target="_blank"
        rel="noopener"
        className="mt-3 inline-flex h-11 items-center justify-center rounded-full border border-primary/25 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        {deeper.label} →
      </Link>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-soft/80">
        Mwangaza Yield is our sister tool — free, no account, and it sells nothing either.
      </p>
    </div>
  );
}
