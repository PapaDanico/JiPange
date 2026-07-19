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

/** Standard reducing-balance amortization: equal monthly payments, interest on the declining balance. */
export function calculateLoanAmortization(params: {
  principal: number;
  annualRate: number;
  termMonths: number;
}): LoanAmortization {
  const { principal, annualRate, termMonths } = params;

  if (principal <= 0 || termMonths <= 0) {
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
