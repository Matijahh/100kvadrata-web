"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";

/** Kept in step with user_preferences_description_length_check. */
export const PREFERENCE_DESCRIPTION_MAX_LENGTH = 300;

/**
 * The buyer's own words for what they are looking for — the first thing a
 * seller reads on their card. Web counterpart of the app's field.
 */
export function PreferenceDescriptionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const hintId = `${inputId}-hint`;

  return (
    <div className="mb-5 rounded-3xl border border-primary-soft bg-surface p-4">
      <label htmlFor={inputId} className="font-display text-base text-text">
        {t("preferences.descriptionLabel")}
      </label>
      <p id={hintId} className="mb-3 mt-1 text-[13px] leading-[18px] text-text-muted">
        {t("preferences.descriptionHint")}
      </p>
      <textarea
        id={inputId}
        aria-describedby={hintId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("preferences.descriptionPlaceholder")}
        maxLength={PREFERENCE_DESCRIPTION_MAX_LENGTH}
        rows={4}
        className="min-h-[110px] w-full resize-y rounded-[20px] bg-surface-muted px-[15px] py-3.5 text-base leading-[22px] text-text placeholder:text-placeholder focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
      />
      <p className="mt-1.5 text-right text-xs font-light text-text-muted">
        {value.length}/{PREFERENCE_DESCRIPTION_MAX_LENGTH}
      </p>
    </div>
  );
}
