import { round2 } from "./money";

export interface AmortizationEntry {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export interface LoanAmortization {
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  schedule: AmortizationEntry[];
}

/**
 * The longest schedule this will build, and why there is a limit at all.
 *
 * The loop below pushes one object per month, so the term is an iteration
 * count taken straight from a text box. An extra digit in "Repayment period
 * (years)" — 999999999999 rather than 9 — asks for twelve trillion objects,
 * and the tab locks solid: no error, no result, nothing to cancel. On a phone
 * that means force-quitting the browser.
 *
 * Six hundred months is fifty years, comfortably past any Kenyan mortgage (the
 * longest run about twenty-five). Past that there is no loan to model, so this
 * returns the same empty result as a zero term rather than inventing an answer
 * or trying to compute one.
 *
 * The calculators bound their own fields, and that is where a reader learns
 * the limit. This is the guarantee underneath it: no caller, present or
 * future, can hang the browser through this function.
 */
export const MAX_TERM_MONTHS = 600;

/** Standard reducing-balance amortization: equal monthly payments, interest on the declining balance. */
export function calculateLoanAmortization(params: {
  principal: number;
  annualRate: number;
  termMonths: number;
}): LoanAmortization {
  const { principal, annualRate, termMonths } = params;

  if (principal <= 0 || termMonths <= 0 || termMonths > MAX_TERM_MONTHS) {
    return { monthlyPayment: 0, totalInterest: 0, totalPaid: 0, schedule: [] };
  }

  const monthlyRate = annualRate / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

  const schedule: AmortizationEntry[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPaid = 0;

  for (let month = 1; month <= termMonths; month++) {
    const interestPaid = round2(balance * monthlyRate);
    let payment = round2(monthlyPayment);
    let principalPaid = round2(payment - interestPaid);

    // Final installment (or any rounding overshoot) pays off exactly what's left.
    if (month === termMonths || principalPaid > balance) {
      principalPaid = balance;
      payment = round2(principalPaid + interestPaid);
    }

    balance = round2(balance - principalPaid);
    totalInterest = round2(totalInterest + interestPaid);
    totalPaid = round2(totalPaid + payment);

    schedule.push({
      month,
      payment,
      principalPaid,
      interestPaid,
      remainingBalance: Math.max(0, balance),
    });

    if (balance <= 0) break;
  }

  return {
    monthlyPayment: round2(monthlyPayment),
    totalInterest,
    totalPaid,
    schedule,
  };
}
