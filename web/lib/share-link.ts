import { positiveAmount } from "./money";

/**
 * Calculator links that carry the sender's scenario.
 *
 * WHAT WAS ALREADY THERE, AND WHAT WAS MISSING
 *
 * Every calculator already shares its RESULT to WhatsApp — the figures, in
 * words, with a bare link on the end:
 *
 *   🎯 My Savings Goal
 *   Target: Ksh 500,000 in 5 years
 *   Monthly savings needed: Ksh 6,800
 *   Calculate yours → jipangefinance.org/tools/savings-goal
 *
 * So the recipient reads the sender's answer and then lands on an EMPTY
 * calculator. They cannot ask the only question that matters to them — "what
 * if it were seven years, or forty thousand?" — without re-entering a scenario
 * they never saw the inputs for. The numbers travelled; the working did not.
 *
 * These helpers put the inputs in the link, so the recipient opens the sender's
 * scenario already filled in and changes one number.
 *
 * WHY THE PARAMS ARE TREATED AS HOSTILE
 *
 * A URL is the most obviously untrusted input a web page takes — anyone can
 * edit one and send it on. So every value is parsed through `positiveAmount`,
 * which rejects Infinity as well as the usual junk: `Number("1e400")` is
 * truthy and greater than zero, and the guards this codebase has been
 * replacing all year would have let it through. Anything that fails is
 * dropped, not defaulted to a guess, and the field simply stays as it was.
 *
 * WHY THIS DOES NOT MAKE THE APP TRACK ANYBODY
 *
 * The parameters are written by the SENDER, on their own device, and read by
 * the recipient's browser. Nothing is transmitted to us: the site is static
 * and there is no server to log them. This stays inside "no accounts, no
 * cookies, no tracking" — it is the same shape as the export/import file,
 * addressed to a person instead of a disk.
 */

/** A calculator's shareable inputs: field name → the value the sender used. */
export type ShareParams = Record<string, number>;

/** Values above this are refused outright — no personal figure is this large. */
const MAX_SHAREABLE = 100_000_000_000; // 100 billion KES

/**
 * Appends the sender's inputs to a tool path.
 *
 * Values that are not finite positive numbers are omitted rather than
 * serialised as "NaN" — a link is read by people as well as machines, and a
 * visible NaN in a WhatsApp message costs more trust than the missing field.
 */
export function buildShareLink(path: string, params: ShareParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const safe = positiveAmount(value);
    if (safe === null || safe > MAX_SHAREABLE) continue;
    // Trailing ".0" reads as noise in a link somebody may glance at.
    search.set(key, String(Number(safe.toFixed(4))));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Reads the sender's inputs back out, keeping only what is usable.
 *
 * Returns strings because that is what the calculators' fields hold — they are
 * controlled text inputs, and handing them a number would make the first
 * keystroke behave differently from every one after it.
 */
export function readShareParams(search: string, fields: readonly string[]): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const field of fields) {
    const raw = params.get(field);
    if (raw === null) continue;
    const safe = positiveAmount(raw);
    if (safe === null || safe > MAX_SHAREABLE) continue;
    out[field] = String(Number(safe.toFixed(4)));
  }
  return out;
}

/**
 * The absolute link that goes in a shared message.
 *
 * Bare host, no scheme: WhatsApp linkifies `jipangefinance.org/...` on its own
 * and the shorter form is what the existing messages already use, so this
 * keeps them consistent rather than introducing a second house style.
 */
export function shareableUrl(path: string, params: ShareParams, host = "jipangefinance.org"): string {
  return `${host}${buildShareLink(path, params)}`;
}
