import Image from "next/image";

/**
 * Print-only report letterhead: brand mark, serif report title, and the
 * generation date over a hairline rule. Render at the top of any tool that
 * offers Print / Save as PDF — the on-screen page keeps its own heading
 * (this is `hidden print:block`).
 */
export default function PrintLetterhead({ title }: { title: string }) {
  return (
    <div className="hidden print:block">
      <div className="flex items-end justify-between border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Image
              src="/logo-icon.webp"
              alt=""
              width={973}
              height={833}
              className="h-7 w-auto"
            />
            <span className="text-sm font-semibold tracking-wide text-primary">
              JiPange
            </span>
          </div>
          <p className="mt-2 font-display text-xl font-semibold text-ink">
            {title}
          </p>
        </div>
        <p className="text-xs text-muted">
          Generated{" "}
          {new Date().toLocaleDateString("en-KE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
