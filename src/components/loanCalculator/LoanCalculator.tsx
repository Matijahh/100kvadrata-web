"use client";

import { LabeledTextField } from "@/components/form/LabeledTextField";
import { cn } from "@/lib/cn";
import { EMPTY_LOAN_INPUT, evaluateLoan, type LoanField, type LoanInput } from "@/utils/loanCalculator";
import { sanitizeDecimalInput, sanitizeIntegerInput } from "@/utils/numericInput";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// Same "1,234.56 €" form the app uses, pinned to en-US grouping so numbers do
// not change shape with the language.
const formatEur = (value: number) =>
  `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/**
 * What buyers get on the second tab — web port of the app's
 * LoanCalculatorScreen. All the maths is the shared utils/loanCalculator.
 */
export function LoanCalculator() {
  const { t } = useTranslation();
  const [input, setInput] = useState<LoanInput>(EMPTY_LOAN_INPUT);
  const { errors, result } = useMemo(() => evaluateLoan(input), [input]);

  const setField = (field: keyof LoanInput, value: string) =>
    setInput((current) => ({ ...current, [field]: value }));

  const errorFor = (field: LoanField) => {
    const code = errors[field];
    return code ? t(`loanCalculator.errors.${code}`) : null;
  };
  const termError = errorFor("years") ?? errorFor("months");

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-6 md:px-8 md:pt-10">
      <h1 className="mb-6 font-display text-3xl text-text">{t("loanCalculator.title")}</h1>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[32px] bg-surface p-6">
          <h2 className="font-display text-lg text-text">{t("loanCalculator.sectionTitle")}</h2>
          <p className="mb-5 mt-1 text-sm text-text-muted">{t("loanCalculator.intro")}</p>
          <LabeledTextField
            label={t("loanCalculator.amountLabel")}
            placeholder={t("loanCalculator.amountPlaceholder")}
            value={input.amountEur}
            onChangeText={(value) => setField("amountEur", sanitizeDecimalInput(value))}
            inputMode="decimal"
            hint={errorFor("amount") ?? undefined}
          />
          <p className="mb-1.5 text-sm font-light text-form-label">{t("loanCalculator.termLabel")}</p>
          <div className="grid grid-cols-2 gap-3">
            <LabeledTextField
              label={t("loanCalculator.years")}
              placeholder="0"
              value={input.years}
              onChangeText={(value) => setField("years", sanitizeIntegerInput(value))}
              inputMode="numeric"
            />
            <LabeledTextField
              label={t("loanCalculator.months")}
              placeholder="0"
              value={input.months}
              onChangeText={(value) => setField("months", sanitizeIntegerInput(value))}
              inputMode="numeric"
            />
          </div>
          {termError ? <p className="-mt-2 mb-3 px-[15px] text-xs text-destructive">{termError}</p> : null}
          <LabeledTextField
            label={t("loanCalculator.rateLabel")}
            placeholder={t("loanCalculator.ratePlaceholder")}
            value={input.annualRatePercent}
            onChangeText={(value) => setField("annualRatePercent", sanitizeDecimalInput(value))}
            inputMode="decimal"
            hint={errorFor("rate") ?? undefined}
          />
        </section>

        <section
          aria-live="polite"
          className={cn(
            "flex flex-col justify-center rounded-[32px] p-6",
            result ? "bg-primary text-text-on-primary" : "bg-surface",
          )}
        >
          {result ? (
            <>
              <p className="text-sm opacity-80">{t("loanCalculator.monthlyPayment")}</p>
              <p className="mb-6 mt-1 font-display text-4xl">{formatEur(result.monthlyPayment)}</p>
              <dl className="flex flex-col gap-3">
                {[
                  [t("loanCalculator.totalPaid"), formatEur(result.totalPaid)],
                  [t("loanCalculator.totalInterest"), formatEur(result.totalInterest)],
                  [t("loanCalculator.paymentsCount"), String(result.totalMonths)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 border-t border-white/20 pt-3">
                    <dt className="opacity-80">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-xs opacity-70">{t("loanCalculator.disclaimer")}</p>
            </>
          ) : (
            <p className="text-center text-sm text-text-muted">{t("loanCalculator.emptyState")}</p>
          )}
        </section>
      </div>
    </div>
  );
}
