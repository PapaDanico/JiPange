/** Collapsible 30-second tutorial — works without JS (native <details>). */
export default function HowItWorks({ steps }: { steps: string[] }) {
  return (
    <details className="rounded-2xl border border-border bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-primary">
        📖 How this works — 30-second tutorial
      </summary>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </details>
  );
}
