/**
 * The WhatsApp channel JiPange runs jointly with Mwangaza Yield.
 *
 * WHERE IT MAY APPEAR, AND WHY THAT IS NARROWER THAN IT LOOKS
 *
 * `ASK_AFTER_VALUE` in mission.ts forbids soliciting a reader before the
 * product has given them something, and `mission.test.ts` enforces it — but it
 * enforces it against MONEY: the pattern matches the support page, the
 * suggested amount, the pay-what-you-can wording. A "follow us" prompt trips
 * none of that.
 *
 * The gap is real and it is not an invitation. The rule exists because the
 * whole proposition is that the reader is helped rather than harvested, and
 * asking for their attention before helping them is the same move with a
 * smaller price tag. So this follows the same discipline the money rule sets:
 * the footer, which is quiet and permanent, and the moment after a plan has
 * actually been produced. Never a modal, never an interstitial, never on a
 * landing page in front of somebody who has been given nothing yet.
 *
 * WHAT IT IS
 *
 * A broadcast: we post, readers read. It carries general money news for a
 * Kenyan audience, from both products. It is NOT support — support is email,
 * because a channel cannot answer anybody — and it is NOT personalised, which
 * matters here for the same reason it matters in Mwangaza: nothing on it can
 * depend on a reader's own numbers, since those stay in their browser.
 *
 * WhatsApp does not show channel admins who follows. We never see a number and
 * are never given a list, so following costs the reader no privacy — the one
 * claim here worth keeping true, and the privacy notice says it too.
 */
export const PESA_SMART_CHANNEL = "https://whatsapp.com/channel/0029VbDLPKzHAdNY8yiiEM2n";

/** Named the same way everywhere. Never softened to "our WhatsApp". */
export const PESA_SMART_NAME = "Pesa Smart KE";

/** One sentence, so the two products describe the same channel the same way. */
export const PESA_SMART_BLURB =
  "Money news for Kenya in plain language, from JiPange and Mwangaza Yield. Following tells us nothing about you — WhatsApp does not show us who follows.";
