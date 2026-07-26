import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY, GLOSSARY_TOPICS, glossaryByTopic } from "@/lib/glossary";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, glossaryJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Money words, decoded — JiPange",
  description:
    "Plain-Kenyan definitions of the terms on your payslip, your SACCO statement and every financial product sold to you — and the mistake each one causes.",
};

/**
 * A decoder for this app and the paperwork around it.
 *
 * Not a finance dictionary. Every term here appears somewhere in JiPange or in
 * a document a reader meets straight afterwards — a payslip, a SACCO
 * statement, a loan offer. And every entry ends on the mistake the term
 * causes, because people do not lose money to jargon by failing to define it.
 * They lose money by not knowing which number it silently changes.
 */
export default function GlossaryPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <JsonLd
        data={glossaryJsonLd({
          name: "Kenyan money words, decoded",
          description:
            "Plain-Kenyan definitions of financial terms, and the mistake each one causes.",
          path: "/glossary",
          terms: GLOSSARY,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Glossary", path: "/glossary" },
        ])}
      />

      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-primary">Money words, decoded</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Every term here is one you will meet on a payslip, a SACCO statement, a loan offer or
          in this app. Each ends with <strong>why it matters</strong> — because the reason
          jargon costs people money is not that they cannot define it, but that they do not
          know which number it quietly changes.
        </p>

        <nav aria-label="Jump to a topic" className="mt-6 flex flex-wrap gap-2">
          {GLOSSARY_TOPICS.map((t) => (
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
          {GLOSSARY_TOPICS.map((topic) => {
            const items = glossaryByTopic(topic);
            if (!items.length) return null;
            return (
              <section key={topic} id={topic.replace(/[^a-z]+/gi, "-").toLowerCase()}>
                <h2 className="text-base font-semibold text-primary">{topic}</h2>
                <dl className="mt-4 space-y-4">
                  {items.map((g) => (
                    <div key={g.term} className="rounded-2xl bg-white p-5 shadow-sm">
                      <dt className="text-sm font-semibold text-ink">{g.term}</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
                        {g.meaning}
                      </dd>
                      <dd className="mt-3 border-l-2 border-[#F0C06A] pl-3 text-sm leading-relaxed text-ink-soft">
                        <span className="font-medium text-warning">Why it matters. </span>
                        {g.whyItMatters}
                      </dd>
                      {g.toolPath && (
                        <dd className="mt-3">
                          <Link
                            href={g.toolPath}
                            className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline"
                          >
                            Work it out with your own numbers →
                          </Link>
                        </dd>
                      )}
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>

        <p className="mt-12 text-xs leading-relaxed text-faint">
          {GLOSSARY.length} terms. Missing one you met somewhere? It probably belongs here —
          the test for inclusion is whether misunderstanding it costs money. See also the{" "}
          <Link href="/faq" className="underline hover:text-primary">
            questions page
          </Link>{" "}
          and the{" "}
          <Link href="/tools" className="underline hover:text-primary">
            calculators
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
