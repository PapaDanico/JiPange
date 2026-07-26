import type { Metadata } from "next";
import Link from "next/link";
import { FAQS, FAQ_TOPICS, faqsByTopic } from "@/lib/faqs";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Money questions, answered — JiPange",
  description:
    "Straight answers to the Kenyan money questions that cost people real shillings: tax bands, Fuliza's true APR, flat vs reducing balance, SHA vs private cover, and whether the 4% rule works here.",
};

/**
 * The questions, in one place.
 *
 * Twenty-five calculators and nowhere to ask "should I clear debt or save
 * first?" — the question that decides whether anyone opens a calculator at
 * all. Every entry is chosen by one test: does getting this wrong cost real
 * money? Tidy-up questions are left out; questions where the common answer is
 * confidently wrong are in.
 *
 * Answers carry a link to the calculator that settles them, so the page hands
 * off to arithmetic rather than asking to be believed.
 */
export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <JsonLd data={faqPageJsonLd(FAQS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Questions", path: "/faq" },
        ])}
      />

      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">Money questions, answered</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          The questions below were picked by one test: getting them wrong costs real shillings.
          Where a calculator settles the answer properly, there is a link to it — you should
          not have to take our word for any of this.
        </p>

        <nav aria-label="Jump to a topic" className="mt-6 flex flex-wrap gap-2">
          {FAQ_TOPICS.map((t) => (
            <a
              key={t}
              href={`#${t.replace(/[^a-z]+/gi, "-").toLowerCase()}`}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-3 text-xs font-medium text-ink-soft transition-colors hover:border-primary hover:text-primary"
            >
              {t}
            </a>
          ))}
        </nav>

        <div className="mt-10 space-y-12">
          {FAQ_TOPICS.map((topic) => {
            const items = faqsByTopic(topic);
            if (!items.length) return null;
            return (
              <section key={topic} id={topic.replace(/[^a-z]+/gi, "-").toLowerCase()}>
                <h2 className="text-base font-semibold text-primary">{topic}</h2>
                <div className="mt-4 space-y-4">
                  {items.map((f) => (
                    <details
                      key={f.question}
                      className="group rounded-2xl bg-white p-5 shadow-sm"
                    >
                      <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:hidden">
                        <span className="flex items-start justify-between gap-3">
                          {f.question}
                          <span
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-ink-soft transition-transform group-open:rotate-180"
                          >
                            ▾
                          </span>
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.answer}</p>
                      {f.toolPath && (
                        <Link
                          href={f.toolPath}
                          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline"
                        >
                          {f.toolLabel ?? "Work it out"} →
                        </Link>
                      )}
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-12 text-xs leading-relaxed text-faint">
          Nothing here is financial advice — JiPange is not a licensed advisor and knows
          nothing about your circumstances. Statutory figures are cited on each calculator;
          market rates come from a published feed derived from Central Bank of Kenya releases.
          Still stuck? The{" "}
          <Link href="/glossary" className="underline hover:text-primary">
            glossary
          </Link>{" "}
          decodes the words, and the{" "}
          <Link href="/tools" className="underline hover:text-primary">
            calculators
          </Link>{" "}
          do the arithmetic.
        </p>
      </div>
    </div>
  );
}
