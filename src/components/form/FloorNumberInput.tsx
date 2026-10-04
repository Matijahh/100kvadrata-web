"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";

type FloorNumberInputProps = {
  value?: number | null;
  onChange: (value: string) => void;
};

/**
 * The number behind the "Other (enter a number)" storey, rendered under that
 * option inside the storey picker. One number, not a range — a listing sits on
 * a single floor. Web counterpart of the app's FloorNumberInput.
 */
export function FloorNumberInput({ value, onChange }: FloorNumberInputProps) {
  const { t } = useTranslation();
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-light text-form-label">
        {t("feed.filterForm.floorNumberLabel")}
      </label>
      <input
        id={inputId}
        value={value == null ? "" : String(value)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("feed.filterForm.floorNumberPlaceholder")}
        inputMode="numeric"
        className="min-h-11 w-full rounded-[22px] bg-surface px-3.5 py-2.5 text-[15px] text-text placeholder:text-placeholder focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
      />
    </div>
  );
}
