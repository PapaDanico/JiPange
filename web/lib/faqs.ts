/**
 * The questions a Kenyan household actually asks about money.
 *
 * Chosen by one test: does getting this wrong cost real shillings? Questions
 * that only tidy up someone's understanding are left out; questions where the
 * common answer is confidently wrong are in.
 *
 * Every numeric claim here either comes from the published rates feed at
 * render time or is a statutory figure the app already computes elsewhere, so
 * nothing in this file can drift away from the calculators it sits beside.
 */

export interface Faq {
  question: string;
  /** Plain answer. Written to be readable aloud to somebody who is worried. */
  answer: string;
  topic: "Getting started" | "Pay & tax" | "Debt" | "Investing" | "Health & retirement" | "About JiPange";
  /** Where to go next, if a calculator answers it properly. */
  toolPath?: string;
  toolLabel?: string;
}

export const FAQS: Faq[] = [
  /* ─────────────────────────────────────────────── Getting started */
  {
    question: "I only have a little to spare each month. Is it even worth starting?",
    answer:
      "Yes, and the arithmetic is not close. Starting ten years earlier with a small amount usually beats starting later with a large one, because the early shillings compound for the longest. The common mistake is waiting until the amount feels dignified — by which point the thing that was doing most of the work, time, has been spent.",
    topic: "Getting started",
    toolPath: "/tools/investment-returns",
    toolLabel: "See what a small monthly amount becomes",
  },
  {
    question: "Should I clear my debt first or start saving?",
    answer:
      "Compare the rates honestly, after tax. A digital loan or Fuliza balance costs vastly more than any legal investment returns, so clearing it is the highest-return thing available to you. A cheap SACCO loan can be different. The exception in both cases is a small emergency buffer — without one, the next shock puts you straight back into the expensive debt you just cleared.",
    topic: "Debt",
    toolPath: "/tools/debt-escape",
    toolLabel: "Work out which debt to kill first",
  },
  {
    question: "How much should my emergency fund be?",
    answer:
      "Three to six months of expenses is the usual answer, and the more useful question is how quickly you could reach it. If your income is irregular, lean toward six; if you have dependants relying on you, lean toward six as well. Keep it somewhere it can be withdrawn in a day — its job is availability, not return.",
    topic: "Getting started",
    toolPath: "/tools/money-runway",
    toolLabel: "See how long your money would last",
  },

  /* ───────────────────────────────────────────────────── Pay & tax */
  {
    question: "I got a raise and my take-home barely moved. Was I cheated?",
    answer:
      "Probably not. PAYE rises in bands, and NSSF, SHA and the housing levy are all percentages of gross — so a raise increases four deductions at once. Only the portion above the band threshold is taxed at the higher rate, though; the whole salary is never re-taxed. If the net went DOWN, that is worth querying.",
    topic: "Pay & tax",
    toolPath: "/tools/take-home-pay",
    toolLabel: "See exactly where your salary goes",
  },
  {
    question: "Will earning more push me into a higher tax band and leave me worse off?",
    answer:
      "No. This is the most persistent myth in Kenyan pay, and it costs people promotions. Only the shillings above the threshold are taxed at the higher rate. Earning more always leaves you with more after tax — the increase is just smaller than the headline.",
    topic: "Pay & tax",
    toolPath: "/tools/salary-negotiation",
    toolLabel: "Work out the gross you need for a target net",
  },
  {
    question: "What is the housing levy actually for, and can I opt out?",
    answer:
      "It is a statutory 1.5% of gross pay, matched by your employer, under the Affordable Housing Act. It is not optional for salaried employees. What matters for planning is that it comes off before you see anything, so every budget and loan-affordability sum should be built on the figure after it — not on your gross.",
    topic: "Pay & tax",
    toolPath: "/tools/take-home-pay",
  },

  /* ───────────────────────────────────────────────────────── Debt */
  {
    question: "Fuliza is only about 1% a day. That is cheap, isn't it?",
    answer:
      "It is roughly 400% a year. A daily rate is the most effective way to make a very expensive loan sound small, and it is not a trick — the number is accurate, it is simply quoted over a period short enough to look harmless. Borrowing at 400% to bridge a gap that recurs every month means the gap now costs more than it did.",
    topic: "Debt",
    toolPath: "/tools/fuliza-cost",
    toolLabel: "See what a Fuliza habit costs a year",
  },
  {
    question: "My loan is quoted at 12%. Why does the repayment look so much bigger?",
    answer:
      "Ask whether that 12% is flat or on reducing balance. A flat rate charges interest on the full original amount for the entire term, even though you are paying it down — so a 12% flat loan costs roughly what a 22% reducing-balance loan does. Both are legal, both get quoted, and only one of them sounds expensive.",
    topic: "Debt",
    toolPath: "/tools/loan-repayment",
    toolLabel: "Compare the true cost",
  },
  {
    question: "A friend asked me to guarantee their SACCO loan. What am I risking?",
    answer:
      "Your own savings are pledged as security, so that portion stops being available for your own borrowing even though it still appears in your balance. If they default, it is taken. The realistic question is not whether you trust them — it is whether you could absorb the loss and the frozen borrowing capacity at the same time.",
    topic: "Debt",
    toolPath: "/tools/guarantor-shield",
    toolLabel: "See what a guarantee freezes",
  },

  /* ────────────────────────────────────────────────────── Investing */
  {
    question: "A fund advertises 12% and a Treasury bill quotes 9%. Is the fund better?",
    answer:
      "Not necessarily, because those two numbers are not the same kind of number. The fund figure is gross, so 15% withholding tax takes it to about 10.2%. The bill quote is a simple annual rate on the price you pay: hold a 91-day bill and roll it four times and you earn a little more than the quote, then the same 15% takes it well below. Whether the fund wins depends on the gap after both adjustments — and on this app that gap is usually smaller than the advertised headlines suggest. Comparing headlines directly is the most common investing error in Kenya, and this app computes both on the same basis so you do not have to.",
    topic: "Investing",
    toolPath: "/tools/dhowcsd",
    toolLabel: "Compare on the same basis",
  },
  {
    question: "My savings account pays 3%. That is still growth, isn't it?",
    answer:
      "In shillings, yes. In what those shillings buy, no. With inflation above 6%, money in a 3% account loses purchasing power every year — the balance rises while the value falls. This is the quietest way money is lost in Kenya, because nothing ever appears to go wrong.",
    topic: "Investing",
    toolPath: "/tools/inflation-reality",
    toolLabel: "See what inflation is doing to yours",
  },
  {
    question: "Is a SACCO safer than a bank?",
    answer:
      "Different, not simply safer. Tier-1 SACCOs are SASRA-regulated and often pay materially better than bank deposits, but your money is less liquid and your shares are not a deposit you can simply withdraw. Read which pool a quoted rate applies to — dividends on shares and interest on deposits are different rates on different money.",
    topic: "Investing",
    toolPath: "/tools/sacco-vs-bank",
    toolLabel: "Compare the two properly",
  },
  {
    question: "How does our chama decide who goes first fairly?",
    answer:
      "Recognise what is actually being allocated. In pure cash every member ends the cycle identically — everyone pays every month and receives the same pot once. What differs is timing: receiving in month one is an interest-free loan from the group, receiving last is an interest-free loan to it. That gap is real money, so rotating who goes first between cycles, or drawing lots each cycle, is the fairness mechanism rather than a formality.",
    topic: "Investing",
    toolPath: "/tools/chama",
    toolLabel: "Price your own rotation",
  },

  /* ──────────────────────────────────────────── Health & retirement */
  {
    question: "I have SHA. Do I still need private medical cover?",
    answer:
      "SHA is a floor, not a plan. It is built around accredited public facilities, so if you or your family currently use private hospitals, SHA alone is a change in the level of care rather than a cost you have covered. Decide deliberately which you are planning for — the mistake is assuming SHA continues whatever you have now.",
    topic: "Health & retirement",
    toolPath: "/tools/sha-health",
    toolLabel: "See your SHA contribution and its gaps",
  },
  {
    question: "Why does medical cover matter so much more in retirement than now?",
    answer:
      "Because it moves the opposite way to everything else. School fees end, the commute goes, the house gets paid for — ordinary costs drift down in real terms. Medical does not: premiums are banded by age and climb steeply, on top of general inflation. A household spending 6% of its budget on cover today typically needs around 19% of its retirement capital set aside for it. That amplification is invisible in a monthly budget.",
    topic: "Health & retirement",
    toolPath: "/tools/fire-number",
    toolLabel: "Price your own retirement",
  },
  {
    question: "Can I just buy medical cover when I retire?",
    answer:
      "Often not. Kenyan insurers commonly decline NEW members past their mid-sixties, admitting older people only where cover has been held continuously. So the decision about retirement medical cover expires BEFORE retirement does. If you intend to have private cover at seventy, the time to hold it is well before sixty-five.",
    topic: "Health & retirement",
    toolPath: "/tools/fire-number",
  },
  {
    question: "Is the 4% rule right for Kenya?",
    answer:
      "Not without adjustment. It comes from American market history and sizes a pot meant to last forever. Two Kenyan realities change it in opposite directions: retirement spending does fall in real terms here too, but less than the Western literature assumes because extended-family obligation does not retire — and medical costs climb steeply while everything else falls. This app prices those streams separately rather than applying any multiple.",
    topic: "Health & retirement",
    toolPath: "/tools/fire-number",
  },

  /* ────────────────────────────────────────────────── About JiPange */
  {
    question: "Where do your numbers come from?",
    answer:
      "Statutory figures — PAYE bands, NSSF, SHA, the housing levy — come from the Acts and are cited on each calculator. Market rates come from a published feed maintained by our sister tool Mwangaza Yield, which derives them from Central Bank of Kenya releases and verifies them against real contract notes. Where a figure is our estimate rather than a published one, the calculator says so.",
    topic: "About JiPange",
  },
  {
    question: "Is it free, and who is paying you?",
    answer:
      "It is free, and nobody is paying us. There are no affiliate arrangements on any product listed and no advertising or tracking scripts. Every calculator runs in your browser and sends nothing anywhere. There is no account and nothing to sign in to; moving a plan to another phone is an exported backup file you carry yourself. Even the action plan is generated on your device by a deterministic engine; nothing is sent to any AI provider. The privacy notice sets out the details. If any of that changes, it will be stated plainly rather than discovered — a tool that quietly earns from steering you is worth less than no tool at all.",
    topic: "About JiPange",
  },
  {
    question: "Is this financial advice?",
    answer:
      "No. JiPange is not a licensed financial advisor, and everything here is arithmetic plus published rates — it does not know your circumstances. It is built to let you check a claim somebody else has made and to arrive at a conversation with a bank, SACCO or advisor already knowing what the numbers are.",
    topic: "About JiPange",
  },
];

export const FAQ_TOPICS = [
  "Getting started",
  "Pay & tax",
  "Debt",
  "Investing",
  "Health & retirement",
  "About JiPange",
] as const;

export function faqsByTopic(topic: string): Faq[] {
  return FAQS.filter((f) => f.topic === topic);
}
