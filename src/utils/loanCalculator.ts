// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Fixed-rate amortizing loan math for the buyer-facing loan calculator.
//
// Kept free of React and i18n so the arithmetic can be exercised on its own:
// `evaluateLoan` takes the raw text the user typed and returns either field
// errors or a finished result, and never throws.

/** Longest term we will calculate. Past this the numbers stop being meaningful. */
const MAX_TERM_YEARS = 100;
/** Above this the result overflows the currency formatting and is not a real loan. */
const MAX_AMOUNT_EUR = 1_000_000_000;
/** A rate this high is a typo, not a mortgage. */
const MAX_RATE_PERCENT = 200;

export type LoanField = "amount" | "years" | "months" | "rate";

/** Suffix of the `loanCalculator.errors.*` translation key to show for a field. */
export type LoanErrorCode =
  | "amountInvalid"
  | "amountPositive"
  | "amountTooLarge"
  | "termPositive"
  | "termTooLong"
  | "monthsRange"
  | "monthsInvalid"
  | "rateInvalid"
  | "rateNegative"
  | "rateTooLarge";

export type LoanInput = {
  amountEur: string;
  years: string;
  months: string;
  annualRatePercent: string;
};

export type LoanResult = {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  totalMonths: number;
};

export type LoanEvaluation = {
  /** Only the fields the user has actually filled in can carry an error. */
  errors: Partial<Record<LoanField, LoanErrorCode>>;
  /** Null until every field is both present and valid. */
  result: LoanResult | null;
};

export const EMPTY_LOAN_INPUT: LoanInput = {
  amountEur: "",
  years: "",
  months: "",
  annualRatePercent: "",
};

/**
 * Parses a number the way a Serbian or English speaker would type it — `4,5`
 * and `4.5` both mean four and a half. Returns null for anything that is not a
 * plain finite number, including the empty string.
 */
const parseDecimal = (raw: string): number | null => {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;

  // `Number` is deliberately strict here: it rejects "1 2", "4.5kn" and "".
  // Guarding on the regex first also keeps out hex and exponent forms, which
  // would parse but never come from the numeric keypad.
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === ".") return null;

  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
};

/**
 * Monthly payment for a fixed-rate amortizing loan:
 *
 *   M = P × r(1+r)^n / ((1+r)^n − 1)
 *
 * At 0% the formula divides by zero, so the principal is simply spread evenly
 * across the term.
 */
export const monthlyPaymentFor = (
  principal: number,
  monthlyRate: number,
  totalMonths: number,
): number => {
  if (monthlyRate === 0) return principal / totalMonths;

  const growth = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * monthlyRate * growth) / (growth - 1);
};

/**
 * Validates the raw form input and computes the result when it is complete.
 *
 * A field that is still empty produces no error — the calculator stays quiet
 * while it is being filled in rather than shouting at a half-typed form.
 */
export const evaluateLoan = (input: LoanInput): LoanEvaluation => {
  const errors: Partial<Record<LoanField, LoanErrorCode>> = {};

  const amount = parseDecimal(input.amountEur);
  const years = parseDecimal(input.years);
  const months = parseDecimal(input.months);
  const rate = parseDecimal(input.annualRatePercent);

  const hasAmount = input.amountEur.trim().length > 0;
  const hasYears = input.years.trim().length > 0;
  const hasMonths = input.months.trim().length > 0;
  const hasRate = input.annualRatePercent.trim().length > 0;

  if (hasAmount) {
    if (amount === null) errors.amount = "amountInvalid";
    else if (amount <= 0) errors.amount = "amountPositive";
    else if (amount > MAX_AMOUNT_EUR) errors.amount = "amountTooLarge";
  }

  if (hasYears) {
    if (years === null) errors.years = "monthsInvalid";
    else if (years > MAX_TERM_YEARS) errors.years = "termTooLong";
  }

  // Years carries the whole-year part, so months is the remainder within a
  // year. Rejecting 12+ keeps "1 year 6 months" the only spelling of that term
  // instead of silently accepting an equivalent "0 years 18 months".
  if (hasMonths) {
    if (months === null || !Number.isInteger(months)) errors.months = "monthsInvalid";
    else if (months < 0 || months > 11) errors.months = "monthsRange";
  }

  if (hasRate) {
    if (rate === null) errors.rate = "rateInvalid";
    else if (rate < 0) errors.rate = "rateNegative";
    else if (rate > MAX_RATE_PERCENT) errors.rate = "rateTooLarge";
  }

  // The term is one value split across two inputs, so an all-zero term belongs
  // to whichever of them the user has filled in.
  const termIsPresent = hasYears || hasMonths;
  const totalMonths = (years ?? 0) * 12 + (months ?? 0);
  if (termIsPresent && !errors.years && !errors.months && totalMonths <= 0) {
    errors[hasYears ? "years" : "months"] = "termPositive";
  }

  const isComplete = hasAmount && termIsPresent && hasRate;
  if (!isComplete || Object.keys(errors).length > 0) {
    return { errors, result: null };
  }

  const monthlyRate = rate! / 100 / 12;
  const monthlyPayment = monthlyPaymentFor(amount!, monthlyRate, totalMonths);

  // Totals come from the unrounded payment, not the rounded one shown in the
  // UI. Rounding first would make a 0% loan report a couple of cents of
  // interest, which reads as a bug; the cost is that multiplying the displayed
  // payment by the term can differ from the displayed total by well under a
  // euro. This is an estimate, so the clean 0% case wins.
  const totalPaid = monthlyPayment * totalMonths;

  // Belt and braces: the caps above make an overflow unreachable, but a
  // non-finite number must never reach the UI as a formatted euro amount.
  if (!Number.isFinite(monthlyPayment) || !Number.isFinite(totalPaid)) {
    return { errors, result: null };
  }

  return {
    errors,
    result: {
      monthlyPayment,
      totalPaid,
      totalInterest: totalPaid - amount!,
      totalMonths,
    },
  };
};
