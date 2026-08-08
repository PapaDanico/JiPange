import { CONTROLLER } from "./privacy-facts";

/**
 * A route for a reader to say "this number is wrong".
 *
 * WHY THIS IS NOT A FEATURE REQUEST BOX
 *
 * These calculators encode figures that go stale on somebody else's schedule:
 * PAYE bands, NSSF tiers, SHIF rates, the paybill numbers, the T-bill yields
 * the feed carries. Every one of them has an expiry guard, and every guard
 * fires on a DATE — it cannot notice that a band changed early, or that a
 * digit was mistyped when the table was entered. The only detector for that
 * class of error is a reader who knows their own payslip.
 *
 * Until now, that reader had nowhere to go. `hello@` is on /about and /terms,
 * three clicks from the calculator, with no indication that a wrong figure is
 * something we want to hear about. Someone who spots a bad number quietly
 * stops trusting the site instead, which is the worst possible outcome: the
 * defect stays, and so does the belief that it is everywhere.
 *
 * WHY A MAILTO AND NOT A FORM
 *
 * A form needs a server to post to, and this site does not have one — it is a
 * static export, which is the same reason there are no accounts and no
 * cookies. A form would mean an endpoint, an endpoint means logs, and logs
 * mean the privacy notice stops being true. `mailto:` keeps the reader's mail
 * client as the only thing that sees the message, and they read every word
 * before it is sent.
 *
 * WHY THE READER'S FIGURES ARE NOT PREFILLED
 *
 * We know the tool and the route; we do NOT put the reader's inputs in the
 * draft. A calculator's fields hold a salary, a debt, a school fee — putting
 * those into an outgoing mail body because somebody clicked a link would be
 * exfiltration with extra steps, however visible the draft is. The body is a
 * template the reader fills in with only what they choose to share.
 */

/** Where a report goes. Same address the privacy notice names, deliberately. */
export const REPORT_TO = CONTROLLER.contact;

export interface ReportContext {
  /** The calculator's title, as shown to the reader. */
  title: string;
  /** Its route, so a report identifies the page without the reader pasting a URL. */
  path: string;
}

/**
 * The subject line. The tool name is in it so a report is triageable from the
 * inbox list without opening it.
 */
export function reportSubject({ title }: ReportContext): string {
  return `Possible error: ${title}`;
}

/**
 * The body template.
 *
 * Three prompts, in the order that makes a report actionable: what the tool
 * said, what the reader believes is right, and where they got that. The third
 * is the one that turns a complaint into a fix — a payslip or a KRA page
 * settles a band; "this looks too high" cannot.
 *
 * No placeholder is prefilled with a guess. An empty line the reader types
 * into is honest; a pre-typed figure they might not correct is not.
 */
export function reportBody({ title, path }: ReportContext): string {
  return [
    `Calculator: ${title}`,
    `Page: https://jipangefinance.org${path}`,
    "",
    "What the calculator showed:",
    "",
    "What I think it should be:",
    "",
    "Where I'm getting that from (a payslip, a KRA table, a bank statement):",
    "",
    "",
    "— Thank you. Nothing above is sent until you press send, and we only",
    "see what you have typed here.",
  ].join("\n");
}

/**
 * The full mailto URL.
 *
 * Every part is percent-encoded. A title containing "&" would otherwise end
 * the subject early and silently truncate it, and titles here are free text
 * set at each call site — not a set this module controls.
 */
export function reportMailto(context: ReportContext): string {
  const subject = encodeURIComponent(reportSubject(context));
  const body = encodeURIComponent(reportBody(context));
  return `mailto:${REPORT_TO}?subject=${subject}&body=${body}`;
}
