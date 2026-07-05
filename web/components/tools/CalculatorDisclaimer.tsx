export default function CalculatorDisclaimer({ extraNotes }: { extraNotes?: string[] }) {
  return (
    <div className="space-y-1 text-xs text-[#4B4238]">
      <p>Rates current as of July 2026.</p>
      <p>
        Sources: PAYE bands — KRA Finance Act 2025/26 · NSSF — NSSF Act 2013 (Year 4, 2026) ·
        SHIF — Social Health Insurance Act, 2024 · Housing Levy — Affordable Housing Act, 2024.
      </p>
      {extraNotes?.map((note) => (
        <p key={note}>{note}</p>
      ))}
      <p>
        For guidance only. Verify against your payslip and check your exact figures at{" "}
        <a
          href="https://itax.kra.go.ke"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          itax.kra.go.ke
        </a>
        .
      </p>
    </div>
  );
}
