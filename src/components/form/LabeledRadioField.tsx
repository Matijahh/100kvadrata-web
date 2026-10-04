"use client";

import { cn } from "@/lib/cn";
import { useId } from "react";

type RadioOption<T extends string> = {
  label: string;
  value: T;
};

type LabeledRadioFieldProps<T extends string> = {
  label: string;
  options: [RadioOption<T>, RadioOption<T>];
  value: T | null;
  onChange: (value: T | null) => void;
  /** Whether choosing the selected option again clears it. Off for required fields. */
  allowEmpty?: boolean;
  disabled?: boolean;
  /** One option under the other — for narrow columns like the feed's filter panel. */
  stacked?: boolean;
  className?: string;
};

/**
 * Pick one of two — web counterpart of the app's LabeledRadioField. Same bail-
 * out: on an optional field, choosing what is already chosen takes it back.
 */
export function LabeledRadioField<T extends string>({
  label,
  options,
  value,
  onChange,
  allowEmpty = false,
  disabled = false,
  stacked = false,
  className,
}: LabeledRadioFieldProps<T>) {
  const labelId = useId();

  return (
    <div className={cn("mb-[15px]", className)}>
      <span id={labelId} className="mb-1.5 block text-sm font-light text-form-label">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={cn("flex gap-3", stacked && "flex-col gap-2")}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => {
                if (isSelected) {
                  onChange(allowEmpty ? null : option.value);
                  return;
                }
                onChange(option.value);
              }}
              className={cn(
                "flex min-h-[54px] flex-1 items-center gap-2.5 rounded-[25px] border border-transparent bg-surface-muted px-4 py-3.5",
                stacked ? "justify-start" : "justify-center",
                "text-[15px] text-text transition-colors disabled:opacity-70",
                isSelected && "border-primary bg-surface font-semibold text-primary",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-placeholder",
                  isSelected && "border-primary",
                )}
              >
                {isSelected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
