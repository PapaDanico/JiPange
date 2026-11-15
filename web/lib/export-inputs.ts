/**
 * What the reader entered, collected from the tool's own fields so every
 * exported report can say what its figures rest on.
 *
 * `ExportCardButton` has always accepted `assumptions` "so the sheet can be
 * reproduced", but only two of the nineteen tools that export passed any. The
 * other seventeen printed results with none of the inputs behind them: a loan
 * report said Ksh 11,122 a month and not the amount, rate or term. Reading the
 * fields at export time fixes all of them at once and cannot drift from what
 * the reader actually typed.
 *
 * A field takes part by carrying `data-export-label` (NumberField sets it).
 * Only fields that are on screen and filled in are included.
 */
export interface ExportInput {
  label: string;
  value: string;
}

/** The most inputs a sheet prints; beyond this the header would crowd the figures. */
export const MAX_EXPORT_INPUTS = 12;

const CURRENCY_UNIT = /\s*\((Ksh)(\/month|\/year)?\)\s*$/i;

/**
 * "Loan amount (Ksh)" + "500000" becomes { "Loan amount", "Ksh 500,000" };
 * "Repayment period (years)" + "5" stays as it is. Non-numeric values pass
 * through untouched rather than being guessed at.
 */
export function formatInput(rawLabel: string, rawValue: string, suffix = ""): ExportInput | null {
  const value = rawValue.trim();
  // "— optional" describes the form field, not the figure, so it stays off the sheet.
  const label = rawLabel.replace(/\s+/g, " ").replace(/\s*[—–-]\s*optional\s*$/i, "").trim();
  if (!label || !value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return { label, value };
  const money = label.match(CURRENCY_UNIT);
  const shown = n.toLocaleString("en-KE", { maximumFractionDigits: 6 });
  if (money) {
    return { label: label.replace(CURRENCY_UNIT, ""), value: `Ksh ${shown}${money[2] ? ` ${money[2].replace("/", "per ")}` : ""}` };
  }
  return { label, value: suffix ? (suffix === "%" ? `${shown}%` : `${shown} ${suffix}`) : shown };
}

export function inputsFromPairs(pairs: { label: string; value: string; suffix?: string }[]): ExportInput[] {
  const seen = new Set<string>();
  const out: ExportInput[] = [];
  for (const p of pairs) {
    const f = formatInput(p.label, p.value, p.suffix);
    if (!f || seen.has(f.label)) continue;
    seen.add(f.label);
    out.push(f);
    if (out.length === MAX_EXPORT_INPUTS) break;
  }
  return out;
}

/** Visible, filled-in fields on the page, in document order. */
export function collectInputs(root: ParentNode = document): ExportInput[] {
  const pairs = Array.from(root.querySelectorAll<HTMLInputElement>("input[data-export-label]"))
    .filter((el) => el.offsetParent !== null)
    .map((el) => ({ label: el.dataset.exportLabel ?? "", value: el.value, suffix: el.dataset.exportSuffix ?? "" }));
  return inputsFromPairs(pairs);
}
