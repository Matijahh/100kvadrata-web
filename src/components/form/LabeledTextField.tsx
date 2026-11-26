"use client";

import HideIcon from "@assets/icons/hide-icon.svg";
import ShowIcon from "@assets/icons/show-icon.svg";
import { cn } from "@/lib/cn";
import { useId, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";

// Web counterpart of flatswipe/src/components/form/LabeledTextField.tsx: the
// same muted pill input with a light label above and an optional hint below.

type LabeledTextFieldProps = Omit<ComponentProps<"input">, "onChange"> & {
  label: string;
  /** A short explanation under the input, for fields whose effect isn't obvious. */
  hint?: string;
  onChangeText?: (value: string) => void;
  /** Rendered inside the pill on the right (e.g. a show/hide toggle). */
  trailing?: React.ReactNode;
  /** Shown under the field in the error colour; marks the input invalid. */
  error?: string;
};

export function LabeledTextField({
  label,
  hint,
  onChangeText,
  trailing,
  error,
  className,
  id,
  ...inputProps
}: LabeledTextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="mb-[15px]">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-light text-form-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChangeText?.(event.target.value)}
          className={cn(
            "w-full rounded-[25px] border border-transparent bg-surface-muted px-[15px] py-[15px] text-base text-text",
            "placeholder:text-placeholder focus:border-primary-soft focus:outline-none",
            "disabled:cursor-not-allowed disabled:text-text-muted disabled:opacity-70",
            trailing && "pr-12",
            error && "border-destructive focus:border-destructive",
            className,
          )}
          {...inputProps}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 px-[15px] text-xs font-semibold leading-[17px] text-destructive">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="mt-1.5 px-[15px] text-xs font-light leading-[17px] text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A LabeledTextField for passwords, with the app's show / hide eye toggle. */
export function PasswordField(
  props: Omit<LabeledTextFieldProps, "type" | "trailing">,
) {
  const { t } = useTranslation();
  const [isVisible, setVisible] = useState(false);
  const Icon = isVisible ? HideIcon : ShowIcon;

  return (
    <LabeledTextField
      {...props}
      type={isVisible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={isVisible ? t("web.auth.hidePassword") : t("web.auth.showPassword")}
          aria-pressed={isVisible}
          className="rounded-full p-1.5 text-primary hover:bg-surface"
        >
          <Icon width={22} height={22} aria-hidden />
        </button>
      }
    />
  );
}
